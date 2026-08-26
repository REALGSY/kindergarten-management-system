require "test_helper"
require "tempfile"
require "csv"
require "caxlsx"
require "roo"

class AdminApi::ClassroomImportsControllerTest < ActionDispatch::IntegrationTest
  SECRET = ENV.fetch("JWT_SECRET")

  setup do
    ParentStudent.delete_all
    Attendance.delete_all
    Discipline.delete_all
    Student.delete_all
    Classroom.delete_all
    Teacher.delete_all
    Admin.delete_all

    @admin = Admin.create!(
      first_name: "Ada",
      last_name: "Admin",
      email: "admin.import@example.com",
      password: "secret4"
    )
    @teacher = Teacher.create!(
      first_name: "Grace",
      last_name: "Teacher",
      career_name: "TR.import",
      email: "teacher.import@example.com",
      phone_number: "1111111111",
      gender: "female",
      password: "secret4"
    )
  end

  test "downloads csv template" do
    get "/admin/classroom_imports/template",
      headers: admin_headers,
      params: { format: "csv" }

    assert_response :success
    assert_includes response.headers["Content-Disposition"], "classroom_import_template.csv"
    assert_includes response.body, ClassroomImportService::HEADERS.join(",")
  end

  test "downloads xlsx template" do
    get "/admin/classroom_imports/template",
      headers: admin_headers,
      params: { format: "xlsx" }

    assert_response :success
    assert_includes response.headers["Content-Disposition"], "classroom_import_template.xlsx"
    assert_equal "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", response.media_type
    assert response.body.bytesize.positive?

    file = Tempfile.new(["classroom-template", ".xlsx"])
    file.binmode
    file.write(response.body)
    file.flush
    workbook = Roo::Excelx.new(file.path, file_warning: :ignore)
    assert_equal ClassroomImportService::HEADERS, workbook.sheet(workbook.sheets.first).row(1)
  end

  test "previews and imports valid csv file" do
    file = uploaded_csv([
      ["Sunflower A", @teacher.career_name, "1001", "一一", "", "王", "4", "喜欢画画"],
      ["Sunflower A", @teacher.career_name, "1002", "二二", "", "李", "5", ""]
    ])

    post "/admin/classroom_imports/preview", headers: admin_headers, params: { file: file }

    assert_response :success
    preview = JSON.parse(response.body)
    assert_equal true, preview["valid"], preview["errors"].inspect
    assert_equal "Sunflower A", preview.dig("classroom", "name")
    assert_equal 2, preview["students"].length

    file = uploaded_csv([
      ["Sunflower A", @teacher.career_name, "1001", "一一", "", "王", "4", "喜欢画画"],
      ["Sunflower A", @teacher.career_name, "1002", "二二", "", "李", "5", ""]
    ])

    assert_difference -> { Classroom.count }, 1 do
      assert_difference -> { Student.count }, 2 do
        post "/admin/classroom_imports", headers: admin_headers, params: { file: file }
      end
    end

    assert_response :created
    classroom = Classroom.find_by!(name: "Sunflower A")
    assert_equal @teacher.id, classroom.teacher_id
    assert_equal [1001, 1002], classroom.students.order(:admission_number).pluck(:admission_number)
  end

  test "previews valid xlsx file" do
    file = uploaded_xlsx([
      ["Maple A", @teacher.career_name, 2001, "三三", nil, "赵", 4, "安静"]
    ])

    post "/admin/classroom_imports/preview", headers: admin_headers, params: { file: file }

    assert_response :success
    preview = JSON.parse(response.body)
    assert_equal true, preview["valid"], preview["errors"].inspect
    assert_equal "Maple A", preview.dig("classroom", "name")
    assert_equal 2001, preview.dig("students", 0, "admission_number")
  end

  test "invalid import returns row errors and does not persist" do
    Student.create!(
      classroom: Classroom.create!(name: "Existing", teacher: @teacher),
      first_name: "Existing",
      surname: "Student",
      age: 4,
      admission_number: 3001
    )

    free_teacher = Teacher.create!(
      first_name: "Free",
      last_name: "Teacher",
      career_name: "TR.free",
      email: "teacher.free@example.com",
      phone_number: "2222222222",
      gender: "male",
      password: "secret4"
    )

    file = uploaded_csv([
      ["New Class", free_teacher.career_name, "3001", "重复", "", "张", "4", ""],
      ["New Class", free_teacher.career_name, "3002", "", "", "陈", "bad", ""],
      ["New Class", free_teacher.career_name, "3002", "重复行", "", "刘", "5", ""]
    ])

    assert_no_difference -> { Classroom.count } do
      assert_no_difference -> { Student.count } do
        post "/admin/classroom_imports", headers: admin_headers, params: { file: file }
      end
    end

    assert_response :unprocessable_entity
    body = JSON.parse(response.body)
    assert_equal false, body["valid"]
    messages = body["errors"].flat_map { |error| error["messages"] }
    assert_includes messages, "学号已存在：3001"
    assert_includes messages, "名不能为空"
    assert_includes messages, "年龄必须是正整数"
    assert_includes messages, "学号在文件中重复"
  end

  test "teacher already assigned blocks import" do
    Classroom.create!(name: "Busy Class", teacher: @teacher)
    file = uploaded_csv([
      ["New Class", @teacher.career_name, "4001", "四四", "", "孙", "4", ""]
    ])

    post "/admin/classroom_imports/preview", headers: admin_headers, params: { file: file }

    assert_response :success
    body = JSON.parse(response.body)
    assert_equal false, body["valid"]
    messages = body["errors"].flat_map { |error| error["messages"] }
    assert_includes messages, "教师 #{@teacher.career_name} 已绑定班级：Busy Class"
  end

  test "existing classroom name blocks import" do
    Classroom.create!(name: "Existing Class")
    file = uploaded_csv([
      ["Existing Class", @teacher.career_name, "4501", "四五", "", "吴", "4", ""]
    ])

    assert_no_difference -> { Classroom.count } do
      assert_no_difference -> { Student.count } do
        post "/admin/classroom_imports", headers: admin_headers, params: { file: file }
      end
    end

    assert_response :unprocessable_entity
    body = JSON.parse(response.body)
    messages = body["errors"].flat_map { |error| error["messages"] }
    assert_includes messages, "班级名称已存在：Existing Class"
  end

  test "unknown teacher career name blocks import" do
    file = uploaded_csv([
      ["New Class", "TR.missing", "4601", "四六", "", "郑", "4", ""]
    ])

    assert_no_difference -> { Classroom.count } do
      assert_no_difference -> { Student.count } do
        post "/admin/classroom_imports", headers: admin_headers, params: { file: file }
      end
    end

    assert_response :unprocessable_entity
    body = JSON.parse(response.body)
    messages = body["errors"].flat_map { |error| error["messages"] }
    assert_includes messages, "教师工号名不存在：TR.missing"
  end

  test "multiple class names are rejected" do
    file = uploaded_csv([
      ["Class A", @teacher.career_name, "5001", "五一", "", "钱", "4", ""],
      ["Class B", @teacher.career_name, "5002", "五二", "", "周", "5", ""]
    ])

    post "/admin/classroom_imports/preview", headers: admin_headers, params: { file: file }

    assert_response :success
    body = JSON.parse(response.body)
    messages = body["errors"].flat_map { |error| error["messages"] }
    assert_includes messages, "每次导入只能包含一个班级名称"
  end

  test "multiple teacher career names are rejected" do
    other_teacher = Teacher.create!(
      first_name: "Other",
      last_name: "Teacher",
      career_name: "TR.other",
      email: "teacher.other@example.com",
      phone_number: "3333333333",
      gender: "female",
      password: "secret4"
    )
    file = uploaded_csv([
      ["Class A", @teacher.career_name, "5101", "五一", "", "钱", "4", ""],
      ["Class A", other_teacher.career_name, "5102", "五二", "", "周", "5", ""]
    ])

    post "/admin/classroom_imports/preview", headers: admin_headers, params: { file: file }

    assert_response :success
    body = JSON.parse(response.body)
    messages = body["errors"].flat_map { |error| error["messages"] }
    assert_includes messages, "每次导入只能包含一个教师工号名"
  end

  private

  def admin_headers
    { "Authorization" => "Bearer #{JWT.encode({ admin_id: @admin.id }, SECRET)}" }
  end

  def uploaded_csv(rows)
    file = Tempfile.new(["classroom-import", ".csv"])
    file.binmode
    file.write(CSV.generate(headers: ClassroomImportService::HEADERS, write_headers: true) do |csv|
      rows.each { |row| csv << row }
    end)
    file.rewind
    Rack::Test::UploadedFile.new(file.path, "text/csv", original_filename: "classroom-import.csv")
  end

  def uploaded_xlsx(rows)
    file = Tempfile.new(["classroom-import", ".xlsx"])
    file.binmode
    package = Axlsx::Package.new
    package.workbook.add_worksheet(name: "班级导入模板") do |sheet|
      sheet.add_row ClassroomImportService::HEADERS
      rows.each { |row| sheet.add_row row }
    end
    file.write(package.to_stream.read)
    file.flush
    file.rewind
    Rack::Test::UploadedFile.new(
      file.path,
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      true,
      original_filename: "classroom-import.xlsx"
    )
  end
end
