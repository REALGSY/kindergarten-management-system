module AdminApi
  class DisciplinesController < BaseController
    def index
      disciplines = Discipline.includes(:student).order(created_at: :desc)
      disciplines = disciplines.where(student_id: params[:student_id]) if params[:student_id].present?
      render json: disciplines, status: :ok
    end

    def show
      render json: Discipline.find(params[:id]), status: :ok
    end

    def create
      discipline = Discipline.create!(discipline_params)
      render json: discipline, status: :created
    end

    def update
      discipline = Discipline.find(params[:id])
      discipline.update!(discipline_update_params)
      render json: discipline, status: :ok
    end

    def destroy
      Discipline.find(params[:id]).destroy!
      head :no_content
    end

    private

    def discipline_params
      params.permit(:student_id, :title, :date, :description)
    end

    def discipline_update_params
      params.permit(:title, :date, :description)
    end
  end
end
