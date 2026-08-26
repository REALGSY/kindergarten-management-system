require "csv"
require "caxlsx"

class ClassroomImportTemplate
  Result = Struct.new(:data, :filename, :content_type, keyword_init: true)

  def self.build(format)
    case format.to_s.downcase
    when "csv"
      csv_template
    when "xlsx"
      xlsx_template
    else
      raise ClassroomImportService::UnsupportedFormat, "仅支持 xlsx 或 csv 模板"
    end
  end

  def self.csv_template
    body = CSV.generate do |csv|
      csv << ClassroomImportService::HEADERS
    end
    Result.new(
      data: "\uFEFF#{body}",
      filename: "classroom_import_template.csv",
      content_type: "text/csv; charset=utf-8"
    )
  end

  def self.xlsx_template
    package = Axlsx::Package.new
    package.workbook.add_worksheet(name: "班级导入模板") do |sheet|
      sheet.add_row ClassroomImportService::HEADERS
    end

    Result.new(
      data: package.to_stream.read,
      filename: "classroom_import_template.xlsx",
      content_type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    )
  end

  private_class_method :csv_template, :xlsx_template
end
