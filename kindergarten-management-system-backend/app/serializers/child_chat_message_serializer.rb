class ChildChatMessageSerializer < ActiveModel::Serializer
  attributes :id,
    :role,
    :content,
    :model,
    :prompt_tokens,
    :completion_tokens,
    :total_tokens,
    :created_at
end
