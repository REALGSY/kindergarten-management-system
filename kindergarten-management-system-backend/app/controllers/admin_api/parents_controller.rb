module AdminApi
  class ParentsController < BaseController
    def index
      render json: Parent.order(:id), status: :ok
    end

    def show
      render json: Parent.find(params[:id]), serializer: ParentSerializer, status: :ok
    end

    def create
      parent = Parent.create!(parent_params_with_default_password)
      render json: parent, serializer: ParentSerializer, status: :created
    end

    def update
      parent = Parent.find(params[:id])
      parent.update!(update_parent_params)
      render json: parent, serializer: ParentSerializer, status: :ok
    end

    def destroy
      Parent.find(params[:id]).destroy!
      head :no_content
    end

    private

    def parent_params
      params.permit(:first_name, :last_name, :phone_number, :email, :password)
    end

    def parent_params_with_default_password
      permitted = parent_params
      permitted[:password] = default_account_password if permitted[:password].blank?
      permitted
    end

    def update_parent_params
      permitted = parent_params
      permitted.delete(:password) if permitted[:password].blank?
      permitted
    end
  end
end
