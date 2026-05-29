module AdminApi
  class ChildChatSessionsController < BaseController
    def index
      sessions = ChildChatSession
        .includes(:student, :parent, :child_chat_messages)
        .order(updated_at: :desc)
      sessions = sessions.where(student_id: params[:student_id]) if params[:student_id].present?

      render json: sessions, each_serializer: ChildChatSessionSerializer, status: :ok
    end

    def show
      session = ChildChatSession.includes(:student, :parent, :child_chat_messages).find(params[:id])
      render json: session, serializer: ChildChatSessionSerializer, status: :ok
    end
  end
end
