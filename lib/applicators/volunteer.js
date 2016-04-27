'use strict'

const fs = require( 'fs' )
const path = require( 'path' )
const http = require( 'http' )
const zlib = require( 'zlib' )
const url = require( 'url' )
const getContentType = require( '../content-types' )
const getFile = ( filename ) => require( 'fs' ).readFileSync( filename )
const browserify = require( 'browserify' )
const less = require( 'less' )
const WebSocketServer = require( 'websocket' ).server
const MessageUtils = require( '../messageutils' )

const STATIC_ROOT = path.resolve( __dirname, '../../volunteer-static' )
const JS_ROOT = path.resolve( __dirname, '../../volunteer-client-js' )

const LESS_ROOT = `${STATIC_ROOT}/less/distproc.less`
const LESS_OPTIONS = {
	filename: 'distproc.less',
	paths: `${STATIC_ROOT}/less`
}

let reservedPaths = {
	'distproc-volunteer-client.js': ( callback ) => {
		let b = browserify()
		b.add( `${JS_ROOT}/index.js` )
		b.require( processFileName, {
			expose: 'processFile'
		} )
		b.exclude( 'websocket' )
		b.transform( require( 'babelify' ), {
			presets: [ "es2015", "stage-0" ]
		} )
		b.bundle( ( err, content ) => err ? console.log( err ) : callback( null, content ) )
	},

	'babel-polyfill.js': ( callback ) => callback( null, getFile(
		path.resolve( __dirname, '../../node_modules/babel-polyfill/dist/polyfill.min.js' ) ) ),

	'distproc.css': ( callback ) => {
		let lessRootFile = getFile( LESS_ROOT ).toString( 'utf8' )
		less.render( lessRootFile, LESS_OPTIONS, ( err, out ) => {
			callback( err, out.css )
		} )
	}
}

let cache = {
	raw: {},
	deflate: {},
	zlib: {},
}

let processFileName

const serveHTTPRequest = ( req, res ) => {

	let path = url.parse( req.url ).pathname

	if ( path.slice( -1 ) === '/' ) {
		path += 'index.html'
	}

	let filepath = `${STATIC_ROOT}${path}`

	let sendRequest = ( content ) => {

		let headers = {
			'Content-Type': getContentType( path )
		}

		let acceptEncoding = req.headers[ 'accept-encoding' ]

		if ( !acceptEncoding ) {
			acceptEncoding = ''
		}
		// Hack in some compression to make sending the data bearable
		if ( acceptEncoding.match( /\bdeflate\b/ ) ) {
			if ( cache.deflate[ path ] ) {
				content = cache.deflate[ path ]
			} else {
				cache.deflate[ path ] = content = zlib.deflateSync( content )
			}
			headers[ 'content-encoding' ] = 'deflate'

		} else if ( acceptEncoding.match( /\bgzip\b/ ) ) {
			if ( cache.gzip[ path ] ) {
				content = cache.gzip[ path ]
			} else {
				cache.gzip[ path ] = content = zlib.gzipSync( content )
			}
			headers[ 'content-encoding' ] = 'gzip'
		}

		headers[ 'Content-Length' ] = Buffer.byteLength( content )

		res.writeHead( 200, headers )
		res.end( content )
	}

	if ( reservedPaths.hasOwnProperty( path.slice( 1 ) ) ) {

		if ( !cache.raw[ path ] ) {
			reservedPaths[ path.slice( 1 ) ]( ( err, content ) => {
				cache.raw[ path ] = content
				sendRequest( content )
			} )
		} else {
			sendRequest()
		}

		return

	} else {
		if ( !fs.existsSync( filepath ) ) {
			console.log( filepath )
			res.writeHead( 404, {
				'Content-Type': 'text/plain'
			} )
			res.end( '404 Not Found' )
			return
		}
	}

	sendRequest( getFile( filepath ) )
}

module.exports = ( data, processFile, processArgs, applicatorArgs, callback ) => {

	const port = applicatorArgs.port

	processFileName = processFile

	let server = http.createServer( serveHTTPRequest ).listen( port, '', () => {
		console.log( `Web server running at port ${server.address().port}` )
	} )

	let desiredProcess = require( processFile )( processArgs )

	let shuffler = desiredProcess.shuffler
	let reducer = desiredProcess.reducer
	let preProcessor = desiredProcess.preProcessor ? desiredProcess.preProcessor : ( x ) => x

	let encode = desiredProcess.encode
	let decode = desiredProcess.decode

	let chunked = [ ...shuffler( preProcessor( data ) ) ].map( encode )
	let mapped = []

	let done = 0

	let currentChunk = 0

	let webSocketServer = new WebSocketServer( {
		httpServer: server,
		maxReceivedMessageSize: 0x500000,
		maxReceivedFrameSize: 0x500000,
		autoAcceptConnections: false
	} )

	webSocketServer.on( 'request', ( req ) => {

		let i = currentChunk

		let connection = req.accept( 'distproc', req.origin )

		let gotHandShake = false

		let resultMeta
		let result

		let gotResult = () => {
			mapped[ i ] = decode( result )
			done++
			sendConfirm()
			connection.close()

			if ( done === chunked.length ) {

				let reduced = reducer( mapped )

				callback( null, reduced )
				webSocketServer.shutDown()
				server.close()

				console.log( `Finished processing` )
			}
		}

		let sendWork = () => {

			if ( i >= chunked.length ) {
				return
			}

			MessageUtils.writeDataWebsocket( {
				chunkId: i,
				processFile: 'processFile',
				processArgs
			}, connection )

			console.log(
				`Sending chunk ${i} of size ${chunked[ i ].length/1e6}mb to ${connection.remoteAddress}` )
			MessageUtils.writeDataWebsocket( chunked[ i ], connection )
			currentChunk++
		}

		let sendConfirm = () => {
			MessageUtils.writeDataWebsocket( {
				type: 'confirm',
				chunkId: i
			}, connection )
		}

		MessageUtils.handleIncomingMessagesWebsocket( connection, ( message ) => {
			if ( !gotHandShake ) {
				let msg

				try {
					msg = JSON.parse( message.toString() )
				} catch ( e ) {
					//Not handshake
					return
				}

				if ( msg.type === 'handshake' ) {
					sendWork()
					gotHandShake = true
				}
			} else if ( !resultMeta ) {
				resultMeta = JSON.parse( message )
				console.log( `Meta: Volunteer chunk ${i} took ${resultMeta.time/1000}s (processing)` )
			} else if ( !result ) {
				console.log( `Result: Got result for chunk ${i} of size ${message.length/1e6}mb` )
				result = message
				gotResult()
			}
		} )

		connection.on( 'close', ( reasonCode, description ) => {
			console.log( `${new Date()} Peer ${connection.remoteAddress} disconnected.` )
		} )
	} )
}
