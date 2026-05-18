class StudentSerializer < ActiveModel::Serializer
  attributes :id, :first_name, :second_name,:surname, :age, :description, :admission_number, :classroom_id
  belongs_to :classroom
  has_many :parents
  has_many :disciplines
  has_many :attendances
end
