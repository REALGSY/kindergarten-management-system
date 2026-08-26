require "test_helper"

class AdminApi::ParentingAdviceSchedulesControllerTest < ActionDispatch::IntegrationTest
  SECRET = ENV.fetch("JWT_SECRET")

  def setup
    ActionMailer::Base.deliveries.clear
    ParentingAdviceDeliveryContentItem.delete_all
    ParentingAdviceDeliveryRecipient.delete_all
    ParentingAdviceDelivery.delete_all
    ParentingAdviceContentItem.delete_all
    ParentingAdviceScheduleRecipient.delete_all
    ParentingAdviceSchedule.delete_all
    ExternalEmailRecipient.delete_all
    ParentStudent.delete_all
    Student.delete_all
    Classroom.delete_all
    Parent.delete_all
    Admin.delete_all

    @admin = Admin.create!(
      first_name: "System",
      last_name: "Admin",
      email: "advice-admin@example.com",
      phone_number: "0000000000",
      password: "admin123"
    )
    @parent = Parent.create!(
      first_name: "Mary",
      last_name: "Hopper",
      phone_number: "3333333333",
      email: "Family@Example.com",
      password: "secret3"
    )
    @parent_without_email = Parent.create!(
      first_name: "No",
      last_name: "Email",
      phone_number: "4444444444",
      password: "secret4"
    )
    @external = ExternalEmailRecipient.create!(
      name: "Grandparent",
      email: "grandparent@example.com"
    )
  end

  test "recipient options include parents with email and active external recipients" do
    inactive = ExternalEmailRecipient.create!(name: "Inactive", email: "inactive@example.com", active: false)

    get "/admin/parenting_advice/recipient_options", headers: admin_headers

    assert_response :success
    body = JSON.parse(response.body)
    assert_equal [@parent.id], body["parents"].map { |parent| parent["id"] }
    assert_equal ["family@example.com"], body["parents"].map { |parent| parent["email"] }
    assert_includes body["external_email_recipients"].map { |recipient| recipient["id"] }, @external.id
    assert_not_includes body["external_email_recipients"].map { |recipient| recipient["id"] }, inactive.id
  end

  test "admin creates daily schedule with deduped recipients" do
    duplicate = ExternalEmailRecipient.create!(name: "Duplicate", email: @parent.email)

    post "/admin/parenting_advice_schedules",
      headers: admin_headers,
      params: {
        title: "Bedtime routine",
        body: "Keep the bedtime routine calm and predictable.",
        recurrence: ParentingAdviceSchedule::DAILY,
        send_time: "20:30",
        parent_ids: [@parent.id, @parent_without_email.id],
        external_email_recipient_ids: [@external.id, duplicate.id]
      },
      as: :json

    assert_response :created
    schedule = ParentingAdviceSchedule.last
    assert_equal ParentingAdviceSchedule::DAILY, schedule.recurrence
    assert_equal "20:30", schedule.send_time
    assert_equal ParentingAdviceSchedule::ACTIVE, schedule.status
    assert schedule.next_run_at.present?
    assert_equal ["family@example.com", "grandparent@example.com"], schedule.schedule_recipients.order(:id).pluck(:email)
    body = JSON.parse(response.body)
    assert_equal 2, body["recipients"].length
  end

  test "admin immediately sends a one-time schedule without a scheduled time" do
    with_smtp_env do
      post "/admin/parenting_advice_schedules",
        headers: admin_headers,
        params: {
          title: "Send now tip",
          body: "Read together for ten minutes.",
          recurrence: ParentingAdviceSchedule::ONE_TIME,
          immediate_send: true,
          parent_ids: [@parent.id]
        },
        as: :json

      assert_response :created
      schedule = ParentingAdviceSchedule.last
      assert_equal ParentingAdviceSchedule::COMPLETED, schedule.status
      assert_nil schedule.next_run_at
      assert_equal 1, schedule.deliveries.count
      assert_equal ParentingAdviceDelivery::SUCCEEDED, schedule.deliveries.last.status
      assert_equal ["family@example.com"], ActionMailer::Base.deliveries.map { |mail| mail.to.first }

      body = JSON.parse(response.body)
      assert_equal "completed", body["status"]
      assert_equal "succeeded", body.dig("deliveries", 0, "status")
    end
  end

  test "admin creates whitelist schedule without custom body" do
    post "/admin/parenting_advice_schedules",
      headers: admin_headers,
      params: {
        source_type: ParentingAdviceSchedule::WHITELIST_SOURCE,
        title: "",
        recurrence: ParentingAdviceSchedule::DAILY,
        send_time: "08:00",
        external_email_recipient_ids: [@external.id]
      },
      as: :json

    assert_response :created
    schedule = ParentingAdviceSchedule.last
    assert_equal ParentingAdviceSchedule::WHITELIST_SOURCE, schedule.source_type
    assert_equal "本期育儿精选", schedule.title
    assert_equal "", schedule.body
    assert_equal [@external.email], schedule.schedule_recipients.pluck(:email)
  end

  test "admin can pause resume and soft delete schedule" do
    schedule = create_schedule

    patch "/admin/parenting_advice_schedules/#{schedule.id}/pause", headers: admin_headers
    assert_response :success
    assert_equal ParentingAdviceSchedule::PAUSED, schedule.reload.status

    patch "/admin/parenting_advice_schedules/#{schedule.id}/resume", headers: admin_headers
    assert_response :success
    assert_equal ParentingAdviceSchedule::ACTIVE, schedule.reload.status
    assert schedule.next_run_at.present?

    delete "/admin/parenting_advice_schedules/#{schedule.id}", headers: admin_headers
    assert_response :no_content
    assert_equal ParentingAdviceSchedule::DELETED, schedule.reload.status
  end

  test "create requires a valid recipient" do
    post "/admin/parenting_advice_schedules",
      headers: admin_headers,
      params: {
        title: "Missing recipient",
        body: "No one should receive this.",
        recurrence: ParentingAdviceSchedule::DAILY,
        send_time: "08:00",
        parent_ids: [@parent_without_email.id]
      },
      as: :json

    assert_response :unprocessable_entity
    assert_equal 0, ParentingAdviceSchedule.count
  end

  test "admin manages external email recipients with soft delete" do
    post "/admin/external_email_recipients",
      headers: admin_headers,
      params: { name: "Aunt", email: "Aunt@Example.com" },
      as: :json
    assert_response :created
    created = ExternalEmailRecipient.last
    assert_equal "aunt@example.com", created.email
    assert created.active?

    patch "/admin/external_email_recipients/#{created.id}",
      headers: admin_headers,
      params: { name: "Aunt Jane" },
      as: :json
    assert_response :success
    assert_equal "Aunt Jane", created.reload.name

    delete "/admin/external_email_recipients/#{created.id}", headers: admin_headers
    assert_response :no_content
    assert_not created.reload.active?
  end

  private

  def create_schedule
    schedule = ParentingAdviceSchedule.create!(
      admin: @admin,
      title: "Morning tip",
      body: "Talk about the day before school.",
      recurrence: ParentingAdviceSchedule::DAILY,
      send_time: "08:00"
    )
    schedule.schedule_recipients.create!(
      recipient_type: ParentingAdviceScheduleRecipient::PARENT,
      recipient_id: @parent.id,
      name: "Mary Hopper",
      email: @parent.email
    )
    schedule
  end

  def admin_headers
    { "Authorization" => "Bearer #{JWT.encode({ admin_id: @admin.id }, SECRET)}" }
  end

  def with_smtp_env
    previous_user = ENV["QQ_SMTP_USER"]
    previous_password = ENV["QQ_SMTP_PASSWORD"]
    ENV["QQ_SMTP_USER"] = "sender@example.com"
    ENV["QQ_SMTP_PASSWORD"] = "test-password"
    yield
  ensure
    previous_user.nil? ? ENV.delete("QQ_SMTP_USER") : ENV["QQ_SMTP_USER"] = previous_user
    previous_password.nil? ? ENV.delete("QQ_SMTP_PASSWORD") : ENV["QQ_SMTP_PASSWORD"] = previous_password
  end
end
