class ParentStudentSerializer < ActiveModel::Serializer
  attributes :id, :parent_id, :student_id, :status, :parent_name, :parent_phone_number,
             :student_name, :admission_number, :created_at, :updated_at

  def parent_name
    [object.parent&.first_name, object.parent&.last_name].compact.join(" ")
  end

  def parent_phone_number
    object.parent&.phone_number
  end

  def student_name
    [object.student&.first_name, object.student&.second_name, object.student&.surname].compact.join(" ")
  end

  def admission_number
    object.student&.admission_number
  end
end
