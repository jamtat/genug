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
	.array( 'args' )
	.alias( 'a', 'args' )
	.default( 'args', [] )
	.default( 'out', 'out.png' )
	.default( 'process', 'pixelFilter' )
	.default( 'multicore', false )
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

			let metadata = JSON.stringify( {
				chunkId: i,
				argv: argv
			} )

			let resultBuffers = []
			let resultLen = 0
			let resultGot = 0

			let metadataLength = metadata.length
			let metadataBuffer = new Buffer( 4 + metadataLength )

			metadataBuffer.writeUInt32BE( metadataLength, 0 )
			metadataBuffer.write( metadata, 4 )

			let chunkLength = chunk.length
			let chunkLengthBuffer = new Buffer( 4 )

			child.stdin.write( metadataBuffer )
			child.stdin.write( chunk )
			child.stdin.end()

			let gotResult = () => {
				mapped[ i ] = decode( Buffer.concat( resultBuffers ) )
				done++
				child.kill()

				if ( done === chunked.length ) {

					let reduced = reducer( mapped )

					PixelUtils.savePixels( argv.out, reduced )
				}
			}

			child.stdout.on( 'data', ( chunk ) => {
				if ( resultLen === 0 ) {
					resultLen = chunk.readUInt32BE( 0 )
					resultBuffers.push( chunk.slice( 4 ) )
					resultGot += ( chunk.length - 4 )

					if ( resultGot === resultLen ) {
						gotResult()
					}
				} else {

					resultBuffers.push( chunk )
					resultGot += chunk.length

					if ( resultGot === resultLen ) {
						gotResult()
					}
				}
			} )

		} )
	} )
}

let desiredProcess = Processes[ argv.process ]( argv.args )

let processApplicator = argv.multicore ? ApplyProcessLocalParallel : ApplyProcessLocalSerial

processApplicator( argv._[ 0 ], desiredProcess )
