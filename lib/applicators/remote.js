'use strict'

const MessageUtils = require( '../messageutils' )
const net = require( 'net' )

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

	let remotes = argv.remotes
	let numRemotes = remotes.length

	chunked.forEach( ( chunk, i ) => {

		let metadata = {
			chunkId: i,
			argv: argv
		}

		let resultMeta
		let result

		let gotResult = () => {
			mapped[ i ] = decode( result )
			done++
			remoteWorkerSocket.end()

			if ( done === chunked.length ) {

				let reduced = reducer( mapped )

				callback( null, reduced )
			}
		}

		let remoteAddress = remotes[ i % numRemotes ]

		let remoteWorkerSocket = new net.Socket()

		MessageUtils.handleIncomingMessages( remoteWorkerSocket, ( message ) => {
			if ( !resultMeta ) {
				resultMeta = JSON.parse( message )
				console.log( `Remote chunk ${i} took ${resultMeta.time/1000}s (processing)` )
			} else if ( !result ) {
				result = message
				gotResult()
			}
		} )

		remoteWorkerSocket.connect( {
			port: remoteAddress.port,
			host: remoteAddress.host
		}, () => {
			console.log( `Sending chunk ${i} to ${remoteAddress.host}:${remoteAddress.port}` )

			MessageUtils.writeData( metadata, remoteWorkerSocket )
			MessageUtils.writeData( chunk, remoteWorkerSocket )
		} )
	} )
}
