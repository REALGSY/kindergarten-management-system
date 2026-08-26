require "csv"
require "roo"
require "set"

class ClassroomImportService
  class UnsupportedFormat < StandardError; end

  HEADERS = ["班级名称", "教师工号名", "学号", "名", "第二名", "姓", "年龄", "学生描述"].freeze
  REQUIRED_HEADERS = HEADERS.freeze
  REQUIRED_FIELDS = ["班级名称", "教师工号名", "学号", "名", "姓", "年龄"].freeze

  def initialize(uploaded_file)
    @uploaded_file = uploaded_file
  end

  def preview
    rows = read_rows
    build_preview(rows)
  rescue UnsupportedFormat => e
    error_result(e.message)
  rescue CSV::MalformedCSVError => e
    error_result("CSV 文件无法解析：#{e.message}")
  rescue StandardError => e
    error_result("文件无法解析：#{e.message}")
  end

  def import!
    result = preview
    return result unless result[:valid]

    classroom = nil
    ActiveRecord::Base.transaction do
      teacher = Teacher.lock.find(result[:classroom][:teacher_id])

      if Classroom.exists?(name: result[:classroom][:name])
        raise ActiveRecord::Rollback
      end

      if teacher.classroom.present?
        raise ActiveRecord::Rollback
      end

      classroom = Classroom.create!(name: result[:classroom][:name], teacher: teacher)
      result[:students].each do |student|
        Student.create!(
          classroom: classroom,
          first_name: student[:first_name],
          second_name: student[:second_name],
          surname: student[:surname],
          age: student[:age],
          admission_number: student[:admission_number],
          description: student[:description]
        )
      end
    end

    if classroom.nil?
      return preview.merge(valid: false, errors: [{ row: nil, messages: ["导入数据已变化，请重新解析后再导入"] }])
    end

    result.merge(imported: true, classroom: result[:classroom].merge(id: classroom.id))
  rescue ActiveRecord::RecordInvalid => e
    preview.merge(valid: false, errors: [{ row: nil, messages: e.record.errors.full_messages }])
  end

  private

  attr_reader :uploaded_file

  def read_rows
    case extension
    when ".csv"
      read_csv_rows
    when ".xlsx"
      read_xlsx_rows
    else
      raise UnsupportedFormat, "仅支持 .xlsx 和 .csv 文件"
    end
  end

  def read_csv_rows
    table = CSV.read(uploaded_file.path, headers: true, encoding: "bom|utf-8")
    headers = normalize_headers(table.headers || [])
    validate_headers!(headers)

    table.each.with_index(2).filter_map do |csv_row, row_number|
      row = build_row(headers, csv_row.fields, row_number)
      empty_import_row?(row[:values]) ? nil : row
    end
  end

  def read_xlsx_rows
    workbook = Roo::Excelx.new(uploaded_file.path, file_warning: :ignore)
    sheet = workbook.sheet(workbook.sheets.first)
    headers = normalize_headers(sheet.row(1))
    validate_headers!(headers)

    return [] if sheet.last_row.to_i < 2

    (2..sheet.last_row).filter_map do |row_number|
      row = build_row(headers, sheet.row(row_number), row_number)
      empty_import_row?(row[:values]) ? nil : row
    end
  end

  def validate_headers!(headers)
    missing_headers = REQUIRED_HEADERS - headers
    return if missing_headers.empty?

    raise UnsupportedFormat, "模板表头缺失：#{missing_headers.join("、")}"
  end

  def build_row(headers, values, row_number)
    row_values = {}
    headers.each_with_index do |header, index|
      row_values[header] = normalize_cell(values[index]) if HEADERS.include?(header)
    end
    HEADERS.each { |header| row_values[header] ||= "" }
    { row_number: row_number, values: row_values }
  end

  def build_preview(rows)
    errors = []
    add_global_error(errors, "文件中没有学生数据") if rows.empty?

    class_names = unique_values(rows, "班级名称")
    teacher_career_names = unique_values(rows, "教师工号名")

    add_global_error(errors, "每次导入只能包含一个班级名称") if class_names.length > 1
    add_global_error(errors, "每次导入只能包含一个教师工号名") if teacher_career_names.length > 1

    classroom_name = class_names.first
    teacher_career_name = teacher_career_names.first
    teacher = nil

    if classroom_name.present? && Classroom.exists?(name: classroom_name)
      add_global_error(errors, "班级名称已存在：#{classroom_name}")
    end

    if teacher_career_name.present? && teacher_career_names.length == 1
      teacher = Teacher.includes(:classroom).find_by(career_name: teacher_career_name)
      if teacher.nil?
        add_global_error(errors, "教师工号名不存在：#{teacher_career_name}")
      elsif teacher.classroom.present?
        add_global_error(errors, "教师 #{teacher_career_name} 已绑定班级：#{teacher.classroom.name}")
      end
    end

    students = rows.map { |row| normalize_student_row(row, errors) }
    add_duplicate_file_admission_errors(students, errors)
    add_existing_admission_errors(students, errors)

    {
      valid: errors.empty?,
      classroom: {
        name: classroom_name,
        teacher_career_name: teacher_career_name,
        teacher_id: teacher&.id,
        teacher_name: teacher ? [teacher.first_name, teacher.last_name].compact.join(" ") : nil
      },
      students: students,
      errors: errors
    }
  end

  def normalize_student_row(row, errors)
    values = row[:values]
    REQUIRED_FIELDS.each do |field|
      add_row_error(errors, row[:row_number], "#{field}不能为空") if values[field].blank?
    end

    admission_number = parse_integer(values["学号"], allow_zero: true)
    if values["学号"].present? && admission_number.nil?
      add_row_error(errors, row[:row_number], "学号必须是整数")
    end

    age = parse_integer(values["年龄"])
    if values["年龄"].present? && age.nil?
      add_row_error(errors, row[:row_number], "年龄必须是正整数")
    end

    {
      row_number: row[:row_number],
      admission_number: admission_number,
      first_name: values["名"],
      second_name: values["第二名"],
      surname: values["姓"],
      age: age,
      description: values["学生描述"]
    }
  end

  def add_duplicate_file_admission_errors(students, errors)
    grouped = students
      .select { |student| student[:admission_number].present? }
      .group_by { |student| student[:admission_number] }

    grouped.each_value do |duplicates|
      next if duplicates.length < 2

      duplicates.each do |student|
        add_row_error(errors, student[:row_number], "学号在文件中重复")
      end
    end
  end

  def add_existing_admission_errors(students, errors)
    admission_numbers = students.filter_map { |student| student[:admission_number] }.uniq
    return if admission_numbers.empty?

    existing_numbers = Student.where(admission_number: admission_numbers).pluck(:admission_number).to_set
    students.each do |student|
      next unless existing_numbers.include?(student[:admission_number])

      add_row_error(errors, student[:row_number], "学号已存在：#{student[:admission_number]}")
    end
  end

  def unique_values(rows, header)
    rows.map { |row| row[:values][header] }.reject(&:blank?).uniq
  end

  def add_global_error(errors, message)
    errors << { row: nil, messages: [message] }
  end

  def add_row_error(errors, row_number, message)
    errors << { row: row_number, messages: [message] }
  end

  def error_result(message)
    { valid: false, classroom: nil, students: [], errors: [{ row: nil, messages: [message] }] }
  end

  def extension
    File.extname(uploaded_file.original_filename.to_s).downcase
  end

  def normalize_headers(headers)
    headers.map { |header| normalize_cell(header).delete_prefix("\uFEFF") }
  end

  def normalize_cell(value)
    case value
    when nil
      ""
    when Numeric
      value.to_i == value ? value.to_i.to_s : value.to_s.strip
    else
      value.to_s.strip
    end
  end

  def parse_integer(value, allow_zero: false)
    integer_string = value.to_s.strip.sub(/\.0+\z/, "")
    return nil unless integer_string.match?(/\A\d+\z/)

    integer = integer_string.to_i
    return integer if allow_zero ? integer >= 0 : integer.positive?

    nil
  end

  def empty_import_row?(values)
    HEADERS.all? { |header| values[header].blank? }
  end
end
