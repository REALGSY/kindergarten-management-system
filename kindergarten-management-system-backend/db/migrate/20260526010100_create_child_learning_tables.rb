class CreateChildLearningTables < ActiveRecord::Migration[7.0]
  def change
    create_table :educational_videos do |t|
      t.string :title, null: false
      t.text :description
      t.string :stage, null: false
      t.string :level, null: false
      t.string :subject, null: false
      t.integer :min_age, null: false
      t.integer :max_age, null: false
      t.string :status, null: false, default: "draft"
      t.references :admin, foreign_key: { on_delete: :nullify }
      t.timestamps

      t.index :status
      t.index :subject
      t.index [:min_age, :max_age]
    end

    create_table :child_chat_sessions do |t|
      t.references :student, null: false, foreign_key: true
      t.references :parent, foreign_key: true
      t.string :title
      t.timestamps

      t.index [:student_id, :created_at]
    end

    create_table :child_chat_messages do |t|
      t.references :child_chat_session, null: false, foreign_key: true
      t.string :role, null: false
      t.text :content, null: false
      t.string :model
      t.integer :prompt_tokens
      t.integer :completion_tokens
      t.integer :total_tokens
      t.timestamps

      t.index [:child_chat_session_id, :created_at], name: "index_child_chat_messages_on_session_and_created_at"
    end
  end
end
