class EducationalVideoSerializer < ActiveModel::Serializer
  include Rails.application.routes.url_helpers

  attributes :id,
    :title,
    :description,
    :stage,
    :level,
    :subject,
    :min_age,
    :max_age,
    :status,
    :video_url,
    :video_filename,
    :admin_id,
    :admin_name,
    :created_at,
    :updated_at

  def video_url
    return unless object.video_file.attached?

    rails_blob_path(object.video_file, only_path: true)
  end

  def video_filename
    return unless object.video_file.attached?

    object.video_file.filename.to_s
  end

  def admin_name
    return unless object.admin

    [object.admin.first_name, object.admin.last_name].filter_map(&:presence).join(" ")
  end
end
