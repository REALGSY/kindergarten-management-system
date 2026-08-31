require "test_helper"
require "tempfile"

class GrowthRecordsTest < ActionDispatch::IntegrationTest
  SECRET = ENV.fetch("JWT_SECRET")

  def setup
    GrowthRecord.destroy_all
    ParentStudent.delete_all
    Student.delete_all
    Classroom.delete_all
    Parent.delete_all
    Teacher.delete_all

    @teacher = Teacher.create!(
      first_name: "Ada", last_name: "Lovelace", career_name: "TR.growth",
      email: "growth-teacher@example.com", phone_number: "1111111111",
      gender: "female", password: "secret1"
    )
    @other_teacher = Teacher.create!(
      first_name: "Alan", last_name: "Turing", career_name: "TR.other-growth",
      email: "other-growth-teacher@example.com", phone_number: "2222222222",
      gender: "male", password: "secret2"
    )
    classroom = Classroom.create!(name: "Growth A", teacher: @teacher)
    other_classroom = Classroom.create!(name: "Growth B", teacher: @other_teacher)
    @student = Student.create!(
      first_name: "Grace", surname: "Hopper", age: 5,
      admission_number: 8801, classroom: classroom
    )
    @other_student = Student.create!(
      first_name: "Katherine", surname: "Johnson", age: 5,
      admission_number: 8802, classroom: other_classroom
    )
    @parent = Parent.create!(
      first_name: "Mary", last_name: "Hopper",
      phone_number: "3333333333", password: "secret3"
    )
    ParentStudent.create!(parent: @parent, student: @student, status: ParentStudent::APPROVED)
  end

  test "teacher and approved parent share dated observations while access stays scoped" do
    post "/growth_records",
      headers: teacher_headers(@teacher),
      params: { student_id: @student.id, recorded_on: "2026-09-01", note: "今天很开心，主动分享玩具。" },
      as: :json
    assert_response :created
    created = JSON.parse(response.body)
    assert_equal "teacher", created["author_role"]
    assert_includes created["positive_tags"], "开心"
    assert_includes created["positive_tags"], "分享"

    get "/growth_records", headers: parent_headers(@parent), params: { student_id: @student.id }
    assert_response :success
    body = JSON.parse(response.body)
    assert_equal [created["id"]], body["records"].map { |record| record["id"] }
    assert_equal "状态平稳", body.dig("summary", "status")

    get "/growth_records", headers: teacher_headers(@teacher), params: { student_id: @other_student.id }
    assert_response :not_found

    get "/growth_records", headers: parent_headers(@parent), params: { student_id: @other_student.id }
    assert_response :not_found
  end

  test "parent can upload an image and watch words update the summary" do
    image = Tempfile.new(["growth-record", ".png"])
    image.binmode
    image.write("not-a-real-image-but-valid-upload-by-content-type")
    image.rewind
    upload = Rack::Test::UploadedFile.new(image.path, "image/png", true, original_filename: "observation.png")

    post "/growth_records",
      headers: parent_headers(@parent),
      params: {
        student_id: @student.id,
        recorded_on: Date.current.to_s,
        note: "午睡前有点焦虑，也不吃午饭。",
        media: [upload]
      }
    assert_response :created
    created = JSON.parse(response.body)
    assert_equal "parent", created["author_role"]
    assert_equal "image/png", created.dig("media", 0, "content_type")
    assert_includes created["watch_tags"], "焦虑"
    assert_includes created["watch_tags"], "不吃"

    get "/growth_records", headers: teacher_headers(@teacher), params: { student_id: @student.id }
    assert_response :success
    assert_equal "建议关注", JSON.parse(response.body).dig("summary", "status")
  ensure
    image&.close!
  end

  private

  def teacher_headers(teacher)
    { "Authorization" => "Bearer #{JWT.encode({ teacher_id: teacher.id }, SECRET)}" }
  end

  def parent_headers(parent)
    { "Authorization" => "Bearer #{JWT.encode({ parent_id: parent.id }, SECRET)}" }
  end
end
