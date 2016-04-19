#!/usr/bin/env node

'use strict'

const IO = require( './lib/io' )
const Worker = require( './lib/worker/worker' )
const StreamWorker = require( './lib/worker/streamworker' )
const WorkerServer = require( './lib/worker/workerserver' )

module.exports = {
	IO,
	Worker,
	StreamWorker,
	WorkerServer
}

if ( require.main === module ) {
	require( './lib/cmd' )
}
