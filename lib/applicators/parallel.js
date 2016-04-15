'use strict'

const childProcess = require( 'child_process' )
const MessageUtils = require( '../messageutils' )

module.exports = ( data, desiredProcess, argv, callback ) => {

	let shuffler = desiredProcess.shuffler
	let mapper = desiredProcess.mapper
	let reducer = desiredProcess.reducer
	let preProcessor = desiredProcess.preProcessor ? desiredProcess.preProcessor : ( x ) => x

	let encode = desiredProcess.encode
	let decode = desiredProcess.decode

	let chunked = [ ...shuffler( preProcessor( data ) ) ].map( encode )
	let mapped = []

	let done = 0

	chunked.forEach( ( chunk, i ) => {

		let child = childProcess.spawn( 'node', [ require.resolve( '../worker/streamworker' ) ], {
			stdio: [ 'pipe', 'pipe', 'inherit' ]
		} )

		let metadata = {
			chunkId: i,
			argv: argv
		}

		let resultMeta
		let result

		MessageUtils.writeData( metadata, child.stdin )
		MessageUtils.writeData( chunk, child.stdin )

		let gotResult = () => {
			mapped[ i ] = decode( result )
			done++
			child.kill()

			if ( done === chunked.length ) {

				let reduced = reducer( mapped )

				callback( null, reduced )
			}
		}

		MessageUtils.handleIncomingMessages( child.stdout, ( message ) => {
			if ( !resultMeta ) {
				resultMeta = JSON.parse( message )
			} else if ( !result ) {
				result = message
				gotResult()
			}
		} )
	} )
}
