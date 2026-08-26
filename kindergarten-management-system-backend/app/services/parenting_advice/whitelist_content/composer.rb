require "json"

module ParentingAdvice
  module WhitelistContent
    class Composer
      SUMMARY_MIN_LENGTH = 60
      SUMMARY_MAX_LENGTH = 100
      ANALYSIS_MIN_LENGTH = 120
      ANALYSIS_MAX_LENGTH = 180
      MAX_AI_ATTEMPTS = 3

      ANALYSIS_SUPPLEMENT = "家长可结合孩子的年龄与个体差异，从一个小步骤开始实践，持续观察反馈并逐步调整；如遇持续异常或健康疑问，请及时咨询专业人员。".freeze
      ANALYSIS_FALLBACK = "本期内容共同提醒家长，育儿实践应以孩子的发展阶段和真实需要为基础，把营养、作息、亲子互动与安全照护落实到稳定的小习惯中。建议每次只调整一个环节，给予孩子清晰而温和的回应，并持续观察情绪、睡眠、饮食和活动变化，再根据反馈逐步优化家庭安排。如出现持续异常、明显不适或健康疑问，请及时咨询儿科医生、妇幼保健或公共卫生专业人员。".freeze

      SYSTEM_PROMPT = <<~PROMPT.squish
        你是幼儿园家长邮件的育儿内容编辑。只基于用户提供的白名单来源材料生成内容；
        不转载原文，不编造来源，不做医疗诊断，不承诺治疗效果。表达要温和、实用、面向中国幼儿园家长；
        如涉及严重健康问题、持续异常或紧急情况，应提醒家长咨询儿科医生、妇幼保健或公共卫生专业人士。
      PROMPT

      OUTPUT_PROMPT = <<~PROMPT.squish
        请输出严格 JSON，不要 Markdown。字段：
        {"items":[{"url":"原链接","summary":"每条 60-100 个中文字符的短摘要"}],"analysis":"140-160 个中文字符的综合分析"}。
        每条摘要必须帮助家长理解“这条内容为什么值得看”和一个可执行提醒；综合分析应归纳共同主题和家庭实践建议。
        请在输出前按清理空白后的字符数自检；综合分析允许范围为 120-180 个字符，但应以 140-160 个字符为目标。
      PROMPT

      class CompositionError < StandardError; end

      def initialize(schedule:, delivery:, selector: Selector.new, fetcher: Fetcher.new, llm_client: DeepseekClient.new(max_tokens: 1200))
        @schedule = schedule
        @delivery = delivery
        @selector = selector
        @fetcher = fetcher
        @llm_client = llm_client
      end

      def call
        items = @selector.select
        llm_result = generate_ai_content(items)
        snapshots = save_snapshots(items, llm_result)

        {
          title: @schedule.title.presence || "本期育儿精选",
          body: build_text_body(snapshots, llm_result.fetch(:analysis)),
          content_items: snapshots.map { |snapshot| snapshot.attributes.symbolize_keys },
          ai_analysis: llm_result.fetch(:analysis),
          ai_prompt_snapshot: prompt_audit_snapshot(items)
        }
      end

      private

      def generate_ai_content(items)
        retry_feedback = nil

        MAX_AI_ATTEMPTS.times do |attempt|
          begin
            response = @llm_client.chat(messages: prompt_messages(items, retry_feedback: retry_feedback))
            return parse_ai_response(
              response.fetch(:content),
              items,
              allow_analysis_fallback: attempt == MAX_AI_ATTEMPTS - 1
            )
          rescue CompositionError => error
            retry_feedback = error.message
            raise error if attempt == MAX_AI_ATTEMPTS - 1
          end
        end
      rescue DeepseekClient::Error => error
        raise CompositionError, "AI content generation failed: #{error.message}"
      end

      def prompt_messages(items, retry_feedback: nil)
        payload = {
          instructions: OUTPUT_PROMPT,
          validation_rules: {
            summary_length: "#{SUMMARY_MIN_LENGTH}-#{SUMMARY_MAX_LENGTH}",
            analysis_length: "#{ANALYSIS_MIN_LENGTH}-#{ANALYSIS_MAX_LENGTH}",
            analysis_target_length: "140-160",
            length_unit: "characters"
          },
          items: items.map { |item| ai_item_payload(item) }
        }
        payload[:validation_feedback] = retry_feedback if retry_feedback.present?

        [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: JSON.pretty_generate(payload)
          }
        ]
      end

      def ai_item_payload(item)
        {
          title: item.title,
          source: item.source,
          date: item.date&.iso8601,
          url: item.url,
          topic: item.topic,
          age_group: item.age_group,
          excerpt: transient_excerpt(item)
        }
      end

      def transient_excerpt(item)
        excerpt = @fetcher.excerpt_for(item.url)
        excerpt.presence || item.title
      end

      def parse_ai_response(content, items, allow_analysis_fallback: false)
        parsed = JSON.parse(strip_json_fence(content))
        summaries = Array(parsed["items"])
        analysis = parsed["analysis"].to_s.squish
        raise CompositionError, "AI analysis is blank" if analysis.blank?
        analysis = normalize_analysis_length(analysis) if allow_analysis_fallback
        validate_length!("AI analysis", analysis, ANALYSIS_MIN_LENGTH, ANALYSIS_MAX_LENGTH)

        ordered_summaries = items.each_with_index.map do |item, index|
          summary_for_item(item, summaries, index)
        end

        { summaries: ordered_summaries, analysis: analysis }
      rescue JSON::ParserError
        raise CompositionError, "AI returned invalid JSON"
      end

      def normalize_analysis_length(analysis)
        return analysis if analysis.length.between?(ANALYSIS_MIN_LENGTH, ANALYSIS_MAX_LENGTH)

        if analysis.length < ANALYSIS_MIN_LENGTH
          separator = analysis.match?(/[。！？!?]\z/) ? "" : "。"
          extended = "#{analysis}#{separator}#{ANALYSIS_SUPPLEMENT}"
          return extended if extended.length.between?(ANALYSIS_MIN_LENGTH, ANALYSIS_MAX_LENGTH)
        end

        ANALYSIS_FALLBACK
      end

      def summary_for_item(item, summaries, index)
        matched = summaries.find { |summary| summary["url"].to_s == item.url } || summaries[index]
        text = matched&.fetch("summary", nil).to_s.squish
        raise CompositionError, "AI summary is blank for #{item.url}" if text.blank?
        validate_length!("AI summary for #{item.url}", text, SUMMARY_MIN_LENGTH, SUMMARY_MAX_LENGTH)

        text
      end

      def validate_length!(label, text, min_length, max_length)
        length = text.to_s.length
        return if length.between?(min_length, max_length)

        raise CompositionError, "#{label} length #{length} is outside #{min_length}-#{max_length}"
      end

      def strip_json_fence(content)
        content.to_s.strip
          .sub(/\A```(?:json)?\s*/i, "")
          .sub(/\s*```\z/, "")
      end

      def save_snapshots(items, llm_result)
        @delivery.delivery_content_items.destroy_all

        snapshots = []
        ParentingAdviceDelivery.transaction do
          items.each_with_index do |item, index|
            snapshots << @delivery.delivery_content_items.create!(
              parenting_advice_content_item: item,
              position: index + 1,
              title: item.title,
              source: item.source,
              date: item.date,
              url: item.url,
              thumbnail: item.thumbnail,
              topic: item.topic,
              age_group: item.age_group,
              summary: llm_result.fetch(:summaries)[index]
            )
          end

          @delivery.update!(
            ai_analysis: llm_result.fetch(:analysis),
            ai_prompt_snapshot: prompt_audit_snapshot(items)
          )
        end

        snapshots
      end

      def prompt_audit_snapshot(items)
        JSON.pretty_generate(
          system_prompt: SYSTEM_PROMPT,
          output_prompt: OUTPUT_PROMPT,
          saved_item_fields: %w[title source date url thumbnail topic age_group],
          item_metadata: items.map do |item|
            {
              title: item.title,
              source: item.source,
              date: item.date&.iso8601,
              url: item.url,
              thumbnail: item.thumbnail,
              topic: item.topic,
              age_group: item.age_group
            }
          end
        )
      end

      def build_text_body(snapshots, analysis)
        lines = ["本期育儿精选", ""]
        snapshots.each do |item|
          lines << "#{item.position}. #{item.title}"
          lines << "来源：#{item.source} | 日期：#{item.date} | 主题：#{item.topic} | 适龄段：#{item.age_group}"
          lines << "AI 摘要：#{item.summary}"
          lines << "原链接：#{item.url}"
          lines << ""
        end
        lines << "AI 综合分析：#{analysis}"
        lines << ""
        lines << "提示：本邮件仅用于家庭育儿信息参考，不替代专业医疗诊断或治疗建议。"
        lines.join("\n")
      end
    end
  end
end
