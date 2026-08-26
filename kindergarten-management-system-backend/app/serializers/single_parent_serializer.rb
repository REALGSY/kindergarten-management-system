class SingleParentSerializer < ActiveModel::Serializer
  attributes :id, :first_name, :last_name, :phone_number, :email
  has_many :students

  def students
    object.approved_students
  end
end
