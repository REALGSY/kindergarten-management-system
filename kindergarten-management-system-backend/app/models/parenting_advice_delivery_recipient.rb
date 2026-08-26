class ParentingAdviceDeliveryRecipient < ApplicationRecord
  SUCCEEDED = "succeeded"
  FAILED = "failed"
  STATUSES = [SUCCEEDED, FAILED].freeze

  belongs_to :parenting_advice_delivery

  before_validation :normalize_email

  validates :email, presence: true, format: { with: URI::MailTo::EMAIL_REGEXP }
  validates :status, inclusion: { in: STATUSES }

  private

  def normalize_email
    self.email = email.to_s.strip.downcase.presence
  end
end
