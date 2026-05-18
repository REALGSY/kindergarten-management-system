module AdminApi
  class ClassroomsController < BaseController
    def index
      render json: Classroom.includes(:teacher).order(:id), status: :ok
    end

    def show
      render json: Classroom.find(params[:id]), serializer: ClassroomSerializer, status: :ok
    end

    def create
      classroom = Classroom.new(classroom_params)
      release_teacher_from_other_classrooms(classroom)
      classroom.save!
      render json: classroom, serializer: ClassroomSerializer, status: :created
    end

    def update
      classroom = Classroom.find(params[:id])
      classroom.assign_attributes(classroom_params)
      release_teacher_from_other_classrooms(classroom)
      classroom.save!
      render json: classroom, serializer: ClassroomSerializer, status: :ok
    end

    def destroy
      classroom = Classroom.find(params[:id])
      if classroom.students.exists?
        render json: { errors: ["Cannot delete a classroom that still has students"] }, status: :unprocessable_entity
        return
      end

      classroom.destroy!
      head :no_content
    end

    private

    def classroom_params
      permitted = params.permit(:name, :teacher_id)
      permitted[:teacher_id] = nil if permitted.key?(:teacher_id) && permitted[:teacher_id].blank?
      permitted
    end

    def release_teacher_from_other_classrooms(classroom)
      return if classroom.teacher_id.blank?

      Classroom.where(teacher_id: classroom.teacher_id).where.not(id: classroom.id).update_all(teacher_id: nil)
    end
  end
end
