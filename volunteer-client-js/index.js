'use strict'

const doWork = require( '../lib/worker/worker' ).doWork
const MessageUtils = require( '../lib/messageutils' )
const UI = require( './client-ui' )
const LOG = UI.log

let work = ( data, mapper ) => {
	return mapper( data )
}

let metadata
let encodedBuffer
let socket

let resetState = () => {
	metadata = null
	encodedBuffer = null
}

let requestWork = () => {
	UI.toggleWorking()
	socket = new WebSocket( `ws://${location.host}`, 'distproc' )

	LOG( 'Requesting work' )

	socket.onopen = ( e ) => MessageUtils.writeDataWebsocket( {
		type: 'handshake'
	}, socket )

	socket.onerror = () => {
		LOG( 'There was an error connecting to the server. Try refreshing or come back later!' )
		UI.displayError()
	}

	MessageUtils.handleIncomingMessagesWebsocket( socket, ( message ) => {
		if ( !metadata ) {
			metadata = JSON.parse( message )
			LOG( 'Got metadata' )
			LOG( metadata )
		} else if ( !encodedBuffer ) {
			encodedBuffer = message
			LOG( `Got work buffer of size ${encodedBuffer.length/1e6}mb` )
			setTimeout( initiateWork, 10 )
		} else {
			confirm = JSON.parse( message )
			console.log( confirm )
			if ( confirm.type === 'confirm' ) {
				LOG( 'Result receipt confirmed' )
				resetState()
				UI.toggleWorking()
			}
		}
	} )
}

let initiateWork = () => {
	LOG( 'Starting work' )
	let result = doWork( metadata, encodedBuffer )
	LOG( `Completed in ${metadata.time/1000}s` )
	LOG( 'Sending encoded result' )
	LOG( `Encoded size: ${result.encodedResult.length/1e6}mb` )

	MessageUtils.writeDataWebsocket( result.metadata, socket )
	MessageUtils.writeDataWebsocket( result.encodedResult, socket )
}

UI.onButtonClick( requestWork )
