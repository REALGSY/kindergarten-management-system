class Student < ApplicationRecord
    has_many :parent_students, dependent: :destroy
    has_many :parents, through: :parent_students
    belongs_to :classroom
    has_many :disciplines, dependent: :destroy
    has_many :attendances, dependent: :destroy

    validates :first_name, :surname, :age, :admission_number, presence: true
    validates :admission_number, uniqueness: true
    validates :age, numericality: { only_integer: true, greater_than: 0 }
end
