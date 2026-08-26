require "test_helper"

class ParentingAdviceWhitelistContentTest < ActiveSupport::TestCase
  def setup
    ParentingAdviceDeliveryContentItem.delete_all
    ParentingAdviceDeliveryRecipient.delete_all
    ParentingAdviceDelivery.delete_all
    ParentingAdviceContentItem.delete_all
    ParentingAdviceScheduleRecipient.delete_all
    ParentingAdviceSchedule.delete_all
    Admin.delete_all

    @admin = Admin.create!(
      first_name: "System",
      last_name: "Admin",
      email: "whitelist-admin@example.com",
      phone_number: "0000000000",
      password: "admin123"
    )
  end

  test "source registry only accepts whitelist urls" do
    assert ParentingAdvice::WhitelistContent::SourceRegistry.whitelisted_url?("https://www.unicef.cn/parenting-site")
    assert ParentingAdvice::WhitelistContent::SourceRegistry.whitelisted_url?("https://www.cdc.gov/child-development/positive-parenting-tips/index.html")
    assert_not ParentingAdvice::WhitelistContent::SourceRegistry.whitelisted_url?("https://example.com/parenting")
  end

  test "selector falls back to evergreen saved content" do
    items = create_content_items(Date.current - 60.days)
    selector = ParentingAdvice::WhitelistContent::Selector.new(fetcher: NullFetcher.new)

    assert_equal items.map(&:id).sort, selector.select.map(&:id).sort
  end

  test "composer saves delivery item snapshots and prompt audit without excerpts" do
    schedule = whitelist_schedule
    delivery = schedule.deliveries.create!(
      scheduled_run_at: Time.current,
      status: ParentingAdviceDelivery::RUNNING,
      started_at: Time.current
    )
    items = create_content_items(Date.current)
    llm_client = FakeLlmClient.new(items)
    fetcher = FakeExcerptFetcher.new("temporary source excerpt that must not be saved")

    result = ParentingAdvice::WhitelistContent::Composer.new(
      schedule: schedule,
      delivery: delivery,
      selector: StaticSelector.new(items),
      fetcher: fetcher,
      llm_client: llm_client
    ).call

    assert_equal "本期育儿精选", result[:title]
    assert_equal 3, delivery.delivery_content_items.count
    assert_equal 3, result[:content_items].count
    assert_equal FakeLlmClient::VALID_ANALYSIS, delivery.ai_analysis
    assert_includes delivery.ai_prompt_snapshot, "不做医疗诊断"
    assert_not_includes delivery.ai_prompt_snapshot, "temporary source excerpt"
    assert delivery.delivery_content_items.order(:position).all? { |item| item.summary.present? && item.url.present? }
    assert delivery.delivery_content_items.order(:position).all? { |item| item.summary.length.between?(60, 100) }
    assert delivery.ai_analysis.length.between?(120, 180)
  end

  test "composer retries when ai output violates length rules" do
    schedule = whitelist_schedule
    delivery = schedule.deliveries.create!(
      scheduled_run_at: Time.current,
      status: ParentingAdviceDelivery::RUNNING,
      started_at: Time.current
    )
    items = create_content_items(Date.current)
    llm_client = RetryLlmClient.new(items)

    ParentingAdvice::WhitelistContent::Composer.new(
      schedule: schedule,
      delivery: delivery,
      selector: StaticSelector.new(items),
      fetcher: FakeExcerptFetcher.new("temporary source excerpt"),
      llm_client: llm_client
    ).call

    assert_equal 2, llm_client.calls
    assert_includes llm_client.messages.last.last[:content], "validation_feedback"
    assert delivery.delivery_content_items.order(:position).all? { |item| item.summary.length.between?(60, 100) }
    assert delivery.ai_analysis.length.between?(120, 180)
  end

  test "composer safely extends a slightly short analysis on the final attempt" do
    schedule = whitelist_schedule
    delivery = schedule.deliveries.create!(
      scheduled_run_at: Time.current,
      status: ParentingAdviceDelivery::RUNNING,
      started_at: Time.current
    )
    items = create_content_items(Date.current)
    llm_client = PersistentlyShortAnalysisLlmClient.new(items)

    ParentingAdvice::WhitelistContent::Composer.new(
      schedule: schedule,
      delivery: delivery,
      selector: StaticSelector.new(items),
      fetcher: FakeExcerptFetcher.new("temporary source excerpt"),
      llm_client: llm_client
    ).call

    assert_equal 3, llm_client.calls
    assert delivery.ai_analysis.start_with?(PersistentlyShortAnalysisLlmClient::SHORT_ANALYSIS)
    assert_includes delivery.ai_analysis, ParentingAdvice::WhitelistContent::Composer::ANALYSIS_SUPPLEMENT
    assert delivery.ai_analysis.length.between?(120, 180)
  end

  private

  class NullFetcher
    def refresh!
      []
    end
  end

  class StaticSelector
    def initialize(items)
      @items = items
    end

    def select
      @items
    end
  end

  class FakeExcerptFetcher
    def initialize(excerpt)
      @excerpt = excerpt
    end

    def excerpt_for(_url)
      @excerpt
    end
  end

  class FakeLlmClient
    VALID_SUMMARY = "s" * 70
    VALID_ANALYSIS = "a" * 140

    def initialize(items)
      @items = items
    end

    def chat(messages:)
      payload = {
        items: @items.map do |item|
          {
            url: item.url,
            summary: VALID_SUMMARY
          }
        end,
        analysis: VALID_ANALYSIS
      }
      { content: JSON.generate(payload), model: "fake", usage: {} }
    end
  end

  class RetryLlmClient < FakeLlmClient
    attr_reader :calls, :messages

    def initialize(items)
      super
      @calls = 0
      @messages = []
    end

    def chat(messages:)
      @calls += 1
      @messages << messages
      return super unless @calls == 1

      payload = {
        items: @items.map { |item| { url: item.url, summary: "short" } },
        analysis: "short"
      }
      { content: JSON.generate(payload), model: "fake", usage: {} }
    end
  end

  class PersistentlyShortAnalysisLlmClient < FakeLlmClient
    SHORT_ANALYSIS = "a" * 117

    attr_reader :calls

    def initialize(items)
      super
      @calls = 0
    end

    def chat(messages:)
      @calls += 1
      payload = {
        items: @items.map { |item| { url: item.url, summary: VALID_SUMMARY } },
        analysis: SHORT_ANALYSIS
      }
      { content: JSON.generate(payload), model: "fake", usage: {} }
    end
  end

  def whitelist_schedule
    ParentingAdviceSchedule.create!(
      admin: @admin,
      title: "本期育儿精选",
      body: "",
      source_type: ParentingAdviceSchedule::WHITELIST_SOURCE,
      recurrence: ParentingAdviceSchedule::DAILY,
      send_time: "08:00"
    )
  end

  def create_content_items(date)
    [
      ["UNICEF 中国", "https://www.unicef.cn/parenting-site", "亲子互动", "0-6岁"],
      ["中国营养学会", "https://www.cnsoc.org/knowledge/", "营养喂养", "3-6岁"],
      ["CDC", "https://www.cdc.gov/child-development/positive-parenting-tips/infants.html", "早期发展", "0-1岁"]
    ].map.with_index do |(source, url, topic, age_group), index|
      ParentingAdviceContentItem.create!(
        title: "育儿内容 #{index + 1}",
        source: source,
        date: date,
        url: url,
        thumbnail: nil,
        topic: topic,
        age_group: age_group
      )
    end
  end
end
