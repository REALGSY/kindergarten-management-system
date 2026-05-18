module AdminApi
  class BaseController < ApplicationController
    before_action :require_admin

    rescue_from ActiveRecord::RecordNotFound, with: :not_found_response
    rescue_from ActiveRecord::RecordInvalid, with: :invalid_response

    private

    def default_account_password
      ENV.fetch("DEFAULT_ACCOUNT_PASSWORD", "123456")
    end

    def not_found_response
      render json: { error: "Record not found" }, status: :not_found
    end

    def invalid_response(invalid)
      render json: { errors: invalid.record.errors.full_messages }, status: :unprocessable_entity
    end
  end
end
