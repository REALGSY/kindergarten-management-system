require "json"

class EducationalVideoAssetImporter
  DEFAULT_ROOT = Rails.root.join("db", "seed_assets", "educational_videos")
  VIDEO_EXTENSIONS = %w[.mp4 .mov .m4v .webm .avi .mkv].freeze
  STAGE_AGES = {
    "小班" => [3, 3],
    "中班" => [4, 4],
    "大班" => [5, 6]
  }.freeze

  Result = Struct.new(:created, :updated, :skipped, keyword_init: true)

  def self.parse_filename(filename)
    extension = File.extname(filename)
    base_name = File.basename(filename, extension)
    title, stage, level, subject = base_name.split("_", 4)

    unless [title, stage, level, subject].all?(&:present?)
      raise ArgumentError, "Video filename must be 标题_阶段_级别_学科#{extension}: #{filename}"
    end

    {
      filename: filename,
      title: title,
      stage: stage,
      level: level,
      subject: subject
    }
  end

  def initialize(root: DEFAULT_ROOT, admin: Admin.order(:id).first)
    @root = Pathname.new(root.to_s)
    @admin = admin
  end

  def import!
    raise ArgumentError, "Video asset directory does not exist: #{@root}" unless @root.directory?

    metadata = load_source_manifest
    result = Result.new(created: 0, updated: 0, skipped: 0)

    video_paths.each do |path|
      parsed = self.class.parse_filename(path.basename.to_s)
      source = metadata[parsed[:filename]] || {}
      min_age, max_age = STAGE_AGES.fetch(parsed[:stage], [3, 6])

      video = EducationalVideo.find_or_initialize_by(
        title: parsed[:title],
        stage: parsed[:stage],
        level: parsed[:level],
        subject: parsed[:subject]
      )
      was_new = video.new_record?

      video.assign_attributes(
        description: description_for(parsed, source, min_age, max_age),
        min_age: min_age,
        max_age: max_age,
        status: EducationalVideo::PUBLISHED
      )
      video.admin ||= @admin if @admin
      record_changed = video.changed?
      video.save!

      attachment_changed = attach_video_if_needed(video, path)
      if was_new
        result.created += 1
      elsif record_changed || attachment_changed
        result.updated += 1
      else
        result.skipped += 1
      end
    end

    result
  end

  private

  def video_paths
    @video_paths ||= Dir.glob(@root.join("**", "*").to_s)
      .map { |path| Pathname.new(path) }
      .select { |path| path.file? && VIDEO_EXTENSIONS.include?(path.extname.downcase) }
      .sort_by { |path| path.basename.to_s }
  end

  def load_source_manifest
    manifest_path = @root.join("source_manifest.json")
    return {} unless manifest_path.file?

    JSON.parse(manifest_path.open("r:bom|utf-8", &:read)).each_with_object({}) do |item, memo|
      memo[item["文件名"]] = item
    end
  end

  def description_for(parsed, source, min_age, max_age)
    age_text = min_age == max_age ? "#{min_age} 岁" : "#{min_age}-#{max_age} 岁"
    lines = [
      "#{parsed[:stage]}#{parsed[:level]}#{parsed[:subject]}早教视频，适合 #{age_text} 儿童观看。"
    ]

    if source["来源"].present? || source["许可"].present?
      license_text = [source["来源"], source["许可"]].compact_blank.join("，")
      lines << "素材来源：#{license_text}。"
    end

    lines.join("\n")
  end

  def attach_video_if_needed(video, path)
    return false unless attachment_needs_update?(video, path)

    video.video_file.purge if video.video_file.attached?
    File.open(path, "rb") do |file|
      video.video_file.attach(
        io: file,
        filename: path.basename.to_s,
        content_type: content_type_for(path)
      )
    end
    true
  end

  def attachment_needs_update?(video, path)
    return true unless video.video_file.attached?

    blob = video.video_file.blob
    blob.filename.to_s != path.basename.to_s || blob.byte_size != path.size
  end

  def content_type_for(path)
    case path.extname.downcase
    when ".mp4", ".m4v"
      "video/mp4"
    when ".webm"
      "video/webm"
    when ".mov"
      "video/quicktime"
    when ".avi"
      "video/x-msvideo"
    when ".mkv"
      "video/x-matroska"
    else
      "application/octet-stream"
    end
  end
end
