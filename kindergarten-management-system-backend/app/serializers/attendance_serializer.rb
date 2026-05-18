class AttendanceSerializer < ActiveModel::Serializer
  attributes :id, :classroom_id, :student_name, :student_id, :status, :date
end
