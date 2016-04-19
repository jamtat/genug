#!/usr/bin/env node

'use strict'

const IO = require( './lib/io' )
const Worker = require( './lib/worker/worker' )
const StreamWorker = require( './lib/worker/streamworker' )
const WorkerServer = require( './lib/worker/workerserver' )

const ApplyProcessSerial = require( './lib/applicators/serial' )
const ApplyProcessParallel = require( './lib/applicators/parallel' )
const ApplyProcessRemote = require( './lib/applicators/remote' )
const ApplyProcessVolunteer = require( './lib/applicators/volunteer' )

const _wrapApplicator = ( applicator ) => ( data, processFile, processArgs, applicatorArgs, callback ) => {

	if ( !data ) {
		callback( 'Error: no data supplied' )
		return
	}

	if ( !processFile ) {
		callback( 'Error: process required' )
		return
	}

	processFile = path.resolve( processFile )

	try {
		fs.accessSync( processFile, fs.F_OK )
	} catch ( e ) {
		callback( `Error: "${processFile}" does not exist` )
		return
	}

	applicator( data, processFile, processArgs, applicatorArgs, callback )
}

const serial = _wrapApplicator( ApplyProcessSerial )
const parallel = _wrapApplicator( ApplyProcessParallel )
const remote = _wrapApplicator( ApplyProcessRemote )
const volunteer = _wrapApplicator( ApplyProcessVolunteer )

module.exports = {
	IO,
	Worker, StreamWorker, WorkerServer,
	serial, parallel, remote, volunteer
}

if ( require.main === module ) {
	require( './lib/cmd' )
}
