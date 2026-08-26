class ParentingAdviceDelivery < ApplicationRecord
  RUNNING = "running"
  SUCCEEDED = "succeeded"
  PARTIAL = "partial"
  FAILED = "failed"
  STATUSES = [RUNNING, SUCCEEDED, PARTIAL, FAILED].freeze

  belongs_to :parenting_advice_schedule
  has_many :delivery_recipients,
    class_name: "ParentingAdviceDeliveryRecipient",
    dependent: :destroy
  has_many :delivery_content_items,
    class_name: "ParentingAdviceDeliveryContentItem",
    dependent: :destroy

  validates :scheduled_run_at, presence: true
  validates :status, inclusion: { in: STATUSES }

  def finish!(sent_count:, failed_count:, error_message: nil)
    next_status =
      if sent_count.positive? && failed_count.zero?
        SUCCEEDED
      elsif sent_count.positive? && failed_count.positive?
        PARTIAL
      else
        FAILED
      end

    update!(
      status: next_status,
      sent_count: sent_count,
      failed_count: failed_count,
      error_message: error_message,
      completed_at: Time.current
    )
  end
end
