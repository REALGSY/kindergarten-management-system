class Parent < ApplicationRecord
    has_secure_password
    has_many :parent_students, dependent: :destroy
    has_many :students, through: :parent_students
    has_many :child_chat_sessions, dependent: :nullify
    before_validation :normalize_email

    validates :first_name, presence: true
    validates :last_name, presence: true
    validates :password, presence: true, length: {minimum: 5}, on: :create
    validates :password, length: {minimum: 5}, allow_nil: true
    validates :phone_number, presence: true, uniqueness: true, length: {maximum: 10}
    validates :email, format: { with: URI::MailTo::EMAIL_REGEXP }, allow_blank: true

    def approved_students
        Student
            .joins(:parent_students)
            .where(parent_students: { parent_id: id, status: ParentStudent::APPROVED })
            .distinct
    end

    private

    def normalize_email
        self.email = email.to_s.strip.downcase.presence
    end
end
