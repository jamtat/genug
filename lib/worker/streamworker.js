'use strict'

const MessageUtils = require( '../messageutils' )
const Worker = require( './worker' )

class StreamWorker {

	constructor( inputStream, outputStream ) {

		let metadata = null
		let encodedBuffer = null

		MessageUtils.handleIncomingMessages( inputStream, ( message ) => {
			if ( !metadata ) {
				metadata = JSON.parse( message )
			} else if ( !encodedBuffer ) {
				encodedBuffer = message

				let result = Worker.doWork( metadata, encodedBuffer )

				MessageUtils.writeData( result.metadata, outputStream )
				MessageUtils.writeData( result.encodedResult, outputStream )
			}
		} )
	}

}

module.exports = StreamWorker


if ( require.main === module ) {
	new StreamWorker( process.stdin, process.stdout )
}
