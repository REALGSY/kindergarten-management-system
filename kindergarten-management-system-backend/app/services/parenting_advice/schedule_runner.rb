module ParentingAdvice
  class ScheduleRunner
    def self.run_due(now: Time.current)
      new(now: now).run_due
    end

    def self.run(schedule, now: Time.current)
      new(now: now).run(schedule)
    end

    def initialize(now:)
      @now = now
    end

    def run_due
      processed = 0
      ParentingAdviceSchedule.due(@now).find_each do |schedule|
        processed += 1 if run_schedule(schedule)
      end
      processed
    end

    def run(schedule)
      run_schedule(schedule)
    end

    private

    def run_schedule(schedule)
      schedule.reload
      return false unless schedule.active? && schedule.next_run_at.present? && schedule.next_run_at <= @now

      delivery = create_delivery(schedule)
      return false unless delivery

      send_delivery(schedule, delivery)
      schedule.advance_after!(after: Time.current)
      true
    end

    def create_delivery(schedule)
      schedule.deliveries.create!(
        scheduled_run_at: schedule.next_run_at,
        status: ParentingAdviceDelivery::RUNNING,
        started_at: Time.current
      )
    rescue ActiveRecord::RecordNotUnique, ActiveRecord::RecordInvalid
      nil
    end

    def send_delivery(schedule, delivery)
      recipients = deduped_recipients(schedule)

      if recipients.empty?
        delivery.finish!(sent_count: 0, failed_count: 0, error_message: "No recipients configured")
        return
      end

      content = ParentingAdvice::ContentSource.content_for(schedule, delivery: delivery)
    rescue StandardError => error
      delivery.finish!(sent_count: 0, failed_count: 0, error_message: error.message)
      return
    else

      sent_count = 0
      failed_count = 0
      smtp_configured = ParentingAdvice::SmtpConfig.configured?

      recipients.each do |recipient|
        result = deliver_to_recipient(delivery, recipient, content, smtp_configured)
        sent_count += 1 if result == ParentingAdviceDeliveryRecipient::SUCCEEDED
        failed_count += 1 if result == ParentingAdviceDeliveryRecipient::FAILED
      end

      delivery.finish!(
        sent_count: sent_count,
        failed_count: failed_count,
        error_message: smtp_configured ? nil : ParentingAdvice::SmtpConfig::MISSING_MESSAGE
      )
    end

    def deduped_recipients(schedule)
      seen = {}
      schedule.schedule_recipients.order(:id).filter_map do |recipient|
        normalized_email = recipient.email.to_s.strip.downcase
        next if normalized_email.blank? || seen[normalized_email]

        seen[normalized_email] = true
        recipient
      end
    end

    def deliver_to_recipient(delivery, recipient, content, smtp_configured)
      delivery_recipient = delivery.delivery_recipients.build(
        name: recipient.name,
        email: recipient.email
      )

      mail = ParentingAdviceMailer
        .with(
          to: recipient.email,
          subject: content[:title],
          body: content[:body],
          content_items: content[:content_items],
          ai_analysis: content[:ai_analysis]
        )
        .advice_email

      record_delivery_snapshot(delivery, mail, content)

      unless smtp_configured
        delivery_recipient.status = ParentingAdviceDeliveryRecipient::FAILED
        delivery_recipient.error_message = ParentingAdvice::SmtpConfig::MISSING_MESSAGE
        delivery_recipient.save!
        return delivery_recipient.status
      end

      mail.deliver_now

      delivery_recipient.status = ParentingAdviceDeliveryRecipient::SUCCEEDED
      delivery_recipient.sent_at = Time.current
      delivery_recipient.save!
      delivery_recipient.status
    rescue StandardError => error
      delivery_recipient.status = ParentingAdviceDeliveryRecipient::FAILED
      delivery_recipient.error_message = error.message
      delivery_recipient.save!
      delivery_recipient.status
    end

    def record_delivery_snapshot(delivery, mail, content)
      return if delivery.email_subject.present? && delivery.email_text_snapshot.present?

      delivery.update_columns(
        email_subject: content[:title],
        email_text_snapshot: decoded_part(mail, :text_part),
        email_html_snapshot: decoded_part(mail, :html_part),
        ai_analysis: content[:ai_analysis],
        ai_prompt_snapshot: content[:ai_prompt_snapshot],
        updated_at: Time.current
      )
    end

    def decoded_part(mail, part_name)
      part = mail.public_send(part_name)
      return part.body.decoded if part

      mail.body.decoded
    end
  end
end
