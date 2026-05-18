module AdminApi
  class AdminsController < BaseController
    def index
      render json: Admin.order(:id), status: :ok
    end

    def profile
      render json: current_admin, serializer: AdminSerializer, status: :ok
    end

    def show
      render json: Admin.find(params[:id]), serializer: AdminSerializer, status: :ok
    end

    def create
      admin = Admin.create!(admin_params_with_default_password)
      render json: admin, serializer: AdminSerializer, status: :created
    end

    def update
      admin = Admin.find(params[:id])
      admin.update!(update_admin_params)
      render json: admin, serializer: AdminSerializer, status: :ok
    end

    def destroy
      admin = Admin.find(params[:id])
      if admin.id == current_admin.id
        render json: { errors: ["You cannot delete your own admin account"] }, status: :unprocessable_entity
        return
      end

      admin.destroy!
      head :no_content
    end

    private

    def admin_params
      params.permit(:first_name, :last_name, :email, :phone_number, :password)
    end

    def admin_params_with_default_password
      permitted = admin_params
      permitted[:password] = default_account_password if permitted[:password].blank?
      permitted
    end

    def update_admin_params
      permitted = admin_params
      permitted.delete(:password) if permitted[:password].blank?
      permitted
    end
  end
end
