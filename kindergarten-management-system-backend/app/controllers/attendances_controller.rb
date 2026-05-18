class AttendancesController < ApplicationController
    before_action :require_teacher, only: [:create]
    rescue_from ActiveRecord::RecordInvalid, with: :record_invalid
    rescue_from ActiveRecord::RecordNotFound, with: :not_found_message

    def index
        attendances = accessible_attendances
        attendances = attendances.where(date: params[:date]) if params[:date].present?
        attendances = attendances.where(student_id: params[:student_id]) if params[:student_id].present?
        render json: attendances, status: :ok
    end

    def create
        return if performed?

        classroom = current_user.classroom
        if classroom.nil?
            render json: { errors: ['Please assign yourself to a classroom before taking attendance'] }, status: :unprocessable_entity
            return
        end

        student = teacher_students.find(params[:student_id])
        existing = Attendance.find_by(classroom_id: classroom.id, student_id: student.id, date: params[:date])
        if existing
            render json: { errors: ['Attendance already recorded for this student and date'] }, status: :unprocessable_entity
            return
        end

        attendance = Attendance.create!(
            classroom_id: classroom.id,
            student_id: student.id,
            student_name: [student.first_name, student.second_name, student.surname].compact.join(' '),
            status: params[:status],
            date: params[:date]
        )
        render json: attendance, status: :created
    end

    private

    def accessible_attendances
        if current_user
            return Attendance.none unless current_user.classroom

            current_user.classroom.attendances
        else
            Attendance.where(student_id: parent_students.select(:id))
        end
    end

    def record_invalid invalid
        render json: {errors: invalid.record.errors.full_messages}, status: :unprocessable_entity
    end

    def not_found_message
        render json: {error: "Attendance Not Found"}, status: :not_found
    end

end
