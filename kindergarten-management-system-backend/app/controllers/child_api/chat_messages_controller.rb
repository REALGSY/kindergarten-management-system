module ChildApi
  class ChatMessagesController < BaseController
    SYSTEM_PROMPT = <<~PROMPT.squish.freeze
      你是幼儿园儿童端的早教陪伴助手。你陪伴 3-6 岁儿童聊天、学习和表达情绪。
      你必须使用简短、温柔、积极的中文回答，每次只讲一个小重点，并用提问鼓励孩子思考。
      你不能替代家长、老师、医生或心理咨询师。遇到身体不适、危险、伤害、隐私、成人内容或不适龄内容时，
      请停止展开细节，提醒孩子马上找家长或老师帮忙。
    PROMPT
    HISTORY_LIMIT = 12

    def create
      session = accessible_chat_session(params[:chat_session_id])
      content = params[:content].to_s.strip

      if content.blank?
        render json: { error: "Message content is required" }, status: :unprocessable_entity
        return
      end

      user_message = session.child_chat_messages.create!(role: ChildChatMessage::USER, content: content)
      deepseek_result = DeepseekClient.new.chat(messages: deepseek_messages(session))
      assistant_message = session.child_chat_messages.create!(
        role: ChildChatMessage::ASSISTANT,
        content: deepseek_result[:content],
        model: deepseek_result[:model],
        prompt_tokens: deepseek_result.dig(:usage, "prompt_tokens"),
        completion_tokens: deepseek_result.dig(:usage, "completion_tokens"),
        total_tokens: deepseek_result.dig(:usage, "total_tokens")
      )
      session.touch

      render json: {
        user_message: serialize_message(user_message),
        assistant_message: serialize_message(assistant_message)
      }, status: :created
    rescue DeepseekClient::Error => e
      render json: { error: e.message }, status: :bad_gateway
    end

    private

    def deepseek_messages(session)
      student = session.student
      student_name = [student.first_name, student.second_name, student.surname].filter_map(&:presence).join(" ")
      system_message = {
        role: ChildChatMessage::SYSTEM,
        content: "#{SYSTEM_PROMPT} 当前正在陪伴的孩子是 #{student_name}，#{student.age} 岁。"
      }
      history = session.child_chat_messages.order(:created_at).to_a.last(HISTORY_LIMIT).map do |message|
        { role: message.role, content: message.content }
      end

      [system_message] + history
    end

    def serialize_message(message)
      {
        id: message.id,
        role: message.role,
        content: message.content,
        model: message.model,
        prompt_tokens: message.prompt_tokens,
        completion_tokens: message.completion_tokens,
        total_tokens: message.total_tokens,
        created_at: message.created_at
      }
    end
  end
end
