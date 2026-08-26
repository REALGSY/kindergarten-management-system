class ParentingAdviceDeliveryRecipientSerializer < ActiveModel::Serializer
  attributes :id, :name, :email, :status, :sent_at, :error_message
end
