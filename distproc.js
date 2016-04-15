#!/usr/bin/env node

'use strict'

const IO = require( './lib/io' )
const Worker = require( './lib/worker/worker' )
const StreamWorker = require( './lib/worker/streamworker' )
const WorkerServer = require( './lib/worker/workerserver' )
const Processes = require( './lib/processes' )

const ApplyProcessLocalSerial = require( './lib/applicators/serial' )
const ApplyProcessLocalParallel = require( './lib/applicators/parallel' )
const ApplyProcessRemote = require( './lib/applicators/remote' )
const ApplyProcessVolunteer = require( './lib/applicators/volunteer.js' )


if ( require.main === module ) {
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
		.default( 'out', 'out.png' )
		.default( 'process', 'pixelFilter' )
		.default( 'multicore', false )
		.default( 'worker', false )
		.default( 'port', 0 )
		.default( 'remotes', [] )
		.argv

	if ( argv.worker ) {
		// This should be a worker process!

		let workerServer = new WorkerServer( {
			port: argv.port
		} )

	} else {
		// This is a normal process

		let desiredProcess = Processes[ argv.process ]( argv.args )

		let processApplicator

		switch ( true ) {
			case argv.multicore:
				processApplicator = ApplyProcessLocalParallel
				break;

			case argv.volunteer:
				processApplicator = ApplyProcessVolunteer
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

		IO.AutomaticIO.get( inFile, ( err, data ) => {
			if ( err ) {
				console.error( err )
			} else {
				processApplicator( data, desiredProcess, argv, ( err, result ) => {
					IO.AutomaticIO.save( argv.out, result, () => {} )
				} )
			}
		} )
	}
}

module.exports = {
	IO
}
