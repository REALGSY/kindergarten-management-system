class ChildChatSession < ApplicationRecord
  belongs_to :student
  belongs_to :parent, optional: true
  has_many :child_chat_messages, -> { order(:created_at) }, dependent: :destroy

  validates :student, presence: true

  before_validation :set_default_title, on: :create

  private

  def set_default_title
    self.title = "儿童陪伴对话" if title.blank?
  end
end
