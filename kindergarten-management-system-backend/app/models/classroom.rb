class Classroom < ApplicationRecord
    belongs_to :teacher, optional: true
    has_many :students, dependent: :destroy
    has_many :attendances, dependent: :destroy 
    has_many :parents, through: :students
    has_many :disciplines, through: :students

    validates :name, presence: true, uniqueness: true
    validates :teacher_id, uniqueness: { allow_nil: true }
end
