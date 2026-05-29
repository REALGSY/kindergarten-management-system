class ChildChatMessage < ApplicationRecord
  USER = "user"
  ASSISTANT = "assistant"
  SYSTEM = "system"
  ROLES = [USER, ASSISTANT, SYSTEM].freeze

  belongs_to :child_chat_session

  validates :role, inclusion: { in: ROLES }
  validates :content, presence: true
end
