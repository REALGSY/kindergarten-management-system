class ParentsController < ApplicationController
    rescue_from ActiveRecord::RecordInvalid, with: :invalid_message
    rescue_from ActiveRecord::RecordNotFound, with: :not_found_message
    skip_before_action :authorize, only: [:create]
    def create 
    parent = Parent.create!(parent_params)
    token = encode_token({parent_id: parent.id})
    render json: {parent: ParentSerializer.new(parent), jwt: token}, status: :created
    end
    def index 
    require_teacher
    return if performed?

    parents = teacher_classroom_parents
    render json: parents, status: :ok
    end
    
    def show
    parent = Parent.find(params[:id])
    if current_parent
        if parent.id != current_parent.id
            render json: {error: "Parent not Found"}, status: :not_found
            return
        end
    elsif current_user
        classroom_parent_ids = teacher_classroom_parents.pluck(:id)
        unless classroom_parent_ids.include?(parent.id)
            render json: {error: "Parent not Found"}, status: :not_found
            return
        end
    else
        render json: { error: 'Parent access required' }, status: :forbidden
        return
    end

    render json: parent, status: :ok
    end
    
    private
    def teacher_classroom_parents
    return Parent.none unless current_user&.classroom

    Parent
        .joins(parent_students: :student)
        .where(parent_students: { status: ParentStudent::APPROVED }, students: { classroom_id: current_user.classroom.id })
        .distinct
    end

    def parent_params
    params.permit(:first_name,:last_name,:phone_number,:password)
    end
    def invalid_message(invalid)
        render json: {errors: invalid.record.errors.full_messages}, status: :unprocessable_entity
    end

    def not_found_message
        render json: {error: "Parent not Found"}, status: :not_found
    end
end
