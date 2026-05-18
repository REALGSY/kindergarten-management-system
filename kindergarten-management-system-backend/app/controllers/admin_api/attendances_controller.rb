module AdminApi
  class AttendancesController < BaseController
    def index
      attendances = Attendance.order(created_at: :desc)
      attendances = attendances.where(date: params[:date]) if params[:date].present?
      attendances = attendances.where(student_id: params[:student_id]) if params[:student_id].present?
      attendances = attendances.where(classroom_id: params[:classroom_id]) if params[:classroom_id].present?
      render json: attendances, status: :ok
    end

    def destroy
      Attendance.find(params[:id]).destroy!
      head :no_content
    end
  end
end
