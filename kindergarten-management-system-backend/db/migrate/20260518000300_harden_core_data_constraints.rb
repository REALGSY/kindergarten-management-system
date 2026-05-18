class HardenCoreDataConstraints < ActiveRecord::Migration[7.0]
  class AttendanceRecord < ActiveRecord::Base
    self.table_name = "attendances"
  end

  class DisciplineRecord < ActiveRecord::Base
    self.table_name = "disciplines"
  end

  def up
    normalize_date_values(AttendanceRecord)
    normalize_date_values(DisciplineRecord)

    change_column :attendances, :date, :date
    change_column :disciplines, :date, :date

    ensure_no_duplicates :admins, :email
    ensure_no_duplicates :teachers, :email
    ensure_no_duplicates :teachers, :career_name
    ensure_no_duplicates :parents, :phone_number
    ensure_no_duplicates :students, :admission_number
    ensure_no_duplicates :parent_students, [:parent_id, :student_id]
    ensure_no_duplicates :attendances, [:student_id, :date]
    ensure_no_duplicates :classrooms, :teacher_id, ignore_null: true

    add_unique_index :admins, :email
    add_unique_index :teachers, :email
    add_unique_index :teachers, :career_name
    add_unique_index :parents, :phone_number
    add_unique_index :students, :admission_number
    add_unique_index :parent_students, [:parent_id, :student_id]
    add_unique_index :attendances, [:student_id, :date]
    add_unique_index :classrooms, :teacher_id, where: "teacher_id IS NOT NULL"
    add_plain_index :attendances, :classroom_id
    add_plain_index :disciplines, :student_id
    add_plain_index :students, :classroom_id
    add_plain_index :parent_students, :student_id

    add_fk :classrooms, :teachers, column: :teacher_id, on_delete: :nullify
    add_fk :students, :classrooms
    add_fk :parent_students, :parents
    add_fk :parent_students, :students
    add_fk :attendances, :classrooms
    add_fk :attendances, :students
    add_fk :disciplines, :students
  end

  def down
    remove_fk :disciplines, :students
    remove_fk :attendances, :students
    remove_fk :attendances, :classrooms
    remove_fk :parent_students, :students
    remove_fk :parent_students, :parents
    remove_fk :students, :classrooms
    remove_fk :classrooms, :teachers

    remove_index_if_exists :classrooms, :teacher_id
    remove_index_if_exists :attendances, [:student_id, :date]
    remove_index_if_exists :parent_students, [:parent_id, :student_id]
    remove_index_if_exists :parent_students, :student_id
    remove_index_if_exists :students, :admission_number
    remove_index_if_exists :students, :classroom_id
    remove_index_if_exists :disciplines, :student_id
    remove_index_if_exists :attendances, :classroom_id
    remove_index_if_exists :parents, :phone_number
    remove_index_if_exists :teachers, :career_name
    remove_index_if_exists :teachers, :email
    remove_index_if_exists :admins, :email

    change_column :disciplines, :date, :string
    change_column :attendances, :date, :string
  end

  private

  def normalize_date_values(model)
    model.reset_column_information
    model.find_each do |record|
      parsed = parse_date(record.date, model.table_name, record.id)
      record.update_columns(date: parsed.iso8601)
    end
  end

  def parse_date(value, table_name, id)
    string_value = value.to_s.strip
    return Date.iso8601(string_value) if string_value.match?(/\A\d{4}-\d{2}-\d{2}\z/)

    Date.strptime(string_value, "%m/%d/%Y")
  rescue ArgumentError
    raise ActiveRecord::IrreversibleMigration, "#{table_name}##{id} has an invalid date: #{value.inspect}"
  end

  def add_unique_index(table, columns, **options)
    add_index(table, columns, **{ unique: true }.merge(options)) unless index_exists?(table, columns, unique: true, **options)
  end

  def add_plain_index(table, columns)
    add_index(table, columns) unless index_exists?(table, columns)
  end

  def ensure_no_duplicates(table, columns, ignore_null: false)
    column_names = Array(columns).map(&:to_s)
    quoted_columns = column_names.map { |column| quote_column_name(column) }
    null_filter = ignore_null ? "WHERE #{quoted_columns.first} IS NOT NULL" : ""
    rows = select_all(<<~SQL.squish)
      SELECT #{quoted_columns.join(", ")}, COUNT(*) AS duplicate_count
      FROM #{quote_table_name(table)}
      #{null_filter}
      GROUP BY #{quoted_columns.join(", ")}
      HAVING COUNT(*) > 1
    SQL

    return if rows.empty?

    raise ActiveRecord::IrreversibleMigration, "#{table} has duplicate values for #{column_names.join(', ')}"
  end

  def remove_index_if_exists(table, columns)
    remove_index(table, column: columns) if index_exists?(table, columns)
  end

  def add_fk(from_table, to_table, **options)
    exists_options = options.slice(:column)
    add_foreign_key(from_table, to_table, **options) unless foreign_key_exists?(from_table, to_table, **exists_options)
  end

  def remove_fk(from_table, to_table)
    remove_foreign_key(from_table, to_table) if foreign_key_exists?(from_table, to_table)
  end
end
