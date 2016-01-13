'use strict';

const childProcess = require( 'child_process' )
const MessageUtils = require( './lib/messageutils' )
const PixelUtils = require( './lib/pixelutils' )
const Processes = require( './lib/processes' )
const noop = ( x ) => x


//Configure arguments
let argv = require( 'yargs' )
	.demand( 1 )
	.alias( 'o', 'out' )
	.alias( 'p', 'process' )
	.alias( 'm', 'multicore' )
	.boolean( 'multicore' )
	.boolean( 'worker' )
	.array( 'args' )
	.alias( 'a', 'args' )
	.default( 'args', [] )
	.default( 'out', 'out.png' )
	.default( 'process', 'pixelFilter' )
	.default( 'multicore', false )
	.default( 'worker', false )
	.argv

let ApplyProcessLocalSerial = ( filename, desiredProcess ) => {

	let shuffler = desiredProcess.shuffler
	let mapper = desiredProcess.mapper
	let reducer = desiredProcess.reducer
	let preProcessor = desiredProcess.preProcessor ? desiredProcess.preProcessor : noop


	PixelUtils.getPixels( filename, ( err, pixels ) => {

		let chunked = [ ...shuffler( preProcessor( pixels ) ) ]

		let mapped = chunked.map( mapper )

		let reduced = reducer( mapped )

		PixelUtils.savePixels( argv.out, reduced )

	} )
}

let ApplyProcessLocalParallel = ( filename, desiredProcess ) => {

	let shuffler = desiredProcess.shuffler
	let mapper = desiredProcess.mapper
	let reducer = desiredProcess.reducer
	let preProcessor = desiredProcess.preProcessor ? desiredProcess.preProcessor : noop

	let encode = desiredProcess.encode
	let decode = desiredProcess.decode

	PixelUtils.getPixels( filename, ( err, pixels ) => {

		let chunked = [ ...shuffler( preProcessor( pixels ) ) ].map( encode )
		let mapped = []

		let done = 0

		chunked.map( ( chunk, i ) => {

			let child = childProcess.spawn( 'node', [ './lib/worker.js' ], {
				stdio: [ 'pipe', 'pipe', 'inherit' ]
			} )

			let metadata = {
				chunkId: i,
				argv: argv
			}

			let result

			MessageUtils.writeData( metadata, child.stdin )
			MessageUtils.writeData( chunk, child.stdin )

			let gotResult = () => {
				mapped[ i ] = decode( result )
				done++
				child.kill()

				if ( done === chunked.length ) {

					let reduced = reducer( mapped )

					PixelUtils.savePixels( argv.out, reduced )
				}
			}

			MessageUtils.handleIncomingMessages( child.stdout, ( message ) => {
				if ( !result ) {
					result = message
					gotResult()
				}
			} )

		} )
	} )
}

if ( argv.worker ) {
	// This should be a worker process!

} else {
	// This is a normal process
	let desiredProcess = Processes[ argv.process ]( argv.args )

	let processApplicator = argv.multicore ? ApplyProcessLocalParallel : ApplyProcessLocalSerial

	processApplicator( argv._[ 0 ], desiredProcess )
}
