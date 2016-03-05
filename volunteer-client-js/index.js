console.log( `hello bacon` )

const _ = require( 'lodash' )
const Processes = require( '../lib/processes' )
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
	socket = new WebSocket( `ws://${location.host}`, 'distproc' )
	socket.binaryType = 'arraybuffer'

	LOG( 'Requesting work' )

	socket.onopen = ( e ) => MessageUtils.writeDataWebsocket( {
		type: 'handshake'
	}, socket )

	MessageUtils.handleIncomingMessagesWebsocket( socket, ( message ) => {
		if ( !metadata ) {
			metadata = JSON.parse( message )
			LOG( 'Got metadata' )
			LOG( metadata )
		} else if ( !encodedBuffer ) {
			encodedBuffer = message
			LOG( `Got work buffer of size ${encodedBuffer.length/1e6}mb` )
			_.defer( initiateWork )
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
	LOG( 'Loading process' )
	let chunkId = metadata.chunkId
	let desiredProcess = Processes[ metadata.argv.process ]( metadata.argv.args )

	let mapper = desiredProcess.mapper

	let encode = desiredProcess.encode
	let decode = desiredProcess.decode

	let data = decode( encodedBuffer )

	LOG( 'Starting work' )
	let startTime = Date.now()
	let result = work( data, mapper )

	metadata.time = Date.now() - startTime
	LOG( `Completed in ${metadata.time/1000}s` )
	LOG( 'Encoding result' )

	let encodedResult = encode( result )
	LOG( 'Sending encoded result' )
	LOG( `Encoded size: ${encodedResult.length/1e6}mb` )

	MessageUtils.writeDataWebsocket( metadata, socket )
	MessageUtils.writeDataWebsocket( encodedResult, socket )
}

UI.onButtonClick( requestWork )
