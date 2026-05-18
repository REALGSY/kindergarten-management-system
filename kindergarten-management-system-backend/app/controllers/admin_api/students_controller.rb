module AdminApi
  class StudentsController < BaseController
    def index
      render json: Student.includes(:classroom).order(:id), status: :ok
    end

    def show
      render json: Student.find(params[:id]), serializer: SingleStudentSerializer, status: :ok
    end

    def create
      student = Student.create!(student_params)
      render json: student, serializer: SingleStudentSerializer, status: :created
    end

    def update
      student = Student.find(params[:id])
      student.update!(student_params)
      render json: student, serializer: SingleStudentSerializer, status: :ok
    end

    def destroy
      Student.find(params[:id]).destroy!
      head :no_content
    end

    private

    def student_params
      params.permit(:first_name, :second_name, :surname, :classroom_id, :age, :description, :admission_number)
    end
  end
end
