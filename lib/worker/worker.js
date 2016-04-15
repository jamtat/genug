'use strict'

const Processes = require( '../processes' )

const doWork = ( metadata, encodedBuffer ) => {
	let chunkId = metadata.chunkId

	let desiredProcess

	if ( metadata.processFile ) {
		desiredProcess = require( metadata.processFile )( metadata.processArgs )
	}

	let mapper = desiredProcess.mapper

	let encode = desiredProcess.encode
	let decode = desiredProcess.decode

	let data = decode( encodedBuffer )

	let startTime = Date.now()
	let result = mapper( data )

	metadata.time = Date.now() - startTime

	let encodedResult = encode( result )

	return {
		metadata,
		encodedResult
	}
}

class Worker {
	constructor() {

	}

	work( metadata, encodedBuffer, callback ) {
		let result = doWork( metadata, encodedBuffer )
		if ( callback ) {
			callback( null, result )
		} else {
			return result
		}
	}
}

Worker.doWork = doWork

module.exports = Worker
