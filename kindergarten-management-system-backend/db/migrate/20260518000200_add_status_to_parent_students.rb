class AddStatusToParentStudents < ActiveRecord::Migration[7.0]
  def up
    add_column :parent_students, :status, :string, default: "pending", null: false

    ParentStudent.reset_column_information
    ParentStudent.update_all(status: "approved")
  end

  def down
    remove_column :parent_students, :status
  end
end
