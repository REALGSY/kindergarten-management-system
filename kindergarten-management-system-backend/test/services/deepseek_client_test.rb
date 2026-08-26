require "test_helper"

class DeepseekClientTest < ActiveSupport::TestCase
  test "uses generic llm base url and chat model when deepseek-specific values are not set" do
    with_env(
      "DEEPSEEK_BASE_URL" => nil,
      "DEEPSEEK_MODEL" => nil,
      "LLM_BASE_URL" => "https://llm.example",
      "CHAT_MODEL" => "chat-model"
    ) do
      client = DeepseekClient.new(api_key: "test-key")

      assert_equal "https://llm.example", client.instance_variable_get(:@base_url)
      assert_equal "chat-model", client.instance_variable_get(:@model)
    end
  end

  test "deepseek-specific values take precedence over generic llm settings" do
    with_env(
      "DEEPSEEK_BASE_URL" => "https://deepseek.example",
      "DEEPSEEK_MODEL" => "deepseek-model",
      "LLM_BASE_URL" => "https://llm.example",
      "CHAT_MODEL" => "chat-model"
    ) do
      client = DeepseekClient.new(api_key: "test-key")

      assert_equal "https://deepseek.example", client.instance_variable_get(:@base_url)
      assert_equal "deepseek-model", client.instance_variable_get(:@model)
    end
  end

  test "uses generic llm api key when deepseek api key is not set" do
    with_env(
      "DEEPSEEK_API_KEY" => nil,
      "LLM_API_KEY" => "generic-key"
    ) do
      client = DeepseekClient.new

      assert_equal "generic-key", client.instance_variable_get(:@api_key)
    end
  end

  test "deepseek api key takes precedence over generic llm api key" do
    with_env(
      "DEEPSEEK_API_KEY" => "deepseek-key",
      "LLM_API_KEY" => "generic-key"
    ) do
      client = DeepseekClient.new

      assert_equal "deepseek-key", client.instance_variable_get(:@api_key)
    end
  end

  private

  def with_env(values)
    previous = values.each_key.to_h { |key| [key, ENV[key]] }
    values.each do |key, value|
      value.nil? ? ENV.delete(key) : ENV[key] = value
    end

    yield
  ensure
    previous.each do |key, value|
      value.nil? ? ENV.delete(key) : ENV[key] = value
    end
  end
end
