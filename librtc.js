/*
 * File: librtc.js
 *
 * RPL 1.5 LICENSE AGREEMENT
 *
 * Unless explicitly acquired and licensed from Licensor under another
 * license, the contents of this file are subject to the Reciprocal Public
 * License ("RPL") Version 1.5, or subsequent versions as allowed by the RPL,
 * and You may not copy or use this file in either source code or executable
 * form, except in compliance with the terms and conditions of the RPL.
 * 
 * All software distributed under the RPL is provided strictly on an "AS
 * IS" basis, WITHOUT WARRANTY OF ANY KIND, EITHER EXPRESS OR IMPLIED, AND
 * LICENSOR HEREBY DISCLAIMS ALL SUCH WARRANTIES, INCLUDING WITHOUT
 * LIMITATION, ANY WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR
 * PURPOSE, QUIET ENJOYMENT, OR NON-INFRINGEMENT. See the RPL for specific
 * language governing rights and limitations under the RPL.
 *
 */

(function($, window, document, undefined) {
	
	"use strict";
	
	// This variable holds all of the method neccessary
	// to create a WebRTC call.
	var self = null;
	var methods = {

		alert: function(message) {
			
			// If alerts have been enabled then present it to
			// the user. This is how alerts should be made in
			// this library.
			if ( self.options.alerts ) {
				alert ( message );
			}
			
		},
		
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
			if ( self.options.username === undefined || self.options.token === undefined || self.options.channel === undefined ) {
				throw ( "Missing option error" );
			}
			
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
				if ( sdpLinesIn [ i ].search ( 'm=' ) !== -1 ) {
					sdpLinesOut.push ( "a=crypto:1 AES_CM_128_HMAC_SHA1_80 inline:BAADBAADBAADBAADBAADBAADBAADBAADBAADBAAD" );
				}
		
			}
	
			console.log ( "Exiting ensureCryptoLine." );
	
			sdp = sdpLinesOut.join ( '\r\n' );
			return sdp;
	
		},
		
		// Try out new ice candidate.
		onIceCandidate: function(event) {
			
			// If the event contains a candidate.
			if ( event.candidate ) {
		
				// Log it to the console.
				console.log ( 'Sending candidate.' );
		
				// Send the candidate to the server.
				self.socket.emit ( 'message', {
					type:			'candidate',
					channel:		self.options.channel, 
					sdpMLineIndex:	event.candidate.spdMLineIndex,
					sdpMid:			event.candidate.sdpMid,
					candidate:		event.candidate.candidate
				} );
	
			}

		},

		// When the session is opening.
		onSessionConnecting: function() {
			
			// Log it to the console.
			console.log ( 'Session connecting...' );
	
		},

		// When the session has been opened.
		onSessionSignalStateChange: function() {
			
			var signalState = self.peerconn.signalingState;
			
			// Log it to the console (if the connection is stable).
			if ( signalState === "stable" ) {
				console.log ( 'Session open.' );
			}
	
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
		onRemoveStream: function() {
			
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
	
		},
		
		// When a user disconnects the socket from the server.
		onSocketDisconnect: function() {
			
			// Log it to the console,
			console.log ( 'Channel disconnected.' );
			
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
				self.createPeerConnection ();
				self.createDataChannel ( false, "textChat" );
		
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
				self.createPeerConnection ();
				self.createDataChannel ( true, "textChat" );
				
				// Create an offer to call.
				console.log ( 'Creating offer...' );
				self.peerconn.createOffer ( self.gotDescription, self.createOfferFailed, self.options.mediaConstraints );
		
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
	
			if ( desc.type === "offer" && navigator.mozGetUserMedia ) {
				desc.sdp = self.ensureCryptoLine ( desc.sdp ); // For firefox interoperability.
			}
			
			// Add channel information to the message.
			desc.channel = self.options.channel;
			
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
				console.log ( 'Starting the call.' );
		
				// Log it to the console.
				console.log ( 'Creating a peer...' );
		
				// Create a new RTCPeerConnection object that
				// uses the Google STUN server to locate other
				// users or this service.
				if ( navigator.mozGetUserMedia ) {
			
					self.peerconn = new RTCPeerConnection ( { iceServers: [{ url:self.options.iceServerIP }] }, { optional: [{ RtpDataChannels: true }] } );
					self.options.mediaConstraints.mandatory.MozDontOfferDataChannel = true; // For firefox interoperability.
		
				} else if ( navigator.webkitGetUserMedia ) {
			
					self.peerconn = new RTCPeerConnection ( { iceServers: [{ url:self.options.iceServer }] }, { optional: [{ DtlsSrtpKeyAgreement:true }, { RtpDataChannels: true }] } );
			
				}
		
				// Add the stream to the peer connection.
				self.peerconn.addStream ( self.localStream );
		
				// Setup callbacks.
				self.peerconn.onicecandidate = self.onIceCandidate;
				self.peerconn.onconnecting = self.onSessionConnecting;
				self.peerconn.onsignalingstatechange = self.onSessionSignalStateChange;
				self.peerconn.onaddstream = self.onAddStream;
				self.peerconn.onremovestream = self.onRemoveStream;
		
				// Log success to the console.
				console.log ( 'Created a peer.' );
		
			} catch ( error ) {
		
				// Log error to the console.
				console.log ( 'Failed to create a peer.', error );
		
			}
	
		},
		
		createDataChannel: function(isInitiator, label) {
			
			// Log it to the console.
			console.log ( 'Creating a data channel...' );
			
			// State change
			var onSendChannelStateChange = function() {
				
				var readyState = self.datachannel.readyState;
				console.log ( 'Data channel state is: ' + readyState );
				if (readyState === "open") {
					console.log ( "Data channel opened." );
				} else {
					console.log ( "Data channel closed." );
				}
					
			};
			
			var onChannelError = function(error) {
				
				console.log ( "Data channel error.", error ); 
				
			};
			
			var onMessage = function(message) {
				
				console.log ( "Message received.", message.data );
				alert ( message.data ); 
				
			};
			
			// Do the data channel stuff.
			if ( isInitiator ) {
				
				// Create an RTCDataChannel as an extension to the peer connection.
				self.datachannel = self.peerconn.createDataChannel ( label, { reliable: false } );
				
				// Setup callbacks.
				self.datachannel.onopen = onSendChannelStateChange;
				self.datachannel.onclose = onSendChannelStateChange;
				self.datachannel.onerror = onChannelError;
				self.datachannel.onmessage = onMessage;
				
			} else {
				
				self.peerconn.ondatachannel = function(event) {
					
					self.datachannel = event.channel;
					
					// Setup callbacks.
					self.datachannel.onopen = onSendChannelStateChange;
					self.datachannel.onclose = onSendChannelStateChange;
					self.datachannel.onerror = onChannelError;
					self.datachannel.onmessage = onMessage;	
					
				};
				
			}
			
			// Log success to the console.
			console.log ( 'Created data channel.' );
			
		},
		
		sendData: function() {
			
			self.datachannel.send ( "This is a message" );
			
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
				getUserMedia ( self.options.userMedia, self.success, self.fallback );
	
			} catch ( error ) {
		
				// If the browser does not support User Media, alert
				// the user.
				self.alert ( 'getUserMedia() is not supported in your browser' );
	
			}
	
		},
		
		// This will end the call between two peers.
		endCall: function() {
			
			// Log it to the console.
			console.log ( 'Ending the call.' );
			
			// If there is an active connection to the
			// server then destroy it.
			self.socket = null;
			
			// If an RTCPeerConnection object exists then
			// close the connection and then set the
			// connection variable to null.
			if ( self.peerconn ) {
				self.peerconn.close ();
			}
			self.peerconn = null;
	
		}
		
	};

	// This is called when one wants to create a new WebRTC
	// instance. For each instance of an element this is
	// called on, this method will create a new function
	// prototype (Object.create()) containing all the methods
	// in the methods variable. Then the init method is called
	// on the prototype.
	$.fn.createWebRTC = function(options) {
		
		// for each element this JQuery object references, run
		// the code within. This would only be useful if there
		// were multiple video elements on the screen.
		return this.each ( function() {
			
			// Create a new instance of the methods.
			var webrtc = Object.create ( methods );
			
			// Initialise the object by calling the init method.
			webrtc.init ( options, this );
			
			// Add these methods as extra data to the JQuery element
			// and assign them the key of "webrtc" so they can be
			// retreived.
			$.data ( this, "webrtc", webrtc );
			
		} );
		
	};

	// Default options for WebRTC connections.
	$.fn.createWebRTC.options = {
		
		alerts: false,									// Shall alerts be shown.
		local: "#local",								// The id of the video element for the local feed.
		remote: "#remote",								// The id of the video element for the remote feed.
		signallingServer: "http://localhost:1337/",		// The address of the signalling server.
		iceServerIP: "stun:172.194.78.127:19302",		// The IP address of the STUN server.
		iceServer: "stun:stun.l.google.com:19302",		// The domain name of the STUN server.
		userMedia: { 
			video: true,								// Video should be accessed from the local host.
			audio: true									// Audio should be accessed from the local host.
		},
		mediaConstraints: { 
			mandatory: {
				OfferToReceiveVideo: true,				// The remote host must be able to receive video.
				OfferToReceiveAudio: true				// The remote host must be able to receive audio.
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
		
		"use strict";
		
		// Create the prototype method equal to the
		// object passed above. Then return the
		// prototype.
		function F() {}
		F.prototype = obj;
		return new F ();
		
	};
	
}