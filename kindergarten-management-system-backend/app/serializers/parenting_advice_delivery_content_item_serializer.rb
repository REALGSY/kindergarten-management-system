class ParentingAdviceDeliveryContentItemSerializer < ActiveModel::Serializer
  attributes :id, :position, :title, :source, :date, :url, :thumbnail,
             :topic, :age_group, :summary, :created_at
end
