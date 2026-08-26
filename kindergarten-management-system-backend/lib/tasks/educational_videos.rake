namespace :educational_videos do
  desc "Import categorized child education videos from db/seed_assets/educational_videos"
  task import_child_assets: :environment do
    root = ENV.fetch("CHILD_VIDEO_DIR", EducationalVideoAssetImporter::DEFAULT_ROOT.to_s)
    result = EducationalVideoAssetImporter.new(root: root).import!

    puts "Child educational videos imported: created=#{result.created}, updated=#{result.updated}, skipped=#{result.skipped}"
  end
end
