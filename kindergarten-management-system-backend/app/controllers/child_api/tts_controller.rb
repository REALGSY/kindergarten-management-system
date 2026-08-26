module ChildApi
  class TtsController < BaseController
    def create
      message = assistant_message_from_params
      text = message&.content || params[:text].to_s
      client = TencentTtsClient.new
      clean_text = TencentTtsClient.sanitize_text(text)
      raise TencentTtsClient::NoSpeakableTextError, "AI 回复中没有可朗读内容" if clean_text.blank?

      audio_cache_key = ChildTtsAudio.audio_cache_key(
        provider: ChildTtsAudio::PROVIDER,
        voice_type: tts_client_value(client, :voice_type, TencentTtsClient::DEFAULT_VOICE_TYPE),
        codec: tts_client_value(client, :codec, TencentTtsClient::DEFAULT_CODEC),
        sample_rate: tts_client_value(client, :sample_rate, TencentTtsClient::DEFAULT_SAMPLE_RATE),
        clean_text: clean_text
      )
      cached_audio = ChildTtsAudio.find_by(audio_cache_key: audio_cache_key)

      if cached_audio
        render json: cached_audio.to_tts_response(cached: true)
        return
      end

      result = client.synthesize(text: text)
      audio = ChildTtsAudio.build_from_tts_result(
        audio_cache_key: audio_cache_key,
        clean_text: clean_text,
        child_chat_message: message,
        result: result
      )
      audio.save!

      render json: audio.to_tts_response(cached: false)
    rescue TencentTtsClient::NoSpeakableTextError, TencentTtsClient::TextTooLongError => e
      render json: { error: e.message }, status: :unprocessable_entity
    rescue TencentTtsClient::ConfigurationError
      render json: { error: "语音合成服务尚未配置" }, status: :service_unavailable
    rescue TencentTtsClient::ApiError => e
      render json: { error: e.message }, status: :bad_gateway
    end

    private

    def assistant_message_from_params
      return nil if params[:message_id].blank?

      ChildChatMessage
        .joins(:child_chat_session)
        .where(
          id: params[:message_id],
          role: ChildChatMessage::ASSISTANT,
          child_chat_sessions: { student_id: child_student.id }
        )
        .first!
    end

    def tts_client_value(client, attribute, default)
      return client.public_send(attribute) if client.respond_to?(attribute)

      default
    end
  end
end
