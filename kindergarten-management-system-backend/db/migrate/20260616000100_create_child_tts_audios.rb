class CreateChildTtsAudios < ActiveRecord::Migration[7.0]
  def change
    create_table :child_tts_audios do |t|
      t.references :child_chat_message, foreign_key: true, index: true
      t.string :cache_key, null: false
      t.string :provider, null: false, default: "tencent_cloud"
      t.integer :voice_type, null: false
      t.string :codec, null: false
      t.integer :sample_rate, null: false
      t.string :text_digest, null: false
      t.text :clean_text, null: false
      t.text :audio_segments, null: false
      t.integer :audio_bytes

      t.timestamps
    end

    add_index :child_tts_audios, :cache_key, unique: true
    add_index :child_tts_audios, [:provider, :voice_type, :codec, :sample_rate, :text_digest],
      name: "index_child_tts_audios_on_voice_and_text"
  end
end
