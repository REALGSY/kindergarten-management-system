module ParentingAdvice
  module WhitelistContent
    class Selector
      ITEM_COUNT = 3
      NEW_CONTENT_WINDOW = 14.days
      RECENT_SEND_WINDOW = 30.days
      CHILD_CONTEXT_KEYWORDS = %w[
        儿童 孩子 宝宝 婴幼儿 幼儿 亲子 育儿 母乳 学龄前 Child Children Infant Toddler Preschool Parenting
      ].freeze

      class NoContentError < StandardError; end

      def initialize(fetcher: Fetcher.new)
        @fetcher = fetcher
      end

      def select
        @fetcher.refresh!

        recent_sent_urls = ParentingAdviceDeliveryContentItem
          .where("created_at >= ?", RECENT_SEND_WINDOW.ago)
          .distinct
          .pluck(:url)

        selected = fresh_unsent(recent_sent_urls).to_a
        selected += evergreen_unsent(recent_sent_urls, selected).to_a if selected.size < ITEM_COUNT
        selected += any_remaining(selected).to_a if selected.size < ITEM_COUNT

        raise NoContentError, "No suitable whitelist parenting content found" if selected.size < ITEM_COUNT

        selected.first(ITEM_COUNT)
      end

      private

      def fresh_unsent(recent_sent_urls)
        eligible_scope
          .where("date >= ?", NEW_CONTENT_WINDOW.ago.to_date)
          .where.not(url: recent_sent_urls)
          .recent_first
          .limit(ITEM_COUNT)
      end

      def evergreen_unsent(recent_sent_urls, selected)
        eligible_scope
          .where.not(id: selected.map(&:id))
          .where.not(url: recent_sent_urls)
          .recent_first
          .limit(ITEM_COUNT - selected.size)
      end

      def any_remaining(selected)
        eligible_scope
          .where.not(id: selected.map(&:id))
          .recent_first
          .limit(ITEM_COUNT - selected.size)
      end

      def eligible_scope
        child_context_condition = CHILD_CONTEXT_KEYWORDS.map { "title LIKE ?" }.join(" OR ")

        ParentingAdviceContentItem
          .where(child_context_condition, *CHILD_CONTEXT_KEYWORDS.map { |keyword| "%#{keyword}%" })
          .where.not("url LIKE ?", "%/pastreview/%")
          .where.not("title LIKE ?", "%全民营养周%")
      end
    end
  end
end
