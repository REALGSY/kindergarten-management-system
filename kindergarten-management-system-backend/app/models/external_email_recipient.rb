class ExternalEmailRecipient < ApplicationRecord
  before_validation :normalize_email

  scope :active, -> { where(active: true) }

  validates :name, presence: true
  validates :email, presence: true, format: { with: URI::MailTo::EMAIL_REGEXP }, uniqueness: { case_sensitive: false }

  def deactivate!
    update!(active: false)
  end

  private

  def normalize_email
    self.email = email.to_s.strip.downcase.presence
  end
end
