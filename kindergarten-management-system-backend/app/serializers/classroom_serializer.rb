class ClassroomSerializer < ActiveModel::Serializer
  attributes :id,:name,:students, :attendances
  has_many :attendances
  has_many :students
  belongs_to :teacher, optional: true
  has_many :parents
  has_many :disciplines

  def parents
    Parent
      .joins(parent_students: :student)
      .where(parent_students: { status: ParentStudent::APPROVED }, students: { classroom_id: object.id })
      .distinct
  end
end
