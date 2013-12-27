Conpherence.IndexView = Ember.View.extend
    webrtc: null
    
    didInsertElement: ->
        $('#conversation').createWebRTC
            appID: ""
            username: "tomasbasham"
            local: "#local"
            remote: "#remote"
            signallingServer: "http://conpherence.herokuapp.com/"
        
        webrtc = $('#conversation').data 'webrtc'
        
        webrtc.onInitialised = ->
            console.log "Initialised"
        
        webrtc.onInitilisedFailed = ->
            console.log "Initialisation failed"
        
        webrtc.onConnectionLost = ->
            console.log "Lost connection"
        
        webrtc.phone.onIncomingCall = (call) ->
            if window.confirm 'Answer call from: ' + call.getRemoteAddress() + '?'
                call.answer() 
            else 
                call.end()
        
        # webrtc.onLocalMediaStream = (mediaStream) ->
        #     document.getElementById('local').src = window.webkitURL.createObjectURL mediaStream