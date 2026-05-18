module AdminApi
  class ParentStudentsController < BaseController
    def index
      parent_students = ParentStudent.includes(:parent, :student).order(created_at: :desc)
      parent_students = parent_students.where(status: params[:status]) if params[:status].present?
      render json: parent_students, status: :ok
    end

    def create
      parent_student = ParentStudent.create!(parent_student_params)
      render json: parent_student, status: :created
    end

    def update
      parent_student = ParentStudent.find(params[:id])
      parent_student.update!(status_params)
      render json: parent_student, status: :ok
    end

    def destroy
      ParentStudent.find(params[:id]).destroy!
      head :no_content
    end

    private

    def parent_student_params
      permitted = params.permit(:parent_id, :student_id, :status)
      permitted[:status] = ParentStudent::APPROVED if permitted[:status].blank?
      permitted
    end

    def status_params
      params.permit(:status)
    end
  end
end
