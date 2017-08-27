require 'sinatra'
require 'pry'

class FilenameSanitizer
  attr_reader :filename

  def initialize(filename)
    @filename = if filename.nil? || filename.empty?
      "unnamed"
    else
      filename
    end
  end

  def sanitize
    # binding.pry
    filename.strip.downcase.gsub(/\W+|\s+/, '-').gsub(/\A\-|\-\Z/, '')
  end
end

get '/' do
  File.read(File.join('public', 'index.html'))
end

post '/blocks' do
  payload = JSON.parse(request.body.read)
  puts "[*] Raw payload: #{payload}"
  filename = FilenameSanitizer.new(payload["filename"]).sanitize.concat("-#{Time.now.to_i}")
  paragraphs = payload["paragraphs"].join("\n")
  path = "/Users/gvieira/Documents/blockd"
  puts "[*] Path: #{path}"
  puts "[*] Filename: #{filename}"
  puts "[*] Paragraphs: #{paragraphs}"
  File.open(path + "/" + filename + ".txt", "w+") { |f| f.puts(paragraphs) }
end

