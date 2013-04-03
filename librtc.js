"use strict";

(function($, window, document, undefined) {
	
	// This variable holds all of the method neccessary
	// to create a WebRTC call.
	var self = null;
	var methods = {

		// This is the first method to be called. It takes
		// a set of options (JSON formatted) and the element
		// that the WebRTC stuff should go in. This will often
		// just be a div element.
		init: function(options, elem) {
			
			// Keep a reference to this object. This is used
			// within callbacks that do not have reference to
			// this object.
			self = this;
			
			// Keep track of the element that will house both 
			// video elments.
			self.elem = elem;

			// Expand the options and put them as variables of
			// self. This is purely for convenience and sake of
			// encapsulation.
			self.options = $.extend ( {}, $.fn.createWebRTC.options, options );
			
			// Check that mandatory options have been supplied.
			if ( self.options.username === undefined || self.options.token === undefined || self.options.channel === undefined )
				throw ( "Missing option error" );
			
			// Get the elements asocaited with the local and
			// remote video. These will be found within the
			// element that this method has been passed.
			self.localVideo = self.elem.querySelector ( self.options.local );
			self.remoteVideo = self.elem.querySelector ( self.options.remote );
			
			// Initialize the socket and peerconnection variables.
			// These are used to keep record of server and P2P
			// connection objects.
		    self.socket = null;
		    self.peerconn = null;
			
			// Initiate the request to use media devices attached 
			// to the user's PC.
		    self.getUserMedia ();
			
			// Log to the console that the process has begun.
		    console.log ( "Initializing" );

		},
		
		// Add an a=crypto line for SDP emitted by Firefox.
		// This is backwards compatibility for Firefox->Chrome calls because
		// Chrome will not accept a=crypto-less offers and Firefox only
		// does DTLS-SRTP.
		ensureCryptoLine: function(sdp) {
	
			console.log ( "Entered ensureCryptoLine." );
	
			var sdpLinesIn = sdp.split ( '\r\n' );
			var sdpLinesOut = [];
	
			// Search for m line.
			for ( var i = 0; i < sdpLinesIn.length; i++ ) {
		
				sdpLinesOut.push ( sdpLinesIn [ i ] );
				if ( sdpLinesIn [ i ].search ( 'm=' ) !== -1 )
					sdpLinesOut.push ( "a=crypto:1 AES_CM_128_HMAC_SHA1_80 inline:BAADBAADBAADBAADBAADBAADBAADBAADBAADBAAD" );
		
			}
	
			console.log ( "Exiting ensureCryptoLine." );
	
			sdp = sdpLinesOut.join ( '\r\n' );
			return sdp;
	
		},
		
		// Try out new ice candidate.
		onIceCandidate: function(message) {
			
			// If the event contains a candidate.
			if ( message.candidate ) {
		
				// Log it to the console.
				console.log ( 'Sending candidate.' );
		
				// Send the candidate to the server.
				self.socket.emit ( 'message', {
					type:			'candidate',
					sdpMLineIndex:	message.candidate.spdMLineIndex,
					sdpMid:			message.candidate.sdpMid,
					candidate:		message.candidate.candidate
				} );
	
			}

		},

		// When the session is opening.
		onSessionConnecting: function(message) {
	
			// Log it to the console.
			console.log ( 'Session connecting...' );
	
		},

		// When the session has been opened.
		onSessionOpen :function(message) {
	
			// Log it to the console.
			console.log ( 'Session open.' );
	
		},

		// Wire up the video stream once we get it.
		onAddStream: function(event) {
			
			// Log it to the console.
			console.log ( 'Remote stream added.' );
	
			// Set the remote video feed to the stream
			// coming in from the peer.
			attachMediaStream ( self.remoteVideo, event.stream );
	
		},

		// Destroy the video stream once we remove it.
		onRemoveStream: function(event) {
			
			// Log it to the console.
			console.log ( 'Remote stream removed.' );
	
			// Set the remote video feed to null.
			attachMediaStream ( self.remoteVideo, "" );
	
		},

		// When the socket is connected to the server.
		onSocketConnect: function() {
			
			// Log it to the console.
			console.log ( 'Channel opened.' );
			
			// Subscribe to a channel.
			self.socket.emit ( 'subscribe', { channel: self.options.channel } );
			
		},

		// When an error occurs on the socket.
		onSocketError: function(error) {
			
			// Log it to the console.
			console.log ( 'Channel error.', error );
	
			// End the call, which destroys and resets all
			// objects.
			self.endCall ();
	
		},
		
		// When a user disconnects the socket from the server.
		onSocketDisconnect: function() {
			
			// Log it to the console,
			console.log ( 'Channel disconnected.' );
			
			// End the call, which destroys and resets all
			// objects.
			self.endCall ();
			
		},

		// Handle messages received from the server.
		onMessage: function(message) {
			
			// Log it to the console.
			console.log ( 'Message received.' );
	
			if ( message.type === 'offer' ) {
		
				// An offer has been made to connect to anothers
				// remote stream.
				console.log ( "Received offer..." );
		
				// Create the P2P connection.
				self.createPeerConnection();
		
				// Set the rempte stream description, resulting in
				// displaying the remote stream.
				console.log ( 'Creating remote session description...' );
				self.peerconn.setRemoteDescription ( new RTCSessionDescription ( message ) );
		
				// Create an answer to the remote stream poster.
				console.log ( 'Sending answer...' );
				self.peerconn.createAnswer ( self.gotDescription, self.createAnswerFailed, self.options.mediaConstraints );
		
			} else if ( message.type === 'answer' ) {
		
				// An aswer to an offer has been received.
				console.log ( 'Received answer...' );
				console.log ( 'Setting remote session description...' );
		
				// Set the rempte stream description, resulting in
				// displaying the remote stream.
				self.peerconn.setRemoteDescription ( new RTCSessionDescription ( message ) );
		
			} else if ( message.type === 'candidate' ) {
		
				// An ICE candidate has been revceived.
				console.log ( "Received offer..." );
		
				// Create a new ICE candidate.
				var candidate = new RTCIceCandidate ( {sdpMLineIndex: message.sdpMLineIndex, sdpMid: message.sdpMid, candidate: message.candidate} );
				console.log ( candidate );
		
				// Add the candidate to the list of candidates.
				self.peerconn.addIceCandidate ( candidate );
		
			} else if ( message.type === 'hello' ) {
		
				// Begin the call as this message being received
				// indicates that another user has joined the
				// channel.
				console.log ( "Received hello" );
				self.startCall ();
		
			} else if ( message.type === 'bye' ) {
		
				// A bye message has been received, end the call.
				console.log ( "Received bye" );
				self.endCall ();
		
			}
	
		},

		// Call back for when an offer or answer is created.
		gotDescription: function(desc) {
			
			// Log it to the console.
			console.log ( 'Got description.' );
	
			if ( desc.type === "offer" && navigator.mozGetUserMedia )
				desc.sdp = self.ensureCryptoLine ( desc.sdp ); // For firefox interoperability.
	
			// Set the local description and send the
			// description to the server.	
			self.peerconn.setLocalDescription ( desc );
			self.socket.emit ( 'message', desc );
	
		},

		// When the offer fails.	
		createOfferFailed: function() {
	
			// Log it to the console.
			console.log ( 'Create offer failed.' );
		
		},

		// When the answer fails.
		createAnswerFailed: function() {
	
			// Log it to the console.
			console.log ( 'Create answer failed.' );
		
		},
		
		// Create a peer connection.
		createPeerConnection: function() {
			
			try {
		
				// Log it to the console.
				console.log ( 'Creating a peer...' );
		
				// Create a new RTCPeerConnection object that
				// uses the Google STUN server to locate other
				// users or this service.
				if ( navigator.mozGetUserMedia ) {
			
					self.peerconn = new RTCPeerConnection ( { iceServers: [{ url:self.options.iceServerIP }] } );
					self.options.mediaConstraints.mandatory['MozDontOfferDataChannel'] = true; // For firefox interoperability.
		
				} else if ( navigator.webkitGetUserMedia ) {
			
					self.peerconn = new RTCPeerConnection ( { iceServers: [{ url:self.options.iceServer }] }, { optional: [{ DtlsSrtpKeyAgreement:true }] } );
			
				}
		
				// Add the stream to the peer connection.
				self.peerconn.addStream ( self.localStream );
		
				// Setup callbacks.
				self.peerconn.onicecandidate = self.onIceCandidate;
				self.peerconn.onconnecting = self.onSessionConnecting;
				self.peerconn.onopen = self.onSessionOpen;
				self.peerconn.onaddstream = self.onAddStream;
				self.peerconn.onremovestream = self.onRemoveStream;
		
				// Log success to the console.
				console.log ( 'Created a peer.' );
		
			} catch ( error ) {
		
				// Log error to the console.
				console.log ( 'Failed to create a peer.', error );
		
			}
	
		},

		// Open up a signalling channel.
		openChannel: function() {
			
			try {
		
				// Log it to the console.
				console.log ( 'Opening channel...' );
				
				// Create a new socket to the server to be
				// used as a signalling channel. This is on
				// port 1337 (because it is badass).
				self.socket = io.connect ( self.options.signallingServer, { 
					query: "channel="+self.options.channel+"&username="+self.options.username+"&token="+self.options.token 
				} );
				
				// Setup callbacks.
				self.socket.on ( 'connect', self.onSocketConnect );
				self.socket.on ( 'error', self.onSocketError );
				self.socket.on ( 'disconnect', self.onSocketDisconnect );
				self.socket.on ( 'message', self.onMessage );
		
			} catch ( error ) {
		
				// Log error to the console.
				console.log ( 'Failed to open channel. ', error );
		
			}
	
		},

		// Start a call between two peers.
		startCall: function() {
			
			// Log it to the console.
			console.log ( 'Starting the call.' );
		
			// Create a peer connection.
			self.createPeerConnection ();
	
			// Create an offer to call.
			console.log ( 'Creating offer...' );
			self.peerconn.createOffer ( self.gotDescription, self.createOfferFailed, self.options.mediaConstraints );
	
		},

		// This will end the call between two peers.
		endCall: function() {
			
			// Log it to the console.
			console.log ( 'Ending the call.' );
	
			// If an RTCPeerConnection object exists then
			// close the connection and then set the
			// connection variable to null.
			if ( self.peerconn )
				self.peerconn.close ();
			self.peerconn = null;
	
		},

		// This is called if User Media is successfully
		// initialised.	
		success: function(stream) {
			
			// Store the stream.
			self.localStream = stream;
			
			// Put the local video stream in the local video
			// element.
			attachMediaStream ( self.localVideo, stream );
			
			// It is now safe to open the channel as all
			// prerequisites have been fulfilled.
			self.openChannel ();
			
		},

		// This is called if User Media is not supported or
		// has failed to initialise.
		fallback: function(error) {
			
			// Log it to the console.
			console.log ( 'Reeeejected!', error );
			
		},
		
		// Requests for the use of the users connected media
		// devices, such as the webcam and microphone.
		getUserMedia: function() {
			
			// Get the window URL. This will be stored under
			// URL attribute of the window object. On WebKit
			// browsers this will be stored under the
			// webkitURL attribute; therefore a loginal or is
			// needed to get the correct value.
			window.URL = window.URL || window.webkitURL || window.mozURL || window.msURL;
	
			// If the browser supports User Media (currently
			// only Chrome and Firefox Nightly), then request
			// to use the video and audio.
			try {
		
				// Request to use the video and audio of the peers
				// machine. Upon success call the success callback,
				// otherwise call the fallback callback.
				getUserMedia ( {video: true, audio: true}, self.success, self.fallback );
	
			} catch ( error ) {
		
				// If the browser does not support User Media, alert
				// the user and revert to a fallback video.
				alert ( 'getUserMedia() is not supported in your browser' );
	
			}
	
		}
		
	};

	// This is called when one wants to create a new WebRTC
	// instance. For each instance of an element this is
	// called on, this method will create a new function
	// prototype (Object.create()) containing all the methods
	// in the methods variable. Then the init method is called
	// on the prototype.
	$.fn.createWebRTC = function(options) {
		
		return this.each ( function() {
			
			var webrtc = Object.create ( methods );
			webrtc.init ( options, this );
			$.data ( this, "webrtc", webrtc );
			
		} );
		
	};

	// Default options for WebRTC connections.
	$.fn.createWebRTC.options = {

		local: "#local",
		remote: "#remote",
		signallingServer: "http://team4:1337/",
		iceServerIP: "stun:172.194.78.127:19302",
		iceServer: "stun:stun.l.google.com:19302",
		mediaConstraints: { 
			mandatory: {
				OfferToReceiveAudio: true, 
				OfferToReceiveVideo: true,
			} 
		}
		
	};

} )( jQuery, window, document );

// First check that the create method is undefined.
// If this is the case then create a method called 
// create on the Object object which creates a new
// function prototype equal to whatever was passed
// to the create method. This will be used to setup
// the methods required to create a WebRTC object.
if ( typeof Object.create !== 'function' ) {
	
	// Implement a create function on Object which
	// takes on argument.
	Object.create = function(obj) {
		
		// Create the prototype method equal to the
		// object passed above. Then return the
		// prototype.
		function F() {};
		F.prototype = obj;
		return new F ();
		
	};
	
}