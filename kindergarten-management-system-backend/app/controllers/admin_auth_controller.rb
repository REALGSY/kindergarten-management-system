class AdminAuthController < ApplicationController
  skip_before_action :authorize, only: [:create]

  def create
    admin = Admin.find_by(email: params[:email])
    if admin&.authenticate(params[:password])
      token = encode_token(admin_id: admin.id)
      render json: { admin: AdminSerializer.new(admin), jwt: token }, status: :accepted
    else
      render json: { errors: "Invalid email or password" }, status: :unauthorized
    end
  end
end
