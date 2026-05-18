class ParentStudentsController < ApplicationController
    rescue_from ActiveRecord::RecordInvalid, with: :record_invalid
    rescue_from ActiveRecord::RecordNotFound, with: :not_found_message

    def index
        unless current_parent
            render json: { error: 'Parent access required' }, status: :forbidden
            return
        end

        parent_students = current_parent.parent_students.includes(:student).order(created_at: :desc)
        render json: parent_students, status: :ok
    end

    def create
        require_parent
        return if performed?

        student = if params[:admission_number].present?
            Student.find_by!(admission_number: params[:admission_number])
        else
            Student.find(parent_student_params[:student_id])
        end

        parent_student = ParentStudent.find_or_initialize_by(parent_id: current_parent.id, student_id: student.id)
        if parent_student.new_record? || parent_student.status == ParentStudent::REJECTED
            parent_student.status = ParentStudent::PENDING
        end
        parent_student.save!
        render json: parent_student, status: :created
    end

    private
    def parent_student_params
        params.permit(:parent_id,:student_id)
    end

    def record_invalid invalid
        render json: {errors: invalid.record.errors.full_messages}, status: :unprocessable_entity
    end

    def not_found_message
        render json: {error: "Student Not Found"}, status: :not_found
    end
end
