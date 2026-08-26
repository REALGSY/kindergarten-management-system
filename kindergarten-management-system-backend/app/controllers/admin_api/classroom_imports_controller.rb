module AdminApi
  class ClassroomImportsController < BaseController
    def template
      template = ClassroomImportTemplate.build(params[:format].presence || "xlsx")
      send_data template.data,
        filename: template.filename,
        type: template.content_type,
        disposition: "attachment"
    rescue ClassroomImportService::UnsupportedFormat => e
      render json: { errors: [e.message] }, status: :unprocessable_entity
    end

    def preview
      unless import_file.present?
        render json: { errors: ["请选择要导入的文件"] }, status: :unprocessable_entity
        return
      end

      render json: ClassroomImportService.new(import_file).preview, status: :ok
    end

    def create
      unless import_file.present?
        render json: { errors: ["请选择要导入的文件"] }, status: :unprocessable_entity
        return
      end

      result = ClassroomImportService.new(import_file).import!
      render json: result, status: result[:valid] ? :created : :unprocessable_entity
    end

    private

    def import_file
      params[:file]
    end
  end
end
