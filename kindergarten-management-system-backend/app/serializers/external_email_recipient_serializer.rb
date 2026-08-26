class ExternalEmailRecipientSerializer < ActiveModel::Serializer
  attributes :id, :name, :email, :active, :created_at, :updated_at
end
