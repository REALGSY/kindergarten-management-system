module ParentApi
  class ChildrenController < ApplicationController
    before_action :require_parent

    rescue_from ActiveRecord::RecordNotFound, with: :not_found_response
    rescue_from ActiveRecord::RecordInvalid, with: :invalid_response

    def index
      render json: current_parent.approved_students.includes(:classroom).order(:id), status: :ok
    end

    def chat_sessions
      child = accessible_child
      sessions = child
        .child_chat_sessions
        .includes(:student, :parent, :child_chat_messages)
        .order(updated_at: :desc)

      render json: sessions, each_serializer: ChildChatSessionSerializer, status: :ok
    end

    def update_password
      child = accessible_child
      password = params[:password].to_s

      if password.blank?
        render json: { errors: ["Password can't be blank"] }, status: :unprocessable_entity
        return
      end

      child.update!(password: password)
      render json: { message: "Child password updated" }, status: :ok
    end

    private

    def accessible_child
      current_parent.approved_students.find(params[:student_id])
    end

    def not_found_response
      render json: { error: "Child not found" }, status: :not_found
    end

    def invalid_response(invalid)
      render json: { errors: invalid.record.errors.full_messages }, status: :unprocessable_entity
    end
  end
end
