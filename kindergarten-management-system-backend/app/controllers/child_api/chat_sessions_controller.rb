module ChildApi
  class ChatSessionsController < BaseController
    def index
      sessions = child_student
        .child_chat_sessions
        .includes(:student, :parent, :child_chat_messages)
        .order(updated_at: :desc)

      render json: sessions, each_serializer: ChildChatSessionSerializer, status: :ok
    end

    def show
      render json: accessible_chat_session, serializer: ChildChatSessionSerializer, status: :ok
    end

    def create
      session = ChildChatSession.create!(student: child_student, title: params[:title])
      render json: session, serializer: ChildChatSessionSerializer, status: :created
    end
  end
end
