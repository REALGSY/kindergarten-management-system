class ParentingAdviceMailer < ApplicationMailer
  def advice_email
    @body = params.fetch(:body)
    @content_items = Array(params[:content_items]).map { |item| normalize_item(item) }
    @ai_analysis = params[:ai_analysis]

    mail(
      to: params.fetch(:to),
      from: ParentingAdvice::SmtpConfig.from_address,
      subject: params.fetch(:subject)
    )
  end

  private

  def normalize_item(item)
    if item.respond_to?(:attributes)
      item.attributes.symbolize_keys
    else
      item.to_h.symbolize_keys
    end
  end
end
