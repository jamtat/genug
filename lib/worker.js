'use strict'

const MessageUtils = require( './messageutils' )
const Processes = require( './processes' )


let initiateWork = ( metadata, encodedBuffer ) => {
	let chunkId = metadata.chunkId
	let desiredProcess = Processes[ metadata.argv.process ]( metadata.argv.args )

	let mapper = desiredProcess.mapper

	let encode = desiredProcess.encode
	let decode = desiredProcess.decode

	let data = decode( encodedBuffer )

	let startTime = Date.now()
	let result = mapper( data )

	metadata.time = Date.now() - startTime

	let encodedResult = encode( result )

	MessageUtils.writeData( metadata, process.stdout )
	MessageUtils.writeData( encodedResult, process.stdout )
}

let m = null
let e = null

MessageUtils.handleIncomingMessages( process.stdin, ( message ) => {
	if ( !m ) {
		m = JSON.parse( message )
	} else if ( !e ) {
		e = message
		initiateWork( m, e )
	}
} )
