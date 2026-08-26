module AdminApi
  class ParentingAdviceController < BaseController
    def recipient_options
      parents = Parent
        .where.not(email: [nil, ""])
        .order(:id)
        .map do |parent|
          {
            id: parent.id,
            name: [parent.first_name, parent.last_name].compact.join(" "),
            phone_number: parent.phone_number,
            email: parent.email
          }
        end

      external_email_recipients = ExternalEmailRecipient
        .active
        .order(:name, :id)
        .map do |recipient|
          {
            id: recipient.id,
            name: recipient.name,
            email: recipient.email
          }
        end

      render json: {
        parents: parents,
        external_email_recipients: external_email_recipients
      }, status: :ok
    end
  end
end
