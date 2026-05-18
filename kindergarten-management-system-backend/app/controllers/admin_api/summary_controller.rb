module AdminApi
  class SummaryController < BaseController
    def index
      today = Date.current.to_s
      attendance_today = Attendance.where(date: today)

      render json: {
        teacher_count: Teacher.count,
        classroom_count: Classroom.count,
        student_count: Student.count,
        parent_count: Parent.count,
        pending_parent_student_count: ParentStudent.pending.count,
        discipline_count: Discipline.count,
        today: today,
        attendance_today: {
          total: attendance_today.count,
          present: attendance_today.where(status: "Present").count,
          absent: attendance_today.where(status: "Absent").count
        }
      }, status: :ok
    end
  end
end
