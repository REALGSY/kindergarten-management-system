module AdminApi
  class TeachersController < BaseController
    def index
      render json: Teacher.order(:id), status: :ok
    end

    def show
      render json: Teacher.find(params[:id]), serializer: TeacherSerializer, status: :ok
    end

    def create
      teacher = Teacher.create!(teacher_params_with_default_password)
      render json: teacher, serializer: TeacherSerializer, status: :created
    end

    def update
      teacher = Teacher.find(params[:id])
      teacher.update!(update_teacher_params)
      render json: teacher, serializer: TeacherSerializer, status: :ok
    end

    def destroy
      teacher = Teacher.find(params[:id])
      teacher.classroom&.update_column(:teacher_id, nil)
      teacher.destroy!
      head :no_content
    end

    private

    def teacher_params
      params.permit(:first_name, :last_name, :career_name, :email, :phone_number, :gender, :password)
    end

    def teacher_params_with_default_password
      permitted = teacher_params
      permitted[:password] = default_account_password if permitted[:password].blank?
      permitted
    end

    def update_teacher_params
      permitted = teacher_params
      permitted.delete(:password) if permitted[:password].blank?
      permitted
    end
  end
end
