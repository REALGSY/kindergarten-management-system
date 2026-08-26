require "test_helper"

class TencentTtsClientTest < ActiveSupport::TestCase
  Response = Struct.new(:code, :body)

  test "sanitizes emoji and unsupported control characters before synthesis" do
    invalid = "你好".b + "\xC3".b
    invalid.force_encoding("UTF-8")

    assert_equal "你好", TencentTtsClient.sanitize_text("你好😊")
    assert_equal "太棒啦", TencentTtsClient.sanitize_text("太棒啦🎉✨")
    assert_equal "好 朋友", TencentTtsClient.sanitize_text("好\u200B朋友")
    assert_equal "你好", TencentTtsClient.sanitize_text(invalid)
  end

  test "rejects text that has no speakable content after sanitizing" do
    client = TencentTtsClient.new(secret_id: "secret-id", secret_key: "secret-key", transport: success_transport)

    error = assert_raises(TencentTtsClient::NoSpeakableTextError) do
      client.synthesize(text: "😊🎉✨")
    end

    assert_equal "AI 回复中没有可朗读内容", error.message
  end

  test "splits sanitized text into tencent sized chunks" do
    segments = TencentTtsClient.split_text("你" * 151)

    assert_equal 2, segments.length
    assert_equal 150, segments.first.length
    assert_equal 1, segments.second.length
  end

  test "sends cleaned text to tencent text to voice with signed server side request" do
    captured_requests = []
    transport = lambda do |_uri, request|
      captured_requests << request
      Response.new("200", JSON.dump("Response" => { "Audio" => "audio-data", "RequestId" => "request-id" }))
    end
    client = TencentTtsClient.new(
      secret_id: "secret-id",
      secret_key: "secret-key",
      transport: transport,
      clock: -> { Time.at(1_700_000_000).utc }
    )

    result = client.synthesize(text: "太棒啦🎉✨")
    body = JSON.parse(captured_requests.first.body)

    assert_equal "tencent_cloud", result[:provider]
    assert_equal 101_016, result[:voice_type]
    assert_equal "mp3", result[:codec]
    assert_equal 16_000, result[:sample_rate]
    assert_equal [{ audio_base64: "audio-data" }], result[:segments]
    assert_equal "太棒啦", body["Text"]
    assert_equal 101_016, body["VoiceType"]
    assert_equal "mp3", body["Codec"]
    assert_equal "TextToVoice", captured_requests.first["X-TC-Action"]
    assert_match(/\ATC3-HMAC-SHA256 Credential=secret-id\//, captured_requests.first["Authorization"])
    refute_includes captured_requests.first["Authorization"], "secret-key"
  end

  test "maps tencent invalid text errors to a safe local message" do
    transport = lambda do |_uri, _request|
      Response.new(
        "200",
        JSON.dump(
          "Response" => {
            "Error" => {
              "Code" => "InvalidParameterValue.InvalidText",
              "Message" => "invalid text"
            },
            "RequestId" => "request-id"
          }
        )
      )
    end
    client = TencentTtsClient.new(secret_id: "secret-id", secret_key: "secret-key", transport: transport)

    error = assert_raises(TencentTtsClient::ApiError) do
      client.synthesize(text: "你好")
    end

    assert_equal "AI 回复中包含无法朗读的内容", error.message
  end

  private

  def success_transport
    lambda do |_uri, _request|
      Response.new("200", JSON.dump("Response" => { "Audio" => "audio-data", "RequestId" => "request-id" }))
    end
  end
end
