'use strict';

const PixelUtils = require( './pixelutils' )
const Processes = require( './processes' )

let work = ( data, mapper ) => {
	return mapper( data )
}

process.on( 'message', function messageHandler( message ) {

	let chunkId = message.chunkId
	let data = message.data
	let desiredProcess = Processes[ message.argv.process ]( message.argv.args )

	// let start = Date.now()
	let result = work( data, desiredProcess.mapper )
		// console.log( 'Time taken: ' + ( Date.now() - start ) )

	process.send( {
		chunkId, result
	} )
} );

module.exports = work
