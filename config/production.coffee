fs = require "fs"

# Production configuration manager
# Inject app and express reference
module.exports = (app, express) ->
    
    # Set the logger to output to a log file.
    app.use express.logger
        format: "tiny"
        stream: fs.createWriteStream "log/server.log"
    
    # Set the error handler.
    app.use express.errorHandler()
