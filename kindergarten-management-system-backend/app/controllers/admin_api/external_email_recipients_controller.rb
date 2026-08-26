module AdminApi
  class ExternalEmailRecipientsController < BaseController
    def index
      recipients = ExternalEmailRecipient.order(active: :desc, id: :desc)
      render json: recipients, status: :ok
    end

    def show
      render json: ExternalEmailRecipient.find(params[:id]), status: :ok
    end

    def create
      recipient = ExternalEmailRecipient.create!(recipient_params)
      render json: recipient, status: :created
    end

    def update
      recipient = ExternalEmailRecipient.find(params[:id])
      recipient.update!(recipient_params)
      render json: recipient, status: :ok
    end

    def destroy
      ExternalEmailRecipient.find(params[:id]).deactivate!
      head :no_content
    end

    private

    def recipient_params
      params.permit(:name, :email, :active)
    end
  end
end
