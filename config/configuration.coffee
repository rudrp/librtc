# Default configuration manager
# Inject app and express reference
module.exports = (app, express, env) ->
    
    # Development
    if env is "development"
        require("./development") app, express

    # Production
    if env is "production"
        require("./production") app, express
        
    # Test
    if env is "test"
        require("./test") app, express
    
    # Global configuration
    config =
        "siteName" : "conpherence"
        "sessionSecret" : "2CB53FB6790EA02F310101A3C5D39A6FDFF6678E87694DAC025B369F06A99003"
        "uri" : "http://conpherence.herokuapp.com"
        "port" : process.env.PORT or 3000
        "debug" : 0
        "profile" : 0
