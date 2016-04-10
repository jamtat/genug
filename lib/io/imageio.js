'use strict'

const fs = require( 'fs' )
const _ = require( 'lodash' )
const _getPixels = require( 'get-pixels' )
const _savePixels = require( 'save-pixels' )
const ndarray = require( 'ndarray' )
const ImageBuffer = require( '../ImageBuffer' )

const R = 0
const G = 1
const B = 2
const A = 3

const getPixels = ( filename, callback ) => _getPixels( filename, ( err, ndPixels ) => {
	if ( err ) callback( err, null );

	let shape = ndPixels.shape

	let w = shape[ 0 ]
	let h = shape[ 1 ]
	let channels = shape[ 2 ]

	let pixels = new ImageBuffer( w, h )

	for ( let x = 0; x < w; x++ ) {
		for ( let y = 0; y < h; y++ ) {
			pixels.setPixel( x, y, [
				ndPixels.get( x, y, R ),
				ndPixels.get( x, y, G ),
				ndPixels.get( x, y, B ),
				channels === 4 ? ndPixels.get( x, y, A ) : 255
			] )
		}
	}

	callback( err, pixels )
} )

const savePixels = ( filename, options, pixels, callback ) => {

	if ( _.isFunction( pixels ) ) {
		callback = pixels
	}

	if ( options instanceof ImageBuffer ) {
		pixels = options
		options = {}
	}

	if ( !options.format ) {
		options.format = filename.split( '.' ).pop()
		if ( !_.includes( extensions, options.format ) ) {
			options.format = 'png'
		}
	}

	if ( !callback ) {
		callback = _.noop
	}


	let w = pixels.width
	let h = pixels.height
	let ndOut = ndarray( pixels.getBuffer(), [ w, h, 4 ], [ 4, w * 4, 1 ] )
	let outStream = fs.createWriteStream( filename )

	_savePixels( ndOut, options.format ).pipe( outStream )

	callback( null )
}

const extensions = [ 'png', 'jpg', 'jpeg', 'gif' ]

module.exports = {
	getPixels, savePixels, extensions
}
