(function($, window, document, undefined) {
	
	"use strict";
		
	// Use the crypto library.
	var crypto = require ( 'crypto' );

	// Create the http server and listen on port.
	var express = require ( 'express' );
	var server = express ();

	// Create the socket server on the port 1337.
	var io = require ( 'socket.io' ).listen ( server.listen ( 1337, function() {
	
		// 1337 is badass.
		console.log ( (new Date ()) + " Server is listening on port 1337" );
	
		// Setup authroization.
		io.set ( 'authorization', function(handshakeData, accept) {
		
			// Check that all the necessary data has been passed.
			// These will be found in the header of the request
			// to connect to the server.
			if ( !handshakeData.query.channel ) {
				return accept ( 'No channel transmitted.', false ); // No channel id was transmitted.
			}
			if ( !handshakeData.query.username ) {
				return accept ( 'No username transmitted.', false ); // No username was transmitted.
			}
			if ( !handshakeData.query.token ) {
				return accept ( 'No token transmitted.', false ); // No token was transmitted.
			}
		
			// Generate a SHA1 object and ready it with a concatenation
			// of the channel and the username that was transmitted.
			var shasum = crypto.createHash ( 'sha1' );
			shasum.update ( handshakeData.query.channel + handshakeData.query.username );
		
			// Digest the SHA1 hash.
			var authToken = shasum.digest ( 'hex' );
		
			// If the tokens do not match then there has been
			// an attempted security breach and the user must
			// be punished by not being allowed to use our
			// lovely service.
			if ( handshakeData.query.token !== authToken ) {
				return accept ( 'Invalid request.', false );
			}
		
			// All went well and the user is allowed to connect.
			accept ( null, true );
		
		} );
	
	} ) );

	// This callback function is called every time a socket
	// tries to connect to the server
	io.sockets.on ( 'connection', function(socket) {
	
		console.log ( (new Date ()) + ' Connection established.' );
		
		// When a user send an SDP message
		// broadcast to all users in the room
		socket.on ( 'message', function(message) {
	
			switch ( message.type ) {
		
				// This is a special message.
				case 'special':
					console.log ( (new Date ()) + ' You special boy' );
					break;
				default:
					console.log ( (new Date ()) + ' Received Message, broadcasting: ' + message );
					socket.broadcast.to ( message.channel ).emit ( 'message', message );
					break;
				
			}
		
		} );
	
		// When the user subscribes to a channel.
		socket.on ( 'subscribe', function(message) {
		
			// Create a new room to hold the user. This will
			// be named the same as the sessionid that has
			// been created.
			socket.join ( message.channel );
			socket.broadcast.to ( message.channel ).emit ( 'message', { type: "hello" } );
		
		} );
	
		// When the user unsubscribes from a channel.
		socket.on ( 'unsubscribe', function(message) {
		
			// Leave a room. This will delete the room if
			// we remove the last user in this room.
			socket.leave ( message.channel );
			socket.broadcast.to ( message.channel ).emit ( 'message', { type: "bye" } );
		
		} );
		
		// When the user hangs up.
		socket.on ( 'disconnect', function() {
		
			// close user connection
			console.log ( (new Date ()) + " Peer disconnected." );
		
		} );
	
	} );
	
} )( jQuery, window, document );

// First check that the create method is undefined.
// If this is the case then create a method called 
// create on the Object object which creates a new
// function prototype equal to whatever was passed
// to the create method.
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
