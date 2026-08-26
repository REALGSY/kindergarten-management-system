module AdminApi
  class ParentingAdviceSchedulesController < BaseController
    def index
      schedules = ParentingAdviceSchedule
        .visible
        .includes(:schedule_recipients, :deliveries)
        .order(created_at: :desc)
      render json: schedules, each_serializer: ParentingAdviceScheduleSerializer, status: :ok
    end

    def show
      schedule = ParentingAdviceSchedule.visible.find(params[:id])
      render json: schedule, serializer: ParentingAdviceScheduleDetailSerializer, status: :ok
    end

    def create
      recipient_attributes = resolve_recipient_attributes
      if recipient_attributes.empty?
        render json: { errors: ["Select at least one recipient with an email"] }, status: :unprocessable_entity
        return
      end

      schedule = ParentingAdviceSchedule.new(schedule_params)
      schedule.admin = current_admin
      schedule.source_type = params[:source_type].presence || ParentingAdviceSchedule::CUSTOM_SOURCE
      send_immediately = schedule.one_time? && immediate_send_requested?

      begin
        assign_schedule_time_params(schedule, send_immediately: send_immediately)
      rescue ArgumentError => error
        render json: { errors: [error.message] }, status: :unprocessable_entity
        return
      end

      ParentingAdviceSchedule.transaction do
        schedule.save!
        recipient_attributes.each { |attributes| schedule.schedule_recipients.create!(attributes) }
      end

      ParentingAdvice::ScheduleRunner.run(schedule, now: Time.current) if send_immediately
      schedule.reload
      render json: schedule, serializer: ParentingAdviceScheduleDetailSerializer, status: :created
    end

    def pause
      schedule = ParentingAdviceSchedule.visible.find(params[:id])
      schedule.pause!
      render json: schedule, serializer: ParentingAdviceScheduleSerializer, status: :ok
    end

    def resume
      schedule = ParentingAdviceSchedule.visible.find(params[:id])
      unless schedule.resume!
        render json: { errors: schedule.errors.full_messages }, status: :unprocessable_entity
        return
      end

      render json: schedule, serializer: ParentingAdviceScheduleSerializer, status: :ok
    end

    def destroy
      ParentingAdviceSchedule.visible.find(params[:id]).mark_deleted!
      head :no_content
    end

    private

    def schedule_params
      params.permit(:title, :body, :source_type, :recurrence, :scheduled_at, :send_time, :weekday)
    end

    def assign_schedule_time_params(schedule, send_immediately: false)
      if schedule.one_time?
        if send_immediately
          run_at = Time.current
          schedule.immediate_send = true
          schedule.scheduled_at = run_at
          schedule.next_run_at = run_at
        else
          schedule.scheduled_at = parse_beijing_datetime(params[:scheduled_at])
        end
        schedule.send_time = nil
        schedule.weekday = nil
      elsif schedule.daily?
        schedule.scheduled_at = nil
        schedule.weekday = nil
      elsif schedule.weekly?
        schedule.scheduled_at = nil
      end

      schedule.next_run_at = schedule.calculate_next_run_at(after: Time.current) if schedule.recurrence.present?
    end

    def immediate_send_requested?
      ActiveModel::Type::Boolean.new.cast(params[:immediate_send])
    end

    def parse_beijing_datetime(value)
      raise ArgumentError, "scheduled_at can't be blank" if value.blank?

      parsed = ParentingAdviceSchedule.beijing_zone.parse(value.to_s)
      raise ArgumentError, "scheduled_at is invalid" unless parsed

      parsed
    end

    def parent_attributes
      parent_ids = Array(params[:parent_ids]).reject(&:blank?)
      Parent.where(id: parent_ids).where.not(email: [nil, ""]).map do |parent|
        {
          recipient_type: ParentingAdviceScheduleRecipient::PARENT,
          recipient_id: parent.id,
          name: [parent.first_name, parent.last_name].compact.join(" ").presence || "Parent ##{parent.id}",
          email: parent.email
        }
      end
    end

    def external_recipient_attributes
      recipient_ids = Array(params[:external_email_recipient_ids]).reject(&:blank?)
      ExternalEmailRecipient.active.where(id: recipient_ids).map do |recipient|
        {
          recipient_type: ParentingAdviceScheduleRecipient::EXTERNAL,
          recipient_id: recipient.id,
          name: recipient.name,
          email: recipient.email
        }
      end
    end

    def resolve_recipient_attributes
      seen = {}
      (parent_attributes + external_recipient_attributes).filter_map do |attributes|
        normalized_email = attributes[:email].to_s.strip.downcase
        next if normalized_email.blank? || seen[normalized_email]

        seen[normalized_email] = true
        attributes.merge(email: normalized_email)
      end
    end
  end
end
