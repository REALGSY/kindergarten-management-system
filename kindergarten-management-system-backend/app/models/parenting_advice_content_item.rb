require "uri"

class ParentingAdviceContentItem < ApplicationRecord
  has_many :delivery_content_items,
    class_name: "ParentingAdviceDeliveryContentItem",
    dependent: :restrict_with_error

  validates :title, :source, :date, :url, :topic, :age_group, presence: true
  validates :url, uniqueness: true
  validate :url_is_http

  scope :recent_first, -> { order(date: :desc, created_at: :desc) }

  private

  def url_is_http
    parsed = URI.parse(url.to_s)
    errors.add(:url, "must use http or https") unless parsed.is_a?(URI::HTTP)
  rescue URI::InvalidURIError
    errors.add(:url, "is invalid")
  end
end
