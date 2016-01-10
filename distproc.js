'use strict';

const childProcess = require( 'child_process' )
const PixelUtils = require( './lib/pixelutils' )
const Processes = require( './lib/processes' )
const Filters = require( './lib/filters' )
const fs = require( 'fs' )


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

let ApplyProcessLocalSerial = ( filename, process ) => {

	let shuffler = process.shuffler
	let mapper = process.mapper
	let reducer = process.reducer


	PixelUtils.getPixels( filename, ( err, pixels ) => {

		let chunked = [ ...shuffler( pixels ) ]

		let mapped = chunked.map( mapper )

		// let reduced = reducer( mapped )

		PixelUtils.savePixels( argv.out, pixels )

	} )
}

let ApplyProcessLocalParallel = ( filename, desiredProcess ) => {

	let shuffler = desiredProcess.shuffler
	let mapper = desiredProcess.mapper
	let reducer = desiredProcess.reducer

	let encode = desiredProcess.encode
	let decode = desiredProcess.decode

	PixelUtils.getPixels( filename, ( err, pixels ) => {

		let chunked = [ ...shuffler( pixels ) ].map( encode )
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

			let len = metadata.length
			let metadataBuffer = new Buffer( 2 + len )
			metadataBuffer.writeUInt16BE( len, 0 )
			metadataBuffer.write( metadata, 2 )

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
