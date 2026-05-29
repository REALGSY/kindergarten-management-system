class ChildAuthController < ApplicationController
  skip_before_action :authorize, only: [:create]

  def create
    student = Student.find_by(admission_number: params[:admission_number])

    if student&.authenticate(params[:password])
      token = encode_token(child_student_id: student.id)
      render json: { student: StudentSerializer.new(student), jwt: token }, status: :accepted
    else
      render json: { errors: "Invalid admission number or password" }, status: :unauthorized
    end
  end
end
