class AddEmailToParents < ActiveRecord::Migration[7.0]
  def change
    add_column :parents, :email, :string
    add_index :parents, :email
  end
end
