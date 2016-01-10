'use strict';

const PixelUtils = require( './pixelutils' )
const Processes = require( './processes' )

let work = ( data, mapper ) => {
	return mapper( data )
}

let chunks = []
let metalength = 0
let metastring = ''
let metadata = {}
let encodedBuffer


let initiateWork = () => {
	let chunkId = metadata.chunkId
	let desiredProcess = Processes[ metadata.argv.process ]( metadata.argv.args )

	let mapper = desiredProcess.mapper

	let encode = desiredProcess.encode
	let decode = desiredProcess.decode

	let data = decode( encodedBuffer )

	let result = work( data, mapper )

	// PixelUtils.savePixels( `${chunkId}-${metadata.argv.out}`, result )

	let encodedResult = encode( result )

	let lengthBuffer = new Buffer( 4 )
	lengthBuffer.writeUInt32BE( encodedResult.length, 0 )

	process.stdout.write( lengthBuffer )
	process.stdout.write( encodedResult )
}



process.stdin.on( 'data', ( chunk ) => {
	if ( metalength === 0 ) {
		metalength = chunk.readUInt16BE( 0 )
		let rest = chunk.slice( 2 )
		if ( rest.length > metalength ) {
			metastring += rest.slice( 0, metalength ).toString()
			chunks.push( rest.slice( metalength ) )
		} else {
			metastring += rest.toString()
		}
	} else if ( metastring.length < metalength ) {
		if ( chunk.length + metastring.length > metalength ) {
			metastring += chunk.slice( 0, metalength - metastring.length ).toString()
			chunks.push( chunk.slice( metalength - metastring.length ) )
		} else {
			metastring += chunk.toString()
		}
	} else {
		chunks.push( chunk )
	}
} )
process.stdin.on( 'end', () => {
	metadata = JSON.parse( metastring )
	encodedBuffer = Buffer.concat( chunks )
	initiateWork()
} )
