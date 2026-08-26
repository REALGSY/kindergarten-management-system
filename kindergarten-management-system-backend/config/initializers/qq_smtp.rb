if ENV["QQ_SMTP_USER"].present? && ENV["QQ_SMTP_PASSWORD"].present?
  smtp_port = ENV.fetch("QQ_SMTP_PORT", "587").to_i
  use_ssl = smtp_port == 465

  Rails.application.config.action_mailer.smtp_settings = {
    address: ENV.fetch("QQ_SMTP_ADDRESS", "smtp.qq.com"),
    port: smtp_port,
    user_name: ENV["QQ_SMTP_USER"],
    password: ENV["QQ_SMTP_PASSWORD"],
    authentication: ENV.fetch("QQ_SMTP_AUTHENTICATION", "plain").to_sym,
    enable_starttls_auto: !use_ssl,
    ssl: use_ssl
  }

  Rails.application.config.action_mailer.delivery_method = :smtp unless Rails.env.test?
  Rails.application.config.action_mailer.raise_delivery_errors = true
end
