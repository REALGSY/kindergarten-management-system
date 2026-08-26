require "json"

namespace :parenting_advice do
  desc "Send due parenting advice email schedules"
  task send_due: :environment do
    processed = ParentingAdvice::ScheduleRunner.run_due
    puts "Processed #{processed} parenting advice schedules"
  end

  desc "Send one whitelist parenting advice test email"
  task send_whitelist_test: :environment do
    email = ENV.fetch("TEST_EMAIL", "1591799424@qq.com").to_s.strip.downcase
    abort "TEST_EMAIL is blank" if email.blank?

    recipient = ExternalEmailRecipient.find_or_initialize_by(email: email)
    recipient.name = "Whitelist parenting advice test"
    recipient.active = true
    recipient.save!

    schedule = ParentingAdviceSchedule.create!(
      title: "本期育儿精选",
      body: "",
      source_type: ParentingAdviceSchedule::WHITELIST_SOURCE,
      recurrence: ParentingAdviceSchedule::ONE_TIME,
      scheduled_at: 5.minutes.from_now
    )
    schedule.schedule_recipients.create!(
      recipient_type: ParentingAdviceScheduleRecipient::EXTERNAL,
      recipient_id: recipient.id,
      name: recipient.name,
      email: recipient.email
    )
    schedule.update_column(:next_run_at, 1.minute.ago)

    processed = ParentingAdvice::ScheduleRunner.run_due(now: Time.current)
    delivery = schedule.deliveries.order(created_at: :desc).first
    abort "No delivery was created" unless delivery

    delivery.reload
    puts JSON.pretty_generate(
      processed: processed,
      schedule_id: schedule.id,
      delivery_id: delivery.id,
      status: delivery.status,
      sent_count: delivery.sent_count,
      failed_count: delivery.failed_count,
      error_message: delivery.error_message,
      email_subject: delivery.email_subject,
      email_text_snapshot_chars: delivery.email_text_snapshot.to_s.length,
      email_html_snapshot_chars: delivery.email_html_snapshot.to_s.length,
      ai_analysis: delivery.ai_analysis,
      prompt_mentions_non_diagnostic: delivery.ai_prompt_snapshot.to_s.include?("不做医疗诊断"),
      content_items: delivery.delivery_content_items.order(:position).map do |item|
        {
          position: item.position,
          title: item.title,
          source: item.source,
          date: item.date,
          url: item.url,
          thumbnail: item.thumbnail,
          topic: item.topic,
          age_group: item.age_group,
          summary: item.summary
        }
      end
    )

    abort "Whitelist test delivery failed: #{delivery.error_message}" unless delivery.status == ParentingAdviceDelivery::SUCCEEDED
  end
end
