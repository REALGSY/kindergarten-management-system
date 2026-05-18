class Teacher < ApplicationRecord
    has_secure_password
    validates :first_name,:last_name,:email,:career_name,:phone_number, presence: true
    validates :email, uniqueness: true
    validates :email, format: { with: URI::MailTo::EMAIL_REGEXP }
    validates :career_name, presence: true, uniqueness: true
    validates :password, presence: true, length: {minimum: 5}, on: :create
    validates :password, length: {minimum: 5}, allow_nil: true
    validates :phone_number, length: {maximum: 10}
    validates :gender, presence: true
    has_one :classroom, dependent: :nullify
    has_many :students, through: :classroom 
     has_many :disciplines, through: :students


end
