module ParentingAdvice
  class ContentSource
    def self.content_for(schedule, delivery: nil)
      case schedule.source_type
      when ParentingAdviceSchedule::CUSTOM_SOURCE
        { title: schedule.title, body: schedule.body, content_items: [], ai_analysis: nil, ai_prompt_snapshot: nil }
      when ParentingAdviceSchedule::WHITELIST_SOURCE
        raise ArgumentError, "Delivery is required for whitelist parenting advice content" unless delivery

        ParentingAdvice::WhitelistContent::Composer.new(schedule: schedule, delivery: delivery).call
      else
        raise ArgumentError, "Unsupported parenting advice source: #{schedule.source_type}"
      end
    end
  end
end
