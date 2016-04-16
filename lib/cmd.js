'use strict'

const path = require( 'path' )
const fs = require( 'fs' )

const Processes = require( './processes' )
const IO = module.parent.exports.IO
const WorkerServer = module.parent.exports.WorkerServer

const ApplyProcessLocalSerial = require( './applicators/serial' )
const ApplyProcessLocalParallel = require( './applicators/parallel' )
const ApplyProcessRemote = require( './applicators/remote' )
const ApplyProcessVolunteer = require( './applicators/volunteer.js' )

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
	.boolean( 'volunteer' )
	.default( 'volunteer-port', 0 )
	.array( 'args' )
	.alias( 'a', 'args' )
	.default( 'args', [] )
	.default( 'multicore', false )
	.default( 'worker', false )
	.default( 'port', 0 )
	.default( 'remotes', [] )
	.argv


const gotInFileData = ( processFile, err, data ) => {
	if ( err ) {
		console.error( err )
		return
	}

	let processArgs = argv.args

	let applicatorArgs = null

	let processApplicator = null

	switch ( true ) {
		case argv.multicore:
			processApplicator = ApplyProcessLocalParallel
			break

		case argv.volunteer:
			applicatorArgs = {
				port: argv[ 'volunteer-port' ]
			}

			processApplicator = ApplyProcessVolunteer
			break

		case argv.distributed:
			processApplicator = ApplyProcessRemote

			if ( !argv.remotes.length ) {
				throw 'Supply addresses to worker servers'
			}

			let remotes = argv.remotes.map( ( remoteString ) => {
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

			applicatorArgs = {
				remotes
			}

			break

		default:
			processApplicator = ApplyProcessLocalSerial
			break
	}


	processApplicator( data, processFile, processArgs, applicatorArgs, ( err, result ) => {
		IO.AutomaticIO.save( argv.out, result, () => {} )
	} )
}


if ( argv.worker ) {
	// This should be a worker process!

	let workerServer = new WorkerServer( {
		port: argv.port
	} )

} else {


	// Find the in file

	let inFile = argv.i ? argv.i : argv._[ 0 ]

	if ( !inFile ) {
		console.error( 'Error: in data required' )
		return
	}

	try {
		fs.accessSync( inFile, fs.F_OK )
	} catch ( e ) {
		console.error( `Error: "${processFile}" does not exist` )
		return
	}

	// Check the outfile
	if ( !argv.out ) {
		console.error( 'Error: no out file specified' )
		return
	}


	// Find the process

	if ( !argv.process ) {
		console.error( 'Error: process required' )
		return
	}

	let processFile = path.resolve( argv.process )

	try {
		fs.accessSync( processFile, fs.F_OK )
	} catch ( e ) {
		console.error( `Error: "${processFile}" does not exist` )
		return
	}


	IO.AutomaticIO.get( inFile, gotInFileData.bind( this, processFile ) )
}
