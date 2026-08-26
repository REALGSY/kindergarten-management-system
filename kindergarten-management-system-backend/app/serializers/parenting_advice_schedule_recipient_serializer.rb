class ParentingAdviceScheduleRecipientSerializer < ActiveModel::Serializer
  attributes :id, :recipient_type, :recipient_id, :name, :email
end
