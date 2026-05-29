class EducationalVideo < ApplicationRecord
  DRAFT = "draft"
  PUBLISHED = "published"
  STATUSES = [DRAFT, PUBLISHED].freeze

  belongs_to :admin, optional: true
  has_one_attached :video_file

  validates :title, :stage, :level, :subject, :min_age, :max_age, :status, presence: true
  validates :status, inclusion: { in: STATUSES }
  validates :min_age, :max_age, numericality: { only_integer: true, greater_than_or_equal_to: 0 }
  validate :max_age_is_not_less_than_min_age
  validate :video_file_is_video

  scope :published, -> { where(status: PUBLISHED) }
  scope :for_age, ->(age) { where("min_age <= ? AND max_age >= ?", age, age) }
  scope :by_subject, ->(subject) { where(subject: subject) if subject.present? }

  private

  def max_age_is_not_less_than_min_age
    return if min_age.blank? || max_age.blank?

    errors.add(:max_age, "must be greater than or equal to minimum age") if max_age < min_age
  end

  def video_file_is_video
    return unless video_file.attached?
    return if video_file.content_type.to_s.start_with?("video/")

    errors.add(:video_file, "must be a video file")
  end
end
