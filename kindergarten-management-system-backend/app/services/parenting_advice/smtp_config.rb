module ParentingAdvice
  class SmtpConfig
    MISSING_MESSAGE = "QQ SMTP configuration is missing".freeze

    def self.configured?
      ENV["QQ_SMTP_USER"].present? && ENV["QQ_SMTP_PASSWORD"].present?
    end

    def self.from_address
      ENV["QQ_SMTP_FROM"].presence || ENV["QQ_SMTP_USER"].presence || "from@example.com"
    end
  end
end
