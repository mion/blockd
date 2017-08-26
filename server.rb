require 'sinatra'

get '/' do
  File.read(File.join('public', 'index.html'))
end

post '/blocks' do
  payload = JSON.parse(request.body.read)
  puts payload["filename"]
  puts payload["paragraphs"]
  path = "/Users/gvieira/Documents/blockd"
  payload["filename"] = "unnamed" if payload["filename"] == ''
  fname = payload["filename"].sub(" ", "-") + "-#{Time.now.to_i}"
  File.open(path + "/" + fname + ".txt", "w+") { |f| f.puts(payload["paragraphs"].join("\n")) }
end
