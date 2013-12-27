# Development configuration manager
# Inject app and express reference
module.exports = (app, express) ->
    
    # Set the logger into development mode.
    app.use express.logger "dev"
    
    # Set the views directory.
    app.set "views", "#{__dirname}/../views"
    
    # Enable asset loading.
    app.use "/assets", express.static "#{__dirname}/../vendor"
    app.use "/assets", express.static "#{__dirname}/../public"
    app.use "/assets", express.static "#{__dirname}/../lib"
    
    # Set uncompressed html output and disable layout templating.
    app.locals
        pretty: true
        layout: false
    
    # Set the error handler.
    app.use express.errorHandler
        dumpExceptions: true
        showStack: true
