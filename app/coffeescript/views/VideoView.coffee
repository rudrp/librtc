Conpherence.VideoView = Ember.View.extend
    templateName: "video"
    
    didInsertElement: ->
        # $('#conversation').createWebRTC
        #     appID: ""
        #     username: "tomasbasham"
        #     local: "#local"
        #     remote: "#remote"
        #     signallingServer: "localhost:9000"
        
        #Conpherence.WebRTC = $('#conversation').data 'webrtc'
        
        #Conpherence.WebRTC.onInitialised = ->
        #    console.log "Initialised"
        
        #Conpherence.WebRTC.onInitilisedFailed = ->
        #    console.log "Initialisation failed"
        
        #Conpherence.WebRTC.onConnectionLost = ->
        #    console.log "Lost connection"
        
        #Conpherence.WebRTC.phone.onIncomingCall = (call) ->
        #    if window.confirm 'Answer call from: ' + call.getRemoteAddress() + '?'
        #        call.answer()
        #    else
        #        call.end()
        
        # Conpherence.WebRTC.onLocalMediaStream = (mediaStream) ->
        #     document.getElementById('local').src = window.webkitURL.createObjectURL mediaStream