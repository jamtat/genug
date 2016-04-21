'use strict'

const net = require( 'net' )
const os = require( 'os' )
const childProcess = require( 'child_process' )

class WorkerServer {

	constructor( options ) {

		this.server = null

		this.workQueue = []

		this.activeWorkers = 0

		if ( !options ) {
			options = {
				port: 0,
				verbose: false
			}
		}

		if ( !options.port ) {
			options.port = 0
		}

		this.verbose = !!options.verbose

		let mw = parseInt( options.maxWorkers ) | 0

		this.maxWorkers = mw > 0 ? mw : os.cpus().length

		this.createServer( options )

	}

	handleSocket( socket ) {

		this.activeWorkers += 1

		let child = childProcess.spawn( 'node', [ require.resolve( './streamworker' ) ], {
			stdio: [ 'pipe', 'pipe', 'inherit' ]
		} )

		let alive = true

		let onExit = () => {
			alive = false

			this.activeWorkers -= 1

			onSocketClose()

			this.checkQueue()
		}

		let onSocketClose = () => {
			socket && socket.destroy()
			alive && child.kill()
		}

		child.on( 'exit', onExit )
		child.stdout.on( 'error', onExit )
		child.stdin.on( 'error', onExit )

		socket.on( 'close', onSocketClose )

		socket.pipe( child.stdin )
		child.stdout.pipe( socket )

	}

	checkQueue() {
		if ( this.activeWorkers < this.maxWorkers && this.workQueue.length > 0 ) {
			let nextSocket = this.workQueue.shift()
			this.handleSocket( nextSocket )
		}
	}

	createServer( options ) {
		this.server = net.createServer( ( socket ) => {

			let remoteAddress = {
				address: socket.remoteAddress,
				port: socket.remotePort
			}

			if ( this.verbose ) {
				console.log( `Got connection from ${remoteAddress.address}:${remoteAddress.port}` )
			}

			socket.on( 'error', () => {
				if ( this.verbose ) {
					console.log( `Connection error to ${remoteAddress.address}:${remoteAddress.port}` )
				}
			} )

			socket.on( 'close', () => {
				if ( this.verbose ) {
					console.log( `Connection terminated to ${remoteAddress.address}:${remoteAddress.port}` )
				}

				let i = -1

				if ( i = this.workQueue.indexOf( socket ) > -1 ) {
					this.workQueue.splice( i, 1 )
				}
			} )

			this.workQueue.push( socket )

			this.checkQueue()

		} )

		this.server.listen( options )

		this.address = this.server.address()

		if ( this.verbose ) {
			console.log( `Worker server listening for jobs on port ${this.address.port}` )
		}
	}


	stop() {
		if ( this.server ) {
			this.server.close()
		}
	}
}

module.exports = WorkerServer


if ( require.main === module ) {
	new WorkerServer( {
		verbose: true
	} )
}
