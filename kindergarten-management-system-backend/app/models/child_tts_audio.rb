require "digest"
require "json"

class ChildTtsAudio < ApplicationRecord
  PROVIDER = "tencent_cloud"
  CACHE_KEY_SEPARATOR = "\u001F"

  belongs_to :child_chat_message, optional: true

  validates :audio_cache_key, presence: true, uniqueness: true
  validates :provider, :voice_type, :codec, :sample_rate, :text_digest, :clean_text, :audio_segments, presence: true

  def self.audio_cache_key(provider:, voice_type:, codec:, sample_rate:, clean_text:)
    text_digest = Digest::SHA256.hexdigest(clean_text.to_s)
    Digest::SHA256.hexdigest([provider, voice_type, codec, sample_rate, text_digest].join(CACHE_KEY_SEPARATOR))
  end

  def self.text_digest(clean_text)
    Digest::SHA256.hexdigest(clean_text.to_s)
  end

  def self.build_from_tts_result(audio_cache_key:, clean_text:, child_chat_message:, result:)
    segments = Array(result[:segments]).filter_map do |segment|
      audio_base64 = segment[:audio_base64] || segment["audio_base64"]
      audio_base64.present? ? { audio_base64: audio_base64 } : nil
    end

    new(
      child_chat_message: child_chat_message,
      audio_cache_key: audio_cache_key,
      provider: result[:provider] || PROVIDER,
      voice_type: result[:voice_type],
      codec: result[:codec],
      sample_rate: result[:sample_rate],
      text_digest: text_digest(clean_text),
      clean_text: clean_text,
      audio_segments: JSON.dump(segments),
      audio_bytes: segments.sum { |segment| segment[:audio_base64].to_s.bytesize }
    )
  end

  def segments
    JSON.parse(audio_segments).map { |segment| { audio_base64: segment.fetch("audio_base64") } }
  rescue JSON::ParserError, KeyError
    []
  end

  def to_tts_response(cached: true)
    {
      provider: provider,
      voice_type: voice_type,
      codec: codec,
      sample_rate: sample_rate,
      segments: segments,
      cached: cached
    }
  end
end
