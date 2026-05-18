class SingleStudentSerializer < ActiveModel::Serializer
  attributes :id, :first_name, :second_name, :surname, :age, :description, :admission_number, :classroom_id
  has_many :disciplines
  has_many :attendances
  has_many :parents
  belongs_to :classroom
end
