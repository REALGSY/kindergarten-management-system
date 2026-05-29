module ChildApi
  class StudentsController < BaseController
    def index
      render json: [child_student], status: :ok
    end

    def show
      render json: child_student, serializer: StudentSerializer, status: :ok
    end
  end
end
