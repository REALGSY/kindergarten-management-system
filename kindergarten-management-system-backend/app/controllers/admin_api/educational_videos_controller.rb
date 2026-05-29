module AdminApi
  class EducationalVideosController < BaseController
    def index
      videos = EducationalVideo.with_attached_video_file.includes(:admin).order(created_at: :desc)
      render json: videos, each_serializer: EducationalVideoSerializer, status: :ok
    end

    def show
      render json: EducationalVideo.find(params[:id]), serializer: EducationalVideoSerializer, status: :ok
    end

    def create
      unless params[:video_file].present?
        render json: { errors: ["Video file is required"] }, status: :unprocessable_entity
        return
      end

      video = EducationalVideo.new(video_attributes.merge(admin: current_admin))
      video.video_file.attach(params[:video_file])
      video.save!
      render json: video, serializer: EducationalVideoSerializer, status: :created
    end

    def update
      video = EducationalVideo.find(params[:id])
      video.assign_attributes(video_attributes)
      video.video_file.attach(params[:video_file]) if params[:video_file].present?
      video.save!
      render json: video, serializer: EducationalVideoSerializer, status: :ok
    end

    def destroy
      EducationalVideo.find(params[:id]).destroy!
      head :no_content
    end

    private

    def video_attributes
      permitted = params.permit(:title, :description, :stage, :level, :subject, :min_age, :max_age, :status)
      permitted[:status] = EducationalVideo::DRAFT if permitted[:status].blank?
      permitted
    end
  end
end
