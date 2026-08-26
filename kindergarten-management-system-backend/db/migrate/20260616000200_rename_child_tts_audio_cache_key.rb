class RenameChildTtsAudioCacheKey < ActiveRecord::Migration[7.0]
  def change
    rename_column :child_tts_audios, :cache_key, :audio_cache_key
  end
end
