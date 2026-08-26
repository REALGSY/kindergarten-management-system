class ParentingAdviceScheduleSerializer < ActiveModel::Serializer
  attributes :id, :title, :body, :recurrence, :scheduled_at, :send_time, :weekday,
             :next_run_at, :status, :source_type, :created_at, :updated_at,
             :recipient_count, :last_delivery

  def recipient_count
    object.schedule_recipients.size
  end

  def last_delivery
    delivery = object.deliveries.order(scheduled_run_at: :desc).first
    return unless delivery

    {
      id: delivery.id,
      scheduled_run_at: delivery.scheduled_run_at,
      status: delivery.status,
      sent_count: delivery.sent_count,
      failed_count: delivery.failed_count,
      completed_at: delivery.completed_at,
      error_message: delivery.error_message,
      email_subject: delivery.email_subject,
      ai_analysis: delivery.ai_analysis,
      content_item_count: delivery.delivery_content_items.size
    }
  end
end
