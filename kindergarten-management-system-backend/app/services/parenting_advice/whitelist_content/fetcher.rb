require "date"
require "net/http"
require "nokogiri"
require "uri"

module ParentingAdvice
  module WhitelistContent
    class Fetcher
      USER_AGENT = "KindergartenParentingAdviceBot/1.0 (+https://kindergarten.bjtu.cc)".freeze
      MAX_CANDIDATES_PER_SOURCE = 12

      CHILD_CONTEXT_KEYWORDS = %w[
        儿童 孩子 宝宝 婴幼儿 幼儿 亲子 育儿 母乳 学龄前 child children infant toddler preschool parenting
      ].freeze
      TOPIC_KEYWORDS = %w[
        喂养 营养 疫苗 健康 发育 睡眠 运动 零食 大脑 情绪 安全 保护
        development nutrition vaccine safety
      ].freeze
      EXCLUDED_KEYWORDS = %w[
        招标 招聘 年会 会议 电视电话会议 公示 名单 党建 培训班 更正 声明 辅助生殖 全民营养周
      ].freeze
      EXCLUDED_URL_SEGMENTS = %w[
        /pastreview/
      ].freeze

      def refresh!
        SourceRegistry.sources.flat_map do |source|
          seed_items(source) + fetch_source_items(source)
        end.uniq { |item| item[:url] }.filter_map { |item| persist_item(item) }
      end

      def excerpt_for(url)
        html = fetch_html(url)
        return "" if html.blank?

        document = Nokogiri::HTML(html)
        document.css("script, style, nav, footer, header").remove
        document.css("article, main, body").map(&:text).join(" ")
          .squish
          .truncate(900, omission: "")
      rescue StandardError
        ""
      end

      private

      def seed_items(source)
        source.seed_items.map do |item|
          item.merge(source: source.name)
        end
      end

      def fetch_source_items(source)
        html = fetch_html(source.entry_url)
        return [] if html.blank?

        document = Nokogiri::HTML(html)
        thumbnail = page_thumbnail(document, source.entry_url)

        document.css("a[href]").filter_map do |link|
          title = link.text.squish
          next if title.blank? || title.length < 4

          url = absolute_url(link["href"], source.entry_url)
          next unless source_allowed?(source, url)
          next if excluded_url?(url)
          next unless relevant_title?(title)

          text_context = [title, link.parent&.text].compact.join(" ").squish
          date = extract_date(text_context)
          next unless date

          {
            title: title.truncate(120),
            source: source.name,
            date: date,
            url: url,
            thumbnail: thumbnail,
            topic: classify_topic(text_context),
            age_group: classify_age_group(text_context)
          }
        end.first(MAX_CANDIDATES_PER_SOURCE)
      rescue StandardError => error
        Rails.logger.warn("[ParentingAdvice] whitelist fetch failed for #{source.name}: #{error.message}")
        []
      end

      def persist_item(attributes)
        return unless SourceRegistry.whitelisted_url?(attributes[:url])
        return if attributes.values_at(:title, :source, :date, :url, :topic, :age_group).any?(&:blank?)

        item = ParentingAdviceContentItem.find_or_initialize_by(url: attributes[:url])
        item.assign_attributes(attributes.slice(:title, :source, :date, :thumbnail, :topic, :age_group))
        item.save!
        item
      rescue ActiveRecord::RecordInvalid => error
        Rails.logger.warn("[ParentingAdvice] whitelist item skipped: #{error.record.errors.full_messages.join(', ')}")
        nil
      end

      def fetch_html(url, redirects: 3)
        uri = URI.parse(url)
        request = Net::HTTP::Get.new(uri)
        request["User-Agent"] = USER_AGENT
        request["Accept"] = "text/html,application/xhtml+xml"

        response = Net::HTTP.start(
          uri.hostname,
          uri.port,
          use_ssl: uri.scheme == "https",
          open_timeout: 8,
          read_timeout: 12
        ) { |http| http.request(request) }

        if response.is_a?(Net::HTTPRedirection) && redirects.positive?
          location = URI.join(url, response["location"]).to_s
          return fetch_html(location, redirects: redirects - 1)
        end

        return response.body if response.is_a?(Net::HTTPSuccess) && response["content-type"].to_s.include?("text/html")

        ""
      rescue URI::InvalidURIError, Net::OpenTimeout, Net::ReadTimeout, SocketError, Errno::ECONNREFUSED
        ""
      end

      def source_allowed?(source, url)
        parsed = URI.parse(url.to_s)
        host = parsed.host.to_s.downcase
        source.hosts.any? { |allowed| host == allowed || host.end_with?(".#{allowed}") }
      rescue URI::InvalidURIError
        false
      end

      def relevant_title?(title)
        normalized = title.to_s.downcase
        return false if EXCLUDED_KEYWORDS.any? { |keyword| normalized.include?(keyword.downcase) }
        return false unless CHILD_CONTEXT_KEYWORDS.any? { |keyword| normalized.include?(keyword.downcase) }

        TOPIC_KEYWORDS.any? { |keyword| normalized.include?(keyword.downcase) } ||
          CHILD_CONTEXT_KEYWORDS.any? { |keyword| normalized.include?(keyword.downcase) }
      end

      def absolute_url(value, base_url)
        return "" if value.blank?
        return "" if value.start_with?("javascript:", "mailto:", "#")

        URI.join(base_url, value).to_s
      rescue URI::InvalidURIError
        ""
      end

      def excluded_url?(url)
        EXCLUDED_URL_SEGMENTS.any? { |segment| url.to_s.downcase.include?(segment) }
      end

      def page_thumbnail(document, base_url)
        raw =
          document.at_css('meta[property="og:image"]')&.[]("content").presence ||
          document.at_css("img[src]")&.[]("src")
        url = absolute_url(raw, base_url)
        SourceRegistry.whitelisted_url?(url) ? url : nil
      end

      def extract_date(text)
        normalized = text.to_s
        if (match = normalized.match(/(20\d{2})[-\/.年](\d{1,2})[-\/.月](\d{1,2})/))
          return Date.new(match[1].to_i, match[2].to_i, match[3].to_i)
        end

        if (match = normalized.match(/(?<!\d)(\d{1,2})[-\/.](\d{1,2})(?!\d)/))
          return Date.new(Date.current.year, match[1].to_i, match[2].to_i)
        end

        if (match = normalized.match(/([A-Z][a-z]{2,8})\.?\s+(\d{1,2}),\s+(20\d{2})/))
          return Date.parse("#{match[1]} #{match[2]}, #{match[3]}")
        end

        nil
      rescue ArgumentError
        nil
      end

      def classify_topic(text)
        normalized = text.to_s.downcase
        return "营养喂养" if normalized.match?(/营养|喂养|母乳|牛奶|酸奶|零食|nutrition|breast|feeding|food/)
        return "健康防护" if normalized.match?(/疫苗|疾病|传染|安全|防护|伤害|vaccine|safety|healthy|health/)
        return "亲子互动" if normalized.match?(/亲子|管教|情绪|游戏|陪伴|阅读|parenting|play|discipline/)

        "早期发展"
      end

      def classify_age_group(text)
        normalized = text.to_s.downcase
        return "0-1岁" if normalized.match?(/0\s*[-~至到]\s*1|0\s*岁|婴儿|infant/)
        return "1-2岁" if normalized.match?(/1\s*[-~至到]\s*2|1\s*岁|1\s+year/)
        return "2-3岁" if normalized.match?(/2\s*[-~至到]\s*3|2\s*岁|2\s+year/)
        return "3-6岁" if normalized.match?(/3\s*[-~至到]\s*[56]|3\s*岁|4\s*岁|5\s*岁|6\s*岁|幼儿园|学龄前|preschool/)
        return "6岁以上" if normalized.match?(/青少年|青春期|adolescent|teen/)

        "0-6岁"
      end
    end
  end
end
