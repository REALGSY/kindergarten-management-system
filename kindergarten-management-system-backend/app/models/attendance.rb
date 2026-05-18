class Attendance < ApplicationRecord
    STATUSES = ["Present", "Absent"].freeze

    belongs_to :classroom
    belongs_to :student

    validates :classroom_id,:student_id, :student_name, :status, :date,  presence: true
    validates :status, inclusion: { in: STATUSES }
    validates :student_id, uniqueness: { scope: :date, message: "already has attendance for this date" }
end
