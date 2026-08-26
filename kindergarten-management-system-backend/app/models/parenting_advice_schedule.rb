class ParentingAdviceSchedule < ApplicationRecord
  attr_accessor :immediate_send

  ONE_TIME = "one_time"
  DAILY = "daily"
  WEEKLY = "weekly"
  RECURRENCES = [ONE_TIME, DAILY, WEEKLY].freeze

  CUSTOM_SOURCE = "custom"
  WHITELIST_SOURCE = "whitelist"
  SOURCE_TYPES = [CUSTOM_SOURCE, WHITELIST_SOURCE].freeze

  ACTIVE = "active"
  PAUSED = "paused"
  COMPLETED = "completed"
  DELETED = "deleted"
  STATUSES = [ACTIVE, PAUSED, COMPLETED, DELETED].freeze

  belongs_to :admin, optional: true
  has_many :schedule_recipients,
    class_name: "ParentingAdviceScheduleRecipient",
    dependent: :destroy
  has_many :deliveries,
    class_name: "ParentingAdviceDelivery",
    dependent: :destroy

  before_validation :set_defaults
  before_validation :set_initial_next_run_at, on: :create

  scope :visible, -> { where.not(status: DELETED) }
  scope :due, ->(now = Time.current) { where(status: ACTIVE).where("next_run_at <= ?", now) }

  validates :title, presence: true
  validates :body, presence: true, if: :custom_source?
  validates :recurrence, inclusion: { in: RECURRENCES }
  validates :status, inclusion: { in: STATUSES }
  validates :source_type, inclusion: { in: SOURCE_TYPES }
  validate :schedule_fields_are_valid

  def self.beijing_zone
    ActiveSupport::TimeZone["Beijing"] || ActiveSupport::TimeZone["Asia/Shanghai"]
  end

  def active?
    status == ACTIVE
  end

  def one_time?
    recurrence == ONE_TIME
  end

  def daily?
    recurrence == DAILY
  end

  def weekly?
    recurrence == WEEKLY
  end

  def custom_source?
    source_type == CUSTOM_SOURCE
  end

  def whitelist_source?
    source_type == WHITELIST_SOURCE
  end

  def calculate_next_run_at(after: Time.current)
    case recurrence
    when ONE_TIME
      scheduled_at
    when DAILY
      next_daily_run_after(after)
    when WEEKLY
      next_weekly_run_after(after)
    end
  end

  def advance_after!(after: Time.current)
    if one_time?
      update!(status: COMPLETED, next_run_at: nil)
    else
      update!(next_run_at: calculate_next_run_at(after: after))
    end
  end

  def pause!
    update!(status: PAUSED)
  end

  def resume!
    if one_time? && scheduled_at.present? && scheduled_at <= Time.current
      errors.add(:base, "One-time schedules cannot be resumed after their scheduled time")
      return false
    end

    self.status = ACTIVE
    self.next_run_at = calculate_next_run_at(after: Time.current)
    save
  end

  def mark_deleted!
    update!(status: DELETED)
  end

  private

  def set_defaults
    self.status = ACTIVE if status.blank?
    self.source_type = CUSTOM_SOURCE if source_type.blank?
    self.title = "本期育儿精选" if whitelist_source? && title.blank?
    self.body = "" if whitelist_source? && body.nil?
    self.source_config = "{}" if source_config.blank?
  end

  def set_initial_next_run_at
    self.next_run_at ||= calculate_next_run_at(after: Time.current) if recurrence.present?
  end

  def schedule_fields_are_valid
    case recurrence
    when ONE_TIME
      validate_one_time_fields
    when DAILY
      validate_send_time
    when WEEKLY
      validate_send_time
      errors.add(:weekday, "must be between 1 and 7") unless weekday.to_i.between?(1, 7)
    end
  end

  def validate_one_time_fields
    errors.add(:scheduled_at, "can't be blank") if scheduled_at.blank?
    return if immediate_send
    return unless new_record? && scheduled_at.present? && scheduled_at <= Time.current

    errors.add(:scheduled_at, "must be in the future")
  end

  def validate_send_time
    if send_time.blank?
      errors.add(:send_time, "can't be blank")
      return
    end

    errors.add(:send_time, "must use HH:MM format") unless time_parts
  end

  def next_daily_run_after(after)
    local_after = after.in_time_zone(self.class.beijing_zone)
    hour, minute = time_parts
    candidate = local_after.change(hour: hour, min: minute, sec: 0)
    candidate += 1.day if candidate <= local_after
    candidate.utc
  end

  def next_weekly_run_after(after)
    local_after = after.in_time_zone(self.class.beijing_zone)
    hour, minute = time_parts
    days_ahead = weekday.to_i - local_after.to_date.cwday
    candidate_date = local_after.to_date + days_ahead
    candidate = self.class.beijing_zone.local(candidate_date.year, candidate_date.month, candidate_date.day, hour, minute, 0)

    candidate += 7.days if days_ahead.negative? || candidate <= local_after
    candidate.utc
  end

  def time_parts
    match = /\A([01]\d|2[0-3]):([0-5]\d)\z/.match(send_time.to_s)
    return unless match

    [match[1].to_i, match[2].to_i]
  end
end
