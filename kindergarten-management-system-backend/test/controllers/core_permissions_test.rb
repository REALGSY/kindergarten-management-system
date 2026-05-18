require "test_helper"

class CorePermissionsTest < ActionDispatch::IntegrationTest
  SECRET = ENV.fetch("JWT_SECRET")

  def setup
    ParentStudent.delete_all
    Discipline.delete_all
    Attendance.delete_all
    Student.delete_all
    Classroom.delete_all
    Parent.delete_all
    Teacher.delete_all
    Admin.delete_all

    @admin = Admin.create!(
      first_name: "System",
      last_name: "Admin",
      email: "admin@example.com",
      phone_number: "0000000000",
      password: "admin123"
    )
    @teacher = Teacher.create!(
      first_name: "Ada",
      last_name: "Lovelace",
      career_name: "TR.ada",
      email: "ada@example.com",
      phone_number: "1111111111",
      gender: "female",
      password: "secret1"
    )
    @other_teacher = Teacher.create!(
      first_name: "Alan",
      last_name: "Turing",
      career_name: "TR.alan",
      email: "alan@example.com",
      phone_number: "2222222222",
      gender: "male",
      password: "secret2"
    )
    @classroom = Classroom.create!(name: "PP1", teacher: @teacher)
    @other_classroom = Classroom.create!(name: "PP2", teacher: @other_teacher)
    @student = Student.create!(
      first_name: "Grace",
      second_name: "A",
      surname: "Hopper",
      age: 5,
      description: "Curious learner",
      admission_number: 1001,
      classroom: @classroom
    )
    @other_student = Student.create!(
      first_name: "Katherine",
      second_name: "B",
      surname: "Johnson",
      age: 5,
      description: "Careful learner",
      admission_number: 1002,
      classroom: @other_classroom
    )
    @parent = Parent.create!(
      first_name: "Mary",
      last_name: "Hopper",
      phone_number: "3333333333",
      password: "secret3"
    )
    ParentStudent.create!(parent: @parent, student: @student, status: ParentStudent::APPROVED)
  end

  test "admin can sign in and manage teacher accounts" do
    post "/admin_login", params: { email: @admin.email, password: "admin123" }, as: :json
    assert_response :accepted
    assert JSON.parse(response.body)["jwt"].present?

    get "/admin/summary", headers: admin_headers(@admin)
    assert_response :success
    assert_equal 2, JSON.parse(response.body)["teacher_count"]

    assert_raises(ActionController::RoutingError) do
      post "/teachers", params: teacher_payload(email: "public@example.com", career_name: "TR.public"), as: :json
    end

    get "/admin/teachers", headers: teacher_headers(@teacher)
    assert_response :forbidden

    post "/admin/teachers",
      headers: admin_headers(@admin),
      params: teacher_payload(email: "new@example.com", career_name: "TR.new", phone_number: "4444444444"),
      as: :json
    assert_response :created
    created_id = JSON.parse(response.body)["id"]

    patch "/admin/teachers/#{created_id}",
      headers: admin_headers(@admin),
      params: { first_name: "Updated" },
      as: :json
    assert_response :success
    assert_equal "Updated", JSON.parse(response.body)["first_name"]

    delete "/admin/teachers/#{created_id}", headers: admin_headers(@admin)
    assert_response :no_content
  end

  test "expired tokens are rejected" do
    expired_token = JWT.encode({ admin_id: @admin.id, exp: 1.hour.ago.to_i }, SECRET)

    get "/admin/summary", headers: { "Authorization" => "Bearer #{expired_token}" }
    assert_response :unauthorized
  end

  test "teacher access is scoped to own classroom and cannot transfer students" do
    get "/students", headers: teacher_headers(@teacher)
    assert_response :success
    assert_equal [@student.id], JSON.parse(response.body).map { |student| student["id"] }

    get "/students/#{@other_student.id}", headers: teacher_headers(@teacher)
    assert_response :not_found

    patch "/students/#{@student.id}",
      headers: teacher_headers(@teacher),
      params: { classroom_id: @other_classroom.id, first_name: "TeacherEdit" },
      as: :json
    assert_response :success
    assert_equal @classroom.id, @student.reload.classroom_id
    assert_equal "TeacherEdit", @student.first_name

    get "/classrooms", headers: teacher_headers(@teacher)
    assert_response :success
    assert_equal [@classroom.id], JSON.parse(response.body).map { |classroom| classroom["id"] }

    assert_raises(ActionController::RoutingError) do
      patch "/classrooms/#{@other_classroom.id}",
        headers: teacher_headers(@teacher),
        params: { teacher_id: @teacher.id },
        as: :json
    end
  end

  test "attendance requires valid status and one record per student per date" do
    post "/attendances",
      headers: teacher_headers(@teacher),
      params: { student_id: @student.id, status: "Present", date: "2026-05-18" },
      as: :json
    assert_response :created

    post "/attendances",
      headers: teacher_headers(@teacher),
      params: { student_id: @student.id, status: "Present", date: "2026-05-18" },
      as: :json
    assert_response :unprocessable_entity

    post "/attendances",
      headers: teacher_headers(@teacher),
      params: { student_id: @other_student.id, status: "Late", date: "2026-05-18" },
      as: :json
    assert_response :not_found

    post "/attendances",
      headers: teacher_headers(@teacher),
      params: { student_id: @student.id, status: "Late", date: "2026-05-19" },
      as: :json
    assert_response :unprocessable_entity
  end

  test "parent child links require admin approval before data is visible" do
    post "/parent_students",
      headers: parent_headers(@parent),
      params: { admission_number: @other_student.admission_number },
      as: :json
    assert_response :created
    link = ParentStudent.find_by!(parent: @parent, student: @other_student)
    assert_equal ParentStudent::PENDING, link.status

    get "/parents/#{@parent.id}", headers: parent_headers(@parent)
    assert_response :success
    student_ids = JSON.parse(response.body)["students"].map { |student| student["id"] }
    assert_equal [@student.id], student_ids

    get "/students/#{@other_student.id}", headers: parent_headers(@parent)
    assert_response :not_found

    patch "/admin/parent_students/#{link.id}",
      headers: admin_headers(@admin),
      params: { status: ParentStudent::APPROVED },
      as: :json
    assert_response :success

    get "/students/#{@other_student.id}", headers: parent_headers(@parent)
    assert_response :success
  end

  test "delete protections keep administrative data consistent" do
    delete "/admin/admins/#{@admin.id}", headers: admin_headers(@admin)
    assert_response :unprocessable_entity

    delete "/admin/classrooms/#{@classroom.id}", headers: admin_headers(@admin)
    assert_response :unprocessable_entity

    delete "/admin/teachers/#{@teacher.id}", headers: admin_headers(@admin)
    assert_response :no_content
    assert_nil @classroom.reload.teacher_id

    Attendance.create!(classroom: @classroom, student: @student, student_name: "Grace Hopper", status: "Present", date: "2026-05-18")
    Discipline.create!(student: @student, title: "Late", date: "2026-05-18", description: "Arrived late")
    assert_difference -> { ParentStudent.count }, -1 do
      delete "/admin/students/#{@student.id}", headers: admin_headers(@admin)
      assert_response :no_content
    end
    assert_equal 0, Attendance.where(student_id: @student.id).count
    assert_equal 0, Discipline.where(student_id: @student.id).count
  end

  private

  def admin_headers(admin)
    { "Authorization" => "Bearer #{JWT.encode({ admin_id: admin.id }, SECRET)}" }
  end

  def teacher_headers(teacher)
    { "Authorization" => "Bearer #{JWT.encode({ teacher_id: teacher.id }, SECRET)}" }
  end

  def parent_headers(parent)
    { "Authorization" => "Bearer #{JWT.encode({ parent_id: parent.id }, SECRET)}" }
  end

  def teacher_payload(overrides = {})
    {
      first_name: "New",
      last_name: "Teacher",
      career_name: "TR.default",
      email: "default@example.com",
      phone_number: "5555555555",
      gender: "female",
      password: "secret4"
    }.merge(overrides)
  end
end
