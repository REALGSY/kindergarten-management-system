class CreateParentingAdviceWhitelistContent < ActiveRecord::Migration[7.0]
  def change
    create_table :parenting_advice_content_items do |t|
      t.string :title, null: false
      t.string :source, null: false
      t.date :date, null: false
      t.string :url, null: false
      t.string :thumbnail
      t.string :topic, null: false
      t.string :age_group, null: false
      t.timestamps
    end
    add_index :parenting_advice_content_items, :url, unique: true
    add_index :parenting_advice_content_items, [:source, :date]
    add_index :parenting_advice_content_items, [:topic, :age_group]

    add_column :parenting_advice_deliveries, :email_subject, :string
    add_column :parenting_advice_deliveries, :email_text_snapshot, :text
    add_column :parenting_advice_deliveries, :email_html_snapshot, :text
    add_column :parenting_advice_deliveries, :ai_analysis, :text
    add_column :parenting_advice_deliveries, :ai_prompt_snapshot, :text

    create_table :parenting_advice_delivery_content_items do |t|
      t.references :parenting_advice_delivery,
        null: false,
        foreign_key: true,
        index: { name: "index_pa_delivery_items_on_delivery_id" }
      t.references :parenting_advice_content_item,
        null: false,
        foreign_key: true,
        index: { name: "index_pa_delivery_items_on_content_item_id" }
      t.integer :position, null: false
      t.string :title, null: false
      t.string :source, null: false
      t.date :date, null: false
      t.string :url, null: false
      t.string :thumbnail
      t.string :topic, null: false
      t.string :age_group, null: false
      t.text :summary, null: false
      t.timestamps
    end
    add_index :parenting_advice_delivery_content_items,
      [:parenting_advice_delivery_id, :position],
      unique: true,
      name: "index_pa_delivery_items_on_delivery_and_position"
    add_index :parenting_advice_delivery_content_items,
      [:parenting_advice_delivery_id, :url],
      unique: true,
      name: "index_pa_delivery_items_on_delivery_and_url"
  end
end
