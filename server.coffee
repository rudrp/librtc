# Module dependencies.
express   = require 'express'
namespace = require 'express-namespace'
socket    = require 'socket.io'
redis     = require 'redis'
color     = require 'colors'
http      = require 'http'
path      = require 'path'

# Create the express object and set the node environment variable.
app = express()
env = app.settings.env

# Keystore.
if process.env.REDISTOGO_URL
    rtg = require("url").parse process.env.REDISTOGO_URL
    keystore = redis.createClient rtg.port, rtg.hostname

    keystore.auth rtg.auth.split(":")[1]
else
    keystore = redis.createClient();

# Import configuration.
config = require("./config/configuration") app, express, env
ember  = require("./routes/ember")

# All environments
app.configure ->
    # Define view engine with its options.
    app.set "view engine", "jade"
    
    # Sessions.
    app.use express.cookieParser()
    app.use express.session secret: config.sessionSecret
    
    # Parses x-www-form-urlencoded request bodies (and JSON).
    app.use express.urlencoded()
    app.use express.methodOverride()
    app.use express.json()
    
    # Express routing.
    app.use app.router
    
    # Use the favicon middleware.
    app.use express.favicon()
    
    # This is to pass the slugs onto emberjs. Otherwise one has to navigate
    # from index in order to visit any other page. This is not ideal and
    # prevents bookmarking.
    app.use ember.default

# Import routes.
routes = require("./routes") app

# Create the http server.
server = http.createServer(app)

# Have the websocket server listen on the server
io = socket.listen server

# Put the server into listening mode.
server.listen config.port, ->
    console.log "\n\n---------------------------------------------------------"
    console.log "Express server listening on " + "port %d".bold.red + " in " + "%s mode".bold.green, config.port, env

io.sockets.on "connection", (socket) ->
    console.log "#{new Date()} Connection established."
    
    # When a user send an SDP message broadcast to all users 
    # in the room.
    socket.on "message", (message) ->
        console.log "#{new Date()} Received Message, broadcasting: #{message}"
        socket.broadcast.to(message.channel).emit "message", message

    # When the user subscribes to a channel.
    socket.on "subscribe", (message) ->
        # Create a new room to hold the user. This will be
        # named the same as the sessionid that has been created.
        socket.join message.channel
        socket.broadcast.to(message.channel).emit "message", type: "hello"

    # When the user unsubscribes from a channel.
    socket.on "unsubscribe", (message) ->
        # Leave a room. This will delete the room if we remove 
        # the last user in this room.
        socket.leave message.channel
        socket.broadcast.to(message.channel).emit "message", type: "bye"

    # When the user hangs up.
    socket.on "disconnect", ->
        # Close user connection
        console.log "#{new Date()} Peer disconnected."