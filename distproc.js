#!/usr/local/bin/node

'use strict';

const childProcess = require( 'child_process' )
const MessageUtils = require( './lib/messageutils' )
const PixelUtils = require( './lib/pixelutils' )
const Processes = require( './lib/processes' )
const noop = ( x ) => x
const net = require( 'net' )


//Configure arguments
let argv = require( 'yargs' )
	.alias( 'i', 'in' )
	.alias( 'o', 'out' )
	.alias( 'p', 'process' )
	.alias( 'm', 'multicore' )
	.alias( 'd', 'distributed' )
	.alias( 'r', 'remotes' )
	.array( 'remotes' )
	.boolean( 'multicore' )
	.boolean( 'worker' )
	.array( 'args' )
	.alias( 'a', 'args' )
	.default( 'args', [] )
	.default( 'out', 'out.png' )
	.default( 'process', 'pixelFilter' )
	.default( 'multicore', false )
	.default( 'worker', false )
	.default( 'port', 0 )
	.default( 'remotes', [] )
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

					PixelUtils.savePixels( argv.out, reduced )
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
	} )
}


let ApplyProcessRemote = ( filename, desiredProcess ) => {

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

		let remotes = argv.remotes
		let numRemotes = remotes.length

		chunked.map( ( chunk, i ) => {

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

					PixelUtils.savePixels( argv.out, reduced )
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

if ( argv.worker ) {
	// This should be a worker process!

	let server = net.createServer( ( socket ) => {

		let remoteAddress = socket.address()

		console.log( `Got connection from ${remoteAddress.address}:${remoteAddress.port}` )

		let child = childProcess.spawn( 'node', [ './lib/worker.js' ], {
			stdio: [ 'pipe', 'pipe', 'inherit' ]
		} )

		socket.pipe( child.stdin )

		child.stdout.pipe( socket )

		socket.on( 'close', () => {
			console.log( `Connection terminated to ${remoteAddress.address}:${remoteAddress.port}` )
		} )
	} )

	server.listen( argv.port )

	let serverPort = server.address().port

	console.log( `Worker listening for jobs on port ${serverPort}` )

} else {
	// This is a normal process
	let desiredProcess = Processes[ argv.process ]( argv.args )

	let processApplicator

	switch ( true ) {
		case argv.multicore:
			processApplicator = ApplyProcessLocalParallel
			break;

		case argv.distributed:
			processApplicator = ApplyProcessRemote

			if ( !argv.remotes.length ) {
				throw 'Supply addresses to worker servers'
			}

			argv.remotes = argv.remotes.map( ( remoteString ) => {
				let splitIndex = remoteString.lastIndexOf( ':' )

				if ( splitIndex < 0 ) {
					throw `Invalid hostname/port "${remoteString}"`
				}

				let host = remoteString.slice( 0, splitIndex )
				let port = remoteString.slice( splitIndex + 1 )

				if ( !host || !port ) {
					throw `Invalid hostname/port "${remoteString}"`
				}

				return {
					host, port
				}
			} )

			break;

		default:
			processApplicator = ApplyProcessLocalSerial
			break;
	}

	let inFile = argv.i ? argv.i : argv._[ 0 ]

	processApplicator( inFile, desiredProcess )
}
