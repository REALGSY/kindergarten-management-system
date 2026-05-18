class DisciplinesController < ApplicationController
    before_action :require_teacher, only: [:create, :update, :destroy]
    rescue_from ActiveRecord::RecordInvalid, with: :record_invalid
    rescue_from ActiveRecord::RecordNotFound, with: :not_found_message
    
    def index
        disciplines = accessible_disciplines
        disciplines = disciplines.where(student_id: params[:student_id]) if params[:student_id].present?
        render json: disciplines, status: :ok
    end

    def show
        discipline = accessible_disciplines.find(params[:id])
        render json: discipline, status: :ok
    end

    def create
        return if performed?

        student = teacher_students.find(params[:student_id])
        discipline = student.disciplines.create!(permitted_params.except(:student_id))
        render json: discipline, status: :created
    end

    def update
        return if performed?

        discipline = teacher_disciplines.find(params[:id])
        discipline.update!(update_params)
        render json: discipline, status: :ok
    end

    def destroy 
        return if performed?

        discipline = teacher_disciplines.find(params[:id])
        discipline.destroy
        head :no_content
    end

    private

    def accessible_disciplines
        if current_user
            teacher_disciplines
        else
            Discipline.where(student_id: parent_students.select(:id))
        end
    end

    def teacher_disciplines
        return Discipline.none unless current_user&.classroom

        current_user.classroom.disciplines
    end

    def record_invalid invalid
        render json: {errors: invalid.record.errors.full_messages}, status: :unprocessable_entity
    end

     def not_found_message
        render json: {error: "Discipline Not Found"}, status: :not_found
     end    

     def permitted_params
        params.permit(:student_id, :title, :date, :description)
     end

     def update_params
        params.permit(:title, :description)
     end
end
