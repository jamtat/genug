'use strict';

const MessageUtils = require( './messageutils' )
const Processes = require( './processes' )

let work = ( data, mapper ) => {
	return mapper( data )
}

let metadata
let encodedBuffer


let initiateWork = () => {
	let chunkId = metadata.chunkId
	let desiredProcess = Processes[ metadata.argv.process ]( metadata.argv.args )

	let mapper = desiredProcess.mapper

	let encode = desiredProcess.encode
	let decode = desiredProcess.decode

	let data = decode( encodedBuffer )

	let startTime = Date.now()
	let result = work( data, mapper )

	metadata.time = Date.now() - startTime

	let encodedResult = encode( result )

	MessageUtils.writeData( metadata, process.stdout )
	MessageUtils.writeData( encodedResult, process.stdout )
}

MessageUtils.handleIncomingMessages( process.stdin, ( message ) => {
	if ( !metadata ) {
		metadata = JSON.parse( message )
	} else if ( !encodedBuffer ) {
		encodedBuffer = message
		initiateWork()
	}
} )
