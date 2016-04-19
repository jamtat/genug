'use strict'

const MessageUtils = require( '../messageutils' )
const net = require( 'net' )
const browserify = require( 'browserify' )


const bundleCode = ( processFile, callback ) => {
	// Build a bundle designed for node
	let b = browserify( {
		browserField: false,
		builtins: false,
		commondir: false,
		insertGlobals: [ '__filename', '__dirname' ],
		insertGlobalVars: {
			process: () => {}
		},
		hasExports: true
	} )
	b.require( processFile, {
		expose: 'processFile'
	} )
	b.bundle( ( err, content ) => err ? console.log( err ) : callback( null, content.toString( 'utf-8' ) ) )
}

module.exports = ( data, processFile, processArgs, applicatorArgs, callback ) => {

	bundleCode( processFile, ( err, processFileSource ) => {

		let desiredProcess = require( processFile )( processArgs )

		let shuffler = desiredProcess.shuffler
		let reducer = desiredProcess.reducer
		let preProcessor = desiredProcess.preProcessor ? desiredProcess.preProcessor : ( x ) => x

		let encode = desiredProcess.encode
		let decode = desiredProcess.decode

		let chunked = [ ...shuffler( preProcessor( data ) ) ].map( encode )
		let mapped = []

		let done = 0

		let remotes = applicatorArgs.remotes
		if ( !remotes ) {
			callback( 'Error: no remote servers specified' )
			return
		}
		let numRemotes = remotes.length

		chunked.forEach( ( chunk, i ) => {

			let metadata = {
				chunkId: i,
				processFileSource,
				processArgs
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
	} )
}
