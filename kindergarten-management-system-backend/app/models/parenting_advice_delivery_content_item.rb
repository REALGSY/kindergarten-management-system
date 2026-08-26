class ParentingAdviceDeliveryContentItem < ApplicationRecord
  belongs_to :parenting_advice_delivery
  belongs_to :parenting_advice_content_item

  validates :position, numericality: { only_integer: true, greater_than: 0 }
  validates :title, :source, :date, :url, :topic, :age_group, :summary, presence: true
end
