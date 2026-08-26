module ChildApi
  class VideosController < BaseController
    def index
      videos = EducationalVideo
        .published
        .with_attached_video_file
        .order(:subject, :stage, :level, :title)
      videos = videos.where(subject: params[:subject]) if params[:subject].present?

      render json: videos, each_serializer: EducationalVideoSerializer, status: :ok
    end
  end
end
