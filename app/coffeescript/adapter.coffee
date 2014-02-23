Ember.WebSocketAdapter = DS.Adapter.extend
    socket: undefined
    host: "localhost"
    handlers: {}
    
    ###
    # Initialisation method to create the socket.io connection and
    # save it on this object. The apply method is used within the
    # callbacks on the socket.io handlers to correctly define the
    # context needed to be sent to the instace methods.
    ###
    init: ->
        server = io.connect @get 'host'
        server.on 'connect', => @connect.apply this, arguments
        server.on 'error', => @error.apply this, arguments
        server.on 'disconnect', => @disconnect.apply this, arguments
        server.on 'message', => @message.apply this, arguments
        @set 'socket', server
    
    ###
    # Create a promsise object that will be resolved upon a successful
    # or failed attempt to retrieve data from the WebSocket server.
    #
    # @param type the model type wanting to be resolved.
    # @param hash optional arguments to be sent with the type.
    ###
    send: (type, hash) ->
        uuid = @_generateUUID()
        type = @_pathForType type.toString()
        
        new Ember.RSVP.Promise (resolve, reject) =>
            success = (json) ->
                Ember.run null, resolve, json
            error = (json) ->
                Ember.run null, reject, json
            handler = { success: success, error: error }
            @handlers[uuid] = handler
            
            payload = { uuid: uuid, type: type, params: hash, version: @version || 1 }
            @socket.emit 'find', payload
    
    ###
    # Called when the socket.io connection is successfully made.
    #
    # @param event the event detailing the connection.
    ###
    connect: (event) ->
        console.log "Socket opened."
    
    ###
    # Called when an error occurs on the connection.
    #
    # @param error the error object.
    ###
    error: (error) ->
        console.log "Socket error: #{error}"
    
    ###
    # Called when the client disconnects from the server.
    #
    # @param event the event detailing the disconnection.
    ###
    disconnect: (event) ->
        console.log "Socket disconnected."
    
    ###
    # Called when a message is received from the server.
    #
    # @param event the event detailing the message.
    ###
    message: (event) ->
        @handlers[event.uuid].success event[event.type]
        delete @handlers[event.uuid]
    
    createRecord: (store, type, record) ->
        # do something
    
    updateRecord: (store, type, record) ->
        # do domething
    
    deleteRecord: (store, type, record) ->
        # do something
    
    find: (store, type, id) ->
        @send type.typeKey, {id: id}
    
    findMany: (store, type, ids) ->
        @send type.typeKey, {ids: ids}
    
    findQuery: (store, type, query) ->
        @send type.typeKey, {query: query}
    
    findAll: (store, type) ->
        @send type.typeKey
    
    ###
    # Finds the plural name of the model wishing to be resolved.
    #
    # @param type the model wishing to be resolved.
    ###
    _pathForType: (type) ->
        camelized = Ember.String.camelize type
        Ember.String.pluralize camelized
    
    ###
    # Generates a universally unique identifier for each promise. This is
    # used to lookup handlers when a message is returned from the server in
    # order to call the success method and then remove it from the handlers
    # object.
    ###
    _generateUUID: ->
        date = new Date().getTime()
        uuid = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace /[xy]/g, (character) ->
            random = (date + Math.random() * 16) % 16 | 0
            date = Math.floor(date / 16)
            return ((if character is "x" then random else (random & 0x7 | 0x8))).toString 16