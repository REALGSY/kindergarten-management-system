class ParentingAdviceScheduleDetailSerializer < ParentingAdviceScheduleSerializer
  has_many :schedule_recipients, key: :recipients, serializer: ParentingAdviceScheduleRecipientSerializer
  has_many :recent_deliveries, key: :deliveries, serializer: ParentingAdviceDeliverySerializer

  def recent_deliveries
    object.deliveries
      .includes(:delivery_recipients, :delivery_content_items)
      .order(scheduled_run_at: :desc)
      .limit(10)
  end
end
