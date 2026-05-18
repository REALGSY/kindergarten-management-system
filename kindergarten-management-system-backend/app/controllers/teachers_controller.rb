class TeachersController < ApplicationController
    before_action :require_teacher
    rescue_from ActiveRecord::RecordNotFound, with: :not_found_response
    rescue_from ActiveRecord::RecordInvalid, with: :invalid_message

    def profile
        render json: [current_user], include: ['classroom','classroom.students','classroom.parents','classroom.disciplines','classroom.attendances']
    end

    def show
        teacher = Teacher.find(params[:id])
        if teacher.id != current_user.id
            render json: {error: "Teacher not found"}, status: :not_found
            return
        end

        render json: teacher,include: ['classroom','classroom.students','classroom.parents','classroom.disciplines','classroom.attendances'], serializer: TeacherSerializer ,status: :ok
    end 

    def classroom_parents
        parents = if current_user.classroom
            Parent
                .joins(parent_students: :student)
                .where(parent_students: { status: ParentStudent::APPROVED }, students: { classroom_id: current_user.classroom.id })
                .distinct
        else
            Parent.none
        end

        render json: parents, status: :ok
    end

    private

    def not_found_response
    render json: {error: "Teacher not found"}, status: :not_found
    end

    def invalid_message(invalid)
        render json: {errors: invalid.record.errors.full_messages}, status: :unprocessable_entity
    end

end
