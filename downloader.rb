require 'pry'
require 'thread'
require 'nokogiri'
require "open-uri"

module Harvestman
  module Crawler
    # Raised when given crawler type is not registered.
    class UnknownCrawler < ArgumentError; end

    def self.register(type, klass)
      @crawlers ||= {}
      @crawlers[type] = klass
    end

    def self.new(base_url, pages, type)
      if crawler = @crawlers[type]
        crawler.new(base_url, pages)
      else
        raise UnknownCrawler, "No such type: #{type}"
      end
    end

    class Base
      def initialize(base_url, pages)
        @base_url = base_url
        @pages = pages
      end

      protected

      def crawl_url(url, &block)
        parser = Parser.new(url)
        parser.instance_eval(&block)
      end
    end

    class Fast < Base
      def crawl(&block)
        if @pages.nil?
          crawl_url(@base_url, &block)
        else
          # started_at = Time.now
          urls = @pages.map { |p| @base_url.gsub('*', p.to_s) }
          work_q = Queue.new
          urls.each { |url| work_q << url }
          workers = (0...5).map do
            Thread.new do
              begin
                while url = work_q.pop(true)
                  begin
                    crawl_url(url, &block)
                  rescue => e
                    puts "[!] Error in URL: #{url}"
                    puts e.inspect
                  end
                end
              rescue ThreadError
              end
            end
          end
          workers.map(&:join)

          # threads = []
          # @pages.each do |p|
          #   threads << Thread.new(p) { |page| crawl_url(@base_url.gsub('*', p.to_s), &block) }
          # end
          # threads.each { |t| t.join }
        end
      end
    end

    register :fast, Fast

    class Plain < Base
      def crawl(&block)
        if @pages.nil?
          crawl_url(@base_url, &block)
        else
          @pages.each do |p|
            crawl_url(@base_url.gsub('*', p.to_s), &block)
          end
        end
      end
    end

    register :plain, Plain

    class Parser
      def initialize(url)
        @url = url
        @doc = Nokogiri::HTML(open(url))
      end

      def css(path, &block)
        parse(:css, path, &block)
      end

      def xpath(path, &block)
        parse(:xpath, path, &block)
      end

      def current_uri
        URI.parse(@url)
      end

      private

      def parse(path_type, path, &block)
        if block_given?
          @doc.send(path_type, path).each do |node|
            doc = @doc
            @doc = node
            instance_eval(&block)
            @doc = doc
          end
        else
          @doc.send(path_type, path)
        end
      end
    end
  end

  # Public: Crawl a website. You can visit similar URLs (eg: pages in a search
  # result) by passing an optional argument.
  #
  # url   - A String containing the url to be crawled.
  # pages - Zero or more Strings that will replace a * in the
  #         base url. Note: this does not need to be an Array.
  # type  - Optional. You can use a "plain" or "fast" (default) crawler.
  #         Fast mode uses threads for performance.
  #
  # Example: Crawl Etsy.com, printing the title and price of each item in
  #          pages 1, 2 and 3 of the Electronics category.
  #
  # Harvestman.crawl 'http://www.etsy.com/browse/vintage-category/electronics/*', (1..3) do
  #   css "div.listing-hover" do
  #     title = css "div.title a"
  #     price = css "span.listing-price"
  #
  #     puts "* #{title} (#{price})"
  #   end
  # end
  #
  # Returns nothing.
  def self.crawl(url, pages = nil, type = :fast, &block)
    crawler = Harvestman::Crawler.new(url, pages, type)
    if block_given?
      crawler.crawl(&block)
    end
  end
end

def main(args)
  Harvestman.crawl('https://dumps.wikimedia.org/enwiktionary/') do
    binding.pry
  end
end

main(ARGV)
