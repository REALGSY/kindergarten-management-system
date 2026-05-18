class ClassroomsController < ApplicationController
    before_action :require_teacher

    def index
        classrooms = current_user.classroom ? [current_user.classroom] : []
        render json: classrooms
    end
    
    def show
        classroom = current_user.classroom
        if classroom.nil? || classroom.id != params[:id].to_i
            render json: {error: "Classroom not found"}, status: :not_found
            return
        end

        render json: classroom, serializer: ShowMethodClassroomSerializer
    end
end
