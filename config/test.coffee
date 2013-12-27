# Test configuration manager
# Inject app and express reference
module.exports = (app, express) ->
    
    # Set the logger into testing mode.
    app.use express.logger "test"