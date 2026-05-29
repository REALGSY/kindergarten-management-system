# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[7.0].define(version: 2026_05_27_000100) do
  create_table "active_storage_attachments", force: :cascade do |t|
    t.string "name", null: false
    t.string "record_type", null: false
    t.integer "record_id", null: false
    t.integer "blob_id", null: false
    t.datetime "created_at", null: false
    t.index ["blob_id"], name: "index_active_storage_attachments_on_blob_id"
    t.index ["record_type", "record_id", "name", "blob_id"], name: "index_active_storage_attachments_uniqueness", unique: true
  end

  create_table "active_storage_blobs", force: :cascade do |t|
    t.string "key", null: false
    t.string "filename", null: false
    t.string "content_type"
    t.text "metadata"
    t.string "service_name", null: false
    t.bigint "byte_size", null: false
    t.string "checksum"
    t.datetime "created_at", null: false
    t.index ["key"], name: "index_active_storage_blobs_on_key", unique: true
  end

  create_table "active_storage_variant_records", force: :cascade do |t|
    t.integer "blob_id", null: false
    t.string "variation_digest", null: false
    t.index ["blob_id", "variation_digest"], name: "index_active_storage_variant_records_uniqueness", unique: true
  end

  create_table "admins", force: :cascade do |t|
    t.string "first_name"
    t.string "last_name"
    t.string "email"
    t.string "phone_number"
    t.string "password_digest"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["email"], name: "index_admins_on_email", unique: true
  end

  create_table "attendances", force: :cascade do |t|
    t.integer "classroom_id"
    t.integer "student_id"
    t.string "student_name"
    t.string "status"
    t.date "date"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["classroom_id"], name: "index_attendances_on_classroom_id"
    t.index ["student_id", "date"], name: "index_attendances_on_student_id_and_date", unique: true
  end

  create_table "child_chat_messages", force: :cascade do |t|
    t.integer "child_chat_session_id", null: false
    t.string "role", null: false
    t.text "content", null: false
    t.string "model"
    t.integer "prompt_tokens"
    t.integer "completion_tokens"
    t.integer "total_tokens"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["child_chat_session_id", "created_at"], name: "index_child_chat_messages_on_session_and_created_at"
    t.index ["child_chat_session_id"], name: "index_child_chat_messages_on_child_chat_session_id"
  end

  create_table "child_chat_sessions", force: :cascade do |t|
    t.integer "student_id", null: false
    t.integer "parent_id"
    t.string "title"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["parent_id"], name: "index_child_chat_sessions_on_parent_id"
    t.index ["student_id", "created_at"], name: "index_child_chat_sessions_on_student_id_and_created_at"
    t.index ["student_id"], name: "index_child_chat_sessions_on_student_id"
  end

  create_table "classrooms", force: :cascade do |t|
    t.string "name"
    t.integer "teacher_id"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["teacher_id"], name: "index_classrooms_on_teacher_id", unique: true, where: "teacher_id IS NOT NULL"
  end

  create_table "disciplines", force: :cascade do |t|
    t.integer "student_id"
    t.string "title"
    t.string "description"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.date "date"
    t.index ["student_id"], name: "index_disciplines_on_student_id"
  end

  create_table "educational_videos", force: :cascade do |t|
    t.string "title", null: false
    t.text "description"
    t.string "stage", null: false
    t.string "level", null: false
    t.string "subject", null: false
    t.integer "min_age", null: false
    t.integer "max_age", null: false
    t.string "status", default: "draft", null: false
    t.integer "admin_id"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["admin_id"], name: "index_educational_videos_on_admin_id"
    t.index ["min_age", "max_age"], name: "index_educational_videos_on_min_age_and_max_age"
    t.index ["status"], name: "index_educational_videos_on_status"
    t.index ["subject"], name: "index_educational_videos_on_subject"
  end

  create_table "parent_students", force: :cascade do |t|
    t.integer "parent_id"
    t.integer "student_id"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.string "status", default: "pending", null: false
    t.index ["parent_id", "student_id"], name: "index_parent_students_on_parent_id_and_student_id", unique: true
    t.index ["student_id"], name: "index_parent_students_on_student_id"
  end

  create_table "parents", force: :cascade do |t|
    t.string "first_name"
    t.string "last_name"
    t.string "phone_number"
    t.string "password_digest"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["phone_number"], name: "index_parents_on_phone_number", unique: true
  end

  create_table "students", force: :cascade do |t|
    t.string "first_name"
    t.string "second_name"
    t.string "surname"
    t.integer "age"
    t.string "description"
    t.integer "admission_number"
    t.integer "classroom_id"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.string "password_digest"
    t.index ["admission_number"], name: "index_students_on_admission_number", unique: true
    t.index ["classroom_id"], name: "index_students_on_classroom_id"
  end

  create_table "teachers", force: :cascade do |t|
    t.string "first_name"
    t.string "last_name"
    t.string "career_name"
    t.string "password_digest"
    t.string "phone_number"
    t.string "email"
    t.string "gender"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["career_name"], name: "index_teachers_on_career_name", unique: true
    t.index ["email"], name: "index_teachers_on_email", unique: true
  end

  add_foreign_key "active_storage_attachments", "active_storage_blobs", column: "blob_id"
  add_foreign_key "active_storage_variant_records", "active_storage_blobs", column: "blob_id"
  add_foreign_key "attendances", "classrooms"
  add_foreign_key "attendances", "students"
  add_foreign_key "child_chat_messages", "child_chat_sessions"
  add_foreign_key "child_chat_sessions", "parents"
  add_foreign_key "child_chat_sessions", "students"
  add_foreign_key "classrooms", "teachers", on_delete: :nullify
  add_foreign_key "disciplines", "students"
  add_foreign_key "educational_videos", "admins", on_delete: :nullify
  add_foreign_key "parent_students", "parents"
  add_foreign_key "parent_students", "students"
  add_foreign_key "students", "classrooms"
end
