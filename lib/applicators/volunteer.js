'use strict'

const fs = require( 'fs' )
const http = require( 'http' )
const zlib = require( 'zlib' )
const url = require( 'url' )
const getContentType = require( '../content-types' )
const getFile = ( filename ) => require( 'fs' ).readFileSync( filename )
const browserify = require( 'browserify' )
const babel = require( 'babel-core' )

let reservedPaths = {
	'distproc-volunteer-client.js': ( callback ) => {
		let b = browserify()
		b.add( 'volunteer-client-js/index.js' )
		b.bundle( ( err, content ) => callback( null, content ) )
	}
}

let cache = {
	raw: {},
	deflate: {},
	zlib: {},
}

let serveHTTPRequest = ( req, res ) => {

	let path = url.parse( req.url ).pathname

	if ( path.slice( -1 ) === '/' ) {
		path += 'index.html'
	}

	let filepath = `volunteer-static${path}`

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
			res.writeHead( 404, {
				'Content-Type': 'text/plain'
			} )
			res.end( '404 Not Found' )
			return
		}
	}

	sendRequest( getFile( filepath ) )
}

module.exports = ( filename, desiredProcess, argv ) => {

	const hostname = ''
	const port = parseInt( argv[ 'volunteer-port' ] )

	reservedPaths[ 'argv.js' ] = ( callback ) => callback( null, `var argv = ${JSON.stringify(argv)}` )

	let server = http.createServer( serveHTTPRequest ).listen( port, hostname, () => {
		console.log( `Web server running at port ${server.address().port}` )
	} )
}
