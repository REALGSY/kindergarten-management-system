require "test_helper"

class ParentingAdviceScheduleRunnerTest < ActiveSupport::TestCase
  include ActiveSupport::Testing::TimeHelpers

  def setup
    ActionMailer::Base.deliveries.clear
    ParentingAdviceDeliveryContentItem.delete_all
    ParentingAdviceDeliveryRecipient.delete_all
    ParentingAdviceDelivery.delete_all
    ParentingAdviceContentItem.delete_all
    ParentingAdviceScheduleRecipient.delete_all
    ParentingAdviceSchedule.delete_all
    ExternalEmailRecipient.delete_all
    ParentStudent.delete_all
    Parent.delete_all
    Admin.delete_all

    @admin = Admin.create!(
      first_name: "System",
      last_name: "Admin",
      email: "runner-admin@example.com",
      phone_number: "0000000000",
      password: "admin123"
    )
  end

  teardown do
    travel_back
    ActionMailer::Base.deliveries.clear
  end

  test "records failed delivery when QQ SMTP is missing" do
    without_smtp_env do
      schedule = due_daily_schedule

      processed = ParentingAdvice::ScheduleRunner.run_due(now: Time.current)

      assert_equal 1, processed
      assert_equal 0, ActionMailer::Base.deliveries.count
      delivery = schedule.deliveries.last
      assert_equal ParentingAdviceDelivery::FAILED, delivery.status
      assert_equal ParentingAdvice::SmtpConfig::MISSING_MESSAGE, delivery.error_message
      assert_equal 1, delivery.delivery_recipients.count
      assert_equal ParentingAdviceDeliveryRecipient::FAILED, delivery.delivery_recipients.first.status
      assert_operator schedule.reload.next_run_at, :>, Time.current
    end
  end

  test "sends one email per recipient when QQ SMTP is configured" do
    with_smtp_env do
      schedule = due_daily_schedule
      schedule.schedule_recipients.create!(
        recipient_type: ParentingAdviceScheduleRecipient::EXTERNAL,
        recipient_id: nil,
        name: "Second",
        email: "second@example.com"
      )

      processed = ParentingAdvice::ScheduleRunner.run_due(now: Time.current)

      assert_equal 1, processed
      assert_equal 2, ActionMailer::Base.deliveries.count
      assert_equal ["family@example.com", "second@example.com"], ActionMailer::Base.deliveries.map { |mail| mail.to.first }.sort
      delivery = schedule.deliveries.last
      assert_equal ParentingAdviceDelivery::SUCCEEDED, delivery.status
      assert_equal 2, delivery.sent_count
      assert_equal 0, delivery.failed_count
    end
  end

  test "one time schedule completes after due send" do
    with_smtp_env do
      travel_to Time.zone.local(2026, 7, 6, 1, 0, 0) do
        schedule = ParentingAdviceSchedule.create!(
          admin: @admin,
          title: "One-time tip",
          body: "Try a short reading activity tonight.",
          recurrence: ParentingAdviceSchedule::ONE_TIME,
          scheduled_at: 1.hour.from_now
        )
        schedule.schedule_recipients.create!(
          recipient_type: ParentingAdviceScheduleRecipient::EXTERNAL,
          recipient_id: nil,
          name: "Family",
          email: "family@example.com"
        )
        schedule.update_column(:next_run_at, 1.minute.ago)

        ParentingAdvice::ScheduleRunner.run_due(now: Time.current)

        assert_equal ParentingAdviceSchedule::COMPLETED, schedule.reload.status
        assert_nil schedule.next_run_at
      end
    end
  end

  test "whitelist schedule fails without sending when AI content generation fails" do
    with_smtp_env do
      schedule = due_daily_schedule(
        source_type: ParentingAdviceSchedule::WHITELIST_SOURCE,
        title: "本期育儿精选",
        body: ""
      )
      fake_composer = Object.new
      fake_composer.define_singleton_method(:call) do
        raise ParentingAdvice::WhitelistContent::Composer::CompositionError, "AI returned invalid JSON"
      end

      original_new = ParentingAdvice::WhitelistContent::Composer.method(:new)
      ParentingAdvice::WhitelistContent::Composer.define_singleton_method(:new) { |*_args, **_kwargs| fake_composer }

      begin
        processed = ParentingAdvice::ScheduleRunner.run_due(now: Time.current)

        assert_equal 1, processed
        assert_equal 0, ActionMailer::Base.deliveries.count
        delivery = schedule.deliveries.last
        assert_equal ParentingAdviceDelivery::FAILED, delivery.status
        assert_match "AI returned invalid JSON", delivery.error_message
        assert_equal 0, delivery.delivery_recipients.count
      ensure
        ParentingAdvice::WhitelistContent::Composer.define_singleton_method(:new) do |*args, **kwargs, &block|
          original_new.call(*args, **kwargs, &block)
        end
      end
    end
  end

  private

  def due_daily_schedule(source_type: ParentingAdviceSchedule::CUSTOM_SOURCE, title: "Morning tip", body: "Talk about the day before school.")
    schedule = ParentingAdviceSchedule.create!(
      admin: @admin,
      title: title,
      body: body,
      source_type: source_type,
      recurrence: ParentingAdviceSchedule::DAILY,
      send_time: "08:00"
    )
    schedule.schedule_recipients.create!(
      recipient_type: ParentingAdviceScheduleRecipient::EXTERNAL,
      recipient_id: nil,
      name: "Family",
      email: "family@example.com"
    )
    schedule.update_column(:next_run_at, 1.minute.ago)
    schedule
  end

  def without_smtp_env(&block)
    with_env("QQ_SMTP_USER" => nil, "QQ_SMTP_PASSWORD" => nil, &block)
  end

  def with_smtp_env(&block)
    with_env("QQ_SMTP_USER" => "sender@example.com", "QQ_SMTP_PASSWORD" => "test-password", &block)
  end

  def with_env(values)
    previous = values.keys.to_h { |key| [key, ENV[key]] }
    values.each do |key, value|
      value.nil? ? ENV.delete(key) : ENV[key] = value
    end
    yield
  ensure
    previous.each do |key, value|
      value.nil? ? ENV.delete(key) : ENV[key] = value
    end
  end
end
