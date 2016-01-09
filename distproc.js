'use strict';

const childProcess = require( 'child_process' )
const PixelUtils = require( './lib/pixelutils' )
const Processes = require( './lib/processes' )
const Filters = require( './lib/filters' )


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

		let reduced = reducer( mapped )

		PixelUtils.savePixels( argv.out, reduced )

	} )
}

let ApplyProcessLocalParallel = ( filename, process ) => {

	let shuffler = process.shuffler
	let mapper = process.mapper
	let reducer = process.reducer

	PixelUtils.getPixels( filename, ( err, pixels ) => {

		let done = 0;

		let chunked = [ ...shuffler( pixels ) ]
		let mapped = []

		for ( let i = 0; i < chunked.length; i++ ) {
			let child = childProcess.fork( './lib/worker.js' )
			child.send( {
				chunkId: i,
				argv: argv,
				data: chunked[ i ]
			} )
			child.on( 'message', function( message ) {
				console.log( '[parent] received message from child:', message.chunkId );
				done++;
				mapped[ message.chunkId ] = message.result
				this.kill()
				if ( done === chunked.length ) {
					console.log( '[parent] received all results' );
					let reduced = reducer( mapped )

					PixelUtils.savePixels( argv.out, reduced )
				}
			} );
		}

	} )
}

let desiredProcess = Processes[ argv.process ]( argv.args )

let processApplicator = argv.multicore ? ApplyProcessLocalParallel : ApplyProcessLocalSerial

processApplicator( argv._[ 0 ], desiredProcess )
