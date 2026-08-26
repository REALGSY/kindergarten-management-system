class ParentingAdviceDeliverySerializer < ActiveModel::Serializer
  attributes :id, :scheduled_run_at, :status, :sent_count, :failed_count,
             :started_at, :completed_at, :error_message, :email_subject,
             :email_text_snapshot, :email_html_snapshot, :ai_analysis,
             :ai_prompt_snapshot, :created_at

  has_many :delivery_recipients, key: :recipients, serializer: ParentingAdviceDeliveryRecipientSerializer
  has_many :delivery_content_items, key: :content_items, serializer: ParentingAdviceDeliveryContentItemSerializer
end
