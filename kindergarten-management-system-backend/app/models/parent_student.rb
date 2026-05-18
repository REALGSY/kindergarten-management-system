class ParentStudent < ApplicationRecord
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    STATUSES = [PENDING, APPROVED, REJECTED].freeze

    belongs_to :student
    belongs_to :parent

    validates :status, inclusion: { in: STATUSES }
    validates :student_id, uniqueness: { scope: :parent_id }

    scope :pending, -> { where(status: PENDING) }
    scope :approved, -> { where(status: APPROVED) }
    scope :rejected, -> { where(status: REJECTED) }
end
