class CreateGrowthRecords < ActiveRecord::Migration[7.0]
  def change
    create_table :growth_records do |t|
      t.references :student, null: false, foreign_key: true
      t.date :recorded_on, null: false
      t.string :author_role, null: false
      t.bigint :author_id, null: false
      t.text :note
      t.text :analysis
      t.string :positive_tags, default: "", null: false
      t.string :watch_tags, default: "", null: false
      t.timestamps
    end

    add_index :growth_records, [:student_id, :recorded_on]
  end
end
