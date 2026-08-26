class ParentingAdviceScheduleRecipient < ApplicationRecord
  PARENT = "parent"
  EXTERNAL = "external_email_recipient"
  RECIPIENT_TYPES = [PARENT, EXTERNAL].freeze

  belongs_to :parenting_advice_schedule

  before_validation :normalize_email

  validates :recipient_type, inclusion: { in: RECIPIENT_TYPES }
  validates :name, presence: true
  validates :email, presence: true, format: { with: URI::MailTo::EMAIL_REGEXP }
  validates :email, uniqueness: { scope: :parenting_advice_schedule_id, case_sensitive: false }

  private

  def normalize_email
    self.email = email.to_s.strip.downcase.presence
  end
end
