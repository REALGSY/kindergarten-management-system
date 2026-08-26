require "date"
require "uri"

module ParentingAdvice
  module WhitelistContent
    module SourceRegistry
      Source = Struct.new(:name, :entry_url, :hosts, :seed_items, keyword_init: true)

      SOURCES = [
        Source.new(
          name: "UNICEF 中国",
          entry_url: "https://www.unicef.cn/parenting-site",
          hosts: ["unicef.cn"],
          seed_items: [
            {
              title: "联合国儿童基金会亲子指南：各年龄段育儿小贴士",
              date: Date.new(2026, 1, 1),
              url: "https://www.unicef.cn/parenting-site",
              thumbnail: nil,
              topic: "亲子互动",
              age_group: "0-6岁"
            }
          ]
        ),
        Source.new(
          name: "国家卫健委妇幼健康司",
          entry_url: "https://www.nhc.gov.cn/fys/new_index.shtml",
          hosts: ["nhc.gov.cn"],
          seed_items: [
            {
              title: "妇幼健康司：婴幼儿早期发展与营养喂养政策资源",
              date: Date.new(2025, 2, 8),
              url: "https://www.nhc.gov.cn/fys/new_index.shtml",
              thumbnail: nil,
              topic: "早期发展",
              age_group: "0-3岁"
            }
          ]
        ),
        Source.new(
          name: "中国疾控中心",
          entry_url: "https://www.chinacdc.cn/jkkp/",
          hosts: ["chinacdc.cn"],
          seed_items: [
            {
              title: "中国疾控中心健康科普：儿童家庭健康防护资源",
              date: Date.new(2026, 1, 1),
              url: "https://www.chinacdc.cn/jkkp/",
              thumbnail: nil,
              topic: "健康防护",
              age_group: "0-6岁"
            }
          ]
        ),
        Source.new(
          name: "中国营养学会",
          entry_url: "https://www.cnsoc.org/knowledge/",
          hosts: ["cnsoc.org"],
          seed_items: [
            {
              title: "寒假孩子零食怎么选？零食红绿灯来帮忙",
              date: Date.new(2026, 2, 5),
              url: "https://www.cnsoc.org/knowledge/",
              thumbnail: nil,
              topic: "营养喂养",
              age_group: "3-6岁"
            }
          ]
        ),
        Source.new(
          name: "CDC",
          entry_url: "https://www.cdc.gov/child-development/positive-parenting-tips/index.html",
          hosts: ["cdc.gov"],
          seed_items: [
            {
              title: "CDC Positive Parenting Tips: Infants (0-1 years)",
              date: Date.new(2026, 2, 20),
              url: "https://www.cdc.gov/child-development/positive-parenting-tips/infants.html",
              thumbnail: nil,
              topic: "早期发展",
              age_group: "0-1岁"
            },
            {
              title: "CDC Positive Parenting Tips: Toddlers (1-2 years old)",
              date: Date.new(2026, 2, 20),
              url: "https://www.cdc.gov/child-development/positive-parenting-tips/toddlers-1-2-years.html",
              thumbnail: nil,
              topic: "亲子互动",
              age_group: "1-2岁"
            },
            {
              title: "CDC Positive Parenting Tips: Toddlers (2-3 years old)",
              date: Date.new(2026, 1, 29),
              url: "https://www.cdc.gov/child-development/positive-parenting-tips/toddlers-2-3-years.html",
              thumbnail: nil,
              topic: "亲子互动",
              age_group: "2-3岁"
            }
          ]
        )
      ].freeze

      def self.sources
        SOURCES
      end

      def self.whitelisted_url?(url)
        parsed = URI.parse(url.to_s)
        return false unless parsed.is_a?(URI::HTTP)

        host = parsed.host.to_s.downcase
        sources.any? do |source|
          source.hosts.any? { |allowed| host == allowed || host.end_with?(".#{allowed}") }
        end
      rescue URI::InvalidURIError
        false
      end
    end
  end
end
