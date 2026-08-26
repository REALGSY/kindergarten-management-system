class CreateParentingAdviceEmailTables < ActiveRecord::Migration[7.0]
  def change
    create_table :external_email_recipients do |t|
      t.string :name, null: false
      t.string :email, null: false
      t.boolean :active, default: true, null: false
      t.timestamps
    end
    add_index :external_email_recipients, :email, unique: true
    add_index :external_email_recipients, :active

    create_table :parenting_advice_schedules do |t|
      t.references :admin, foreign_key: { on_delete: :nullify }
      t.string :title, null: false
      t.text :body, null: false
      t.string :recurrence, null: false
      t.datetime :scheduled_at
      t.string :send_time
      t.integer :weekday
      t.datetime :next_run_at
      t.string :status, default: "active", null: false
      t.string :source_type, default: "custom", null: false
      t.text :source_config, default: "{}", null: false
      t.timestamps
    end
    add_index :parenting_advice_schedules, [:status, :next_run_at], name: "index_pa_schedules_on_status_and_next_run_at"

    create_table :parenting_advice_schedule_recipients do |t|
      t.references :parenting_advice_schedule, null: false, foreign_key: true, index: { name: "index_pa_schedule_recipients_on_schedule_id" }
      t.string :recipient_type, null: false
      t.integer :recipient_id
      t.string :name, null: false
      t.string :email, null: false
      t.timestamps
    end
    add_index :parenting_advice_schedule_recipients,
      [:parenting_advice_schedule_id, :email],
      unique: true,
      name: "index_pa_schedule_recipients_on_schedule_and_email"

    create_table :parenting_advice_deliveries do |t|
      t.references :parenting_advice_schedule, null: false, foreign_key: true, index: { name: "index_pa_deliveries_on_schedule_id" }
      t.datetime :scheduled_run_at, null: false
      t.string :status, default: "running", null: false
      t.integer :sent_count, default: 0, null: false
      t.integer :failed_count, default: 0, null: false
      t.datetime :started_at
      t.datetime :completed_at
      t.text :error_message
      t.timestamps
    end
    add_index :parenting_advice_deliveries,
      [:parenting_advice_schedule_id, :scheduled_run_at],
      unique: true,
      name: "index_pa_deliveries_on_schedule_and_run_at"

    create_table :parenting_advice_delivery_recipients do |t|
      t.references :parenting_advice_delivery, null: false, foreign_key: true, index: { name: "index_pa_delivery_recipients_on_delivery_id" }
      t.string :name
      t.string :email, null: false
      t.string :status, null: false
      t.datetime :sent_at
      t.text :error_message
      t.timestamps
    end
    add_index :parenting_advice_delivery_recipients,
      [:parenting_advice_delivery_id, :email],
      name: "index_pa_delivery_recipients_on_delivery_and_email"
  end
end
