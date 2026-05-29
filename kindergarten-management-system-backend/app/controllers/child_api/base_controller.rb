module ChildApi
  class BaseController < ApplicationController
    before_action :require_child

    rescue_from ActiveRecord::RecordNotFound, with: :not_found_response
    rescue_from ActiveRecord::RecordInvalid, with: :invalid_response

    private

    def child_student
      current_child_student
    end

    def accessible_chat_session(session_id = params[:id])
      current_child_student
        .child_chat_sessions
        .includes(:student, :parent, :child_chat_messages)
        .find(session_id)
    end

    def not_found_response
      render json: { error: "Resource not found" }, status: :not_found
    end

    def invalid_response(invalid)
      render json: { errors: invalid.record.errors.full_messages }, status: :unprocessable_entity
    end
  end
end
