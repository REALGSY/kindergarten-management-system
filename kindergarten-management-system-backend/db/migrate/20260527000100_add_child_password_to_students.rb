require "bcrypt"

class AddChildPasswordToStudents < ActiveRecord::Migration[7.0]
  DEFAULT_CHILD_PASSWORD = "123456"

  def up
    add_column :students, :password_digest, :string

    digest = BCrypt::Password.create(DEFAULT_CHILD_PASSWORD)
    execute <<~SQL.squish
      UPDATE students
      SET password_digest = #{quote(digest)}
      WHERE password_digest IS NULL
    SQL
  end

  def down
    remove_column :students, :password_digest
  end
end
