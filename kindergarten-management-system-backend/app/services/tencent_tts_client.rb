require "digest"
require "json"
require "net/http"
require "openssl"
require "securerandom"
require "time"
require "uri"

class TencentTtsClient
  class Error < StandardError; end
  class ConfigurationError < Error; end
  class ApiError < Error; end
  class NoSpeakableTextError < Error; end
  class TextTooLongError < Error; end

  HOST = "tts.tencentcloudapi.com"
  ENDPOINT = URI("https://#{HOST}/")
  SERVICE = "tts"
  ACTION = "TextToVoice"
  VERSION = "2019-08-23"
  ALGORITHM = "TC3-HMAC-SHA256"
  CONTENT_TYPE = "application/json; charset=utf-8"
  DEFAULT_CODEC = "mp3"
  DEFAULT_SAMPLE_RATE = 16_000
  DEFAULT_VOICE_TYPE = 101_016
  TENCENT_TEXT_LIMIT = 150
  DEFAULT_MAX_CLEAN_TEXT_LENGTH = 1_200
  ALLOWED_TTS_PUNCTUATION = "，。！？；：、,.!?;:()（）《》“”‘’\"'-—…·【】[]{}<>%％+＝=￥$&".freeze

  EMOJI_PATTERN = /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{E0020}-\u{E007F}]/u
  FORMAT_AND_CONTROL_PATTERN = /[\p{Cc}\p{Cf}]/u
  UNSUPPORTED_CHARACTER_PATTERN =
    /[^\p{L}\p{N}\s#{Regexp.escape(ALLOWED_TTS_PUNCTUATION)}]/u

  attr_reader :voice_type, :codec, :sample_rate

  def self.sanitize_text(text)
    text.to_s
      .scrub("")
      .gsub(EMOJI_PATTERN, "")
      .gsub(FORMAT_AND_CONTROL_PATTERN, " ")
      .gsub(UNSUPPORTED_CHARACTER_PATTERN, "")
      .gsub(/\s+/u, " ")
      .strip
  end

  def self.split_text(text, limit: TENCENT_TEXT_LIMIT)
    sanitized = sanitize_text(text)
    return [] if sanitized.blank?

    tokens = sanitized.scan(/[^。！？!?；;\n]+[。！？!?；;]?/u)
    tokens = [sanitized] if tokens.empty?
    segments = []
    current = +""

    tokens.each do |token|
      token = token.strip
      next if token.blank?

      if token.length > limit
        segments << current.strip if current.present?
        current = +""
        token.chars.each_slice(limit) do |chars|
          segment = chars.join.strip
          segments << segment if segment.present?
        end
      elsif current.length + token.length <= limit
        current << token
      else
        segments << current.strip if current.present?
        current = token.dup
      end
    end

    segments << current.strip if current.present?
    segments
  end

  def initialize(
    secret_id: ENV["TENCENTCLOUD_SECRET_ID"],
    secret_key: ENV["TENCENTCLOUD_SECRET_KEY"],
    voice_type: ENV.fetch("TENCENT_TTS_VOICE_TYPE", DEFAULT_VOICE_TYPE.to_s).to_i,
    codec: ENV.fetch("TENCENT_TTS_CODEC", DEFAULT_CODEC),
    sample_rate: ENV.fetch("TENCENT_TTS_SAMPLE_RATE", DEFAULT_SAMPLE_RATE.to_s).to_i,
    speed: ENV.fetch("TENCENT_TTS_SPEED", "0").to_f,
    volume: ENV.fetch("TENCENT_TTS_VOLUME", "0").to_f,
    max_clean_text_length: ENV.fetch("TENCENT_TTS_MAX_TEXT_CHARS", DEFAULT_MAX_CLEAN_TEXT_LENGTH.to_s).to_i,
    transport: nil,
    clock: -> { Time.now.utc }
  )
    @secret_id = secret_id
    @secret_key = secret_key
    @voice_type = voice_type
    @codec = codec
    @sample_rate = sample_rate
    @speed = speed
    @volume = volume
    @max_clean_text_length = max_clean_text_length
    @transport = transport
    @clock = clock
  end

  def synthesize(text:)
    ensure_configured!

    clean_text = self.class.sanitize_text(text)
    raise NoSpeakableTextError, "AI 回复中没有可朗读内容" if clean_text.blank?
    if clean_text.length > @max_clean_text_length
      raise TextTooLongError, "AI 回复太长，暂时无法朗读完整内容"
    end

    segments = self.class.split_text(clean_text)
    audio_segments = segments.map do |segment|
      { audio_base64: request_audio(segment) }
    end

    {
      provider: "tencent_cloud",
      voice_type: @voice_type,
      codec: @codec,
      sample_rate: @sample_rate,
      segments: audio_segments
    }
  end

  private

  def ensure_configured!
    return if @secret_id.present? && @secret_key.present?

    raise ConfigurationError, "腾讯云语音合成密钥未配置"
  end

  def request_audio(text)
    payload = JSON.dump(request_payload(text))
    request = build_request(payload)
    response = perform_request(request)
    parsed = parse_response(response)

    unless success_response?(response)
      raise ApiError, "腾讯云语音合成请求失败"
    end

    error = parsed.dig("Response", "Error")
    raise ApiError, api_error_message(error) if error.present?

    audio = parsed.dig("Response", "Audio").to_s
    raise ApiError, "腾讯云语音合成返回为空" if audio.blank?

    audio
  end

  def request_payload(text)
    {
      Text: text,
      SessionId: SecureRandom.uuid,
      VoiceType: @voice_type,
      Volume: @volume,
      Speed: @speed,
      ProjectId: 0,
      ModelType: 1,
      PrimaryLanguage: 1,
      SampleRate: @sample_rate,
      Codec: @codec
    }
  end

  def build_request(payload)
    timestamp = @clock.call.to_i
    request = Net::HTTP::Post.new(ENDPOINT)
    request["Authorization"] = authorization_header(payload, timestamp)
    request["Content-Type"] = CONTENT_TYPE
    request["Host"] = HOST
    request["X-TC-Action"] = ACTION
    request["X-TC-Timestamp"] = timestamp.to_s
    request["X-TC-Version"] = VERSION
    request.body = payload
    request
  end

  def authorization_header(payload, timestamp)
    date = Time.at(timestamp).utc.strftime("%Y-%m-%d")
    credential_scope = "#{date}/#{SERVICE}/tc3_request"
    signed_headers = "content-type;host;x-tc-action"
    canonical_headers = [
      "content-type:#{CONTENT_TYPE}",
      "host:#{HOST}",
      "x-tc-action:#{ACTION.downcase}"
    ].join("\n") + "\n"
    canonical_request = [
      "POST",
      "/",
      "",
      canonical_headers,
      signed_headers,
      sha256_hex(payload)
    ].join("\n")
    string_to_sign = [
      ALGORITHM,
      timestamp.to_s,
      credential_scope,
      sha256_hex(canonical_request)
    ].join("\n")
    signature = hmac_sha256(
      hmac_sha256(hmac_sha256(hmac_sha256("TC3#{@secret_key}", date), SERVICE), "tc3_request"),
      string_to_sign
    ).unpack1("H*")

    "#{ALGORITHM} Credential=#{@secret_id}/#{credential_scope}, SignedHeaders=#{signed_headers}, Signature=#{signature}"
  end

  def perform_request(request)
    return @transport.call(ENDPOINT, request) if @transport

    Net::HTTP.start(ENDPOINT.hostname, ENDPOINT.port, use_ssl: true, open_timeout: 10, read_timeout: 30) do |http|
      http.request(request)
    end
  rescue Net::OpenTimeout, Net::ReadTimeout, SocketError, Errno::ECONNREFUSED => e
    raise ApiError, "腾讯云语音合成请求失败：#{e.message}"
  end

  def parse_response(response)
    JSON.parse(response.body.to_s)
  rescue JSON::ParserError
    raise ApiError, "腾讯云语音合成返回无效"
  end

  def success_response?(response)
    return true if response.is_a?(Net::HTTPSuccess)
    return response.code.to_i.between?(200, 299) if response.respond_to?(:code)

    false
  end

  def api_error_message(error)
    code = error["Code"].to_s
    return "AI 回复中包含无法朗读的内容" if code == "InvalidParameterValue.InvalidText"
    return "AI 回复太长，暂时无法朗读完整内容" if code == "UnsupportedOperation.TextTooLong"

    "腾讯云语音合成失败"
  end

  def sha256_hex(value)
    Digest::SHA256.hexdigest(value)
  end

  def hmac_sha256(key, value)
    OpenSSL::HMAC.digest("SHA256", key, value)
  end
end
