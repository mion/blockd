require 'sinatra'
require 'pry'

def timestamp
    Time.now.to_s.split(' ').first
end

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
  #binding.pry
  payload = JSON.parse(request.body.read)
  filename = FilenameSanitizer.new(payload["filename"]).sanitize.concat("-#{timestamp}")
  html = payload["html"]
  path = "/Users/gvieira/Documents/blockd"
  puts "[*] HTML: #{html}"
  puts "[*] Path: #{path}"
  puts "[*] Original filename: #{payload['filename']}"
  puts "[*] Saved as filename: #{filename}"
  File.open(path + "/" + filename + ".html", "w+") { |f| f.puts(html) }
end

