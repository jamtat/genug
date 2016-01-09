'use strict';

const getPixels = require( 'get-pixels' )
const savePixels = require( 'save-pixels' )
const ndarray = require( 'ndarray' )
const _ = require( 'lodash' )
const fs = require( 'fs' )

const R = 0,
	G = 1,
	B = 2,
	A = 3

const PixelUtils = {

	getPixels: function( filename, callback ) {

		getPixels( filename, ( err, ndPixels ) => {
			if ( err ) callback( err, null );

			let shape = ndPixels.shape

			let w = shape[ 0 ]
			let h = shape[ 1 ]
			let channels = shape[ 2 ]

			let pixels = []

			for ( let x = 0; x < w; x++ ) {
				pixels[ x ] = []
				for ( let y = 0; y < h; y++ ) {
					pixels[ x ][ y ] = []
					pixels[ x ][ y ][ R ] = ndPixels.get( x, y, R )
					pixels[ x ][ y ][ G ] = ndPixels.get( x, y, G )
					pixels[ x ][ y ][ B ] = ndPixels.get( x, y, B )
					pixels[ x ][ y ][ A ] = channels === 4 ? ndPixels.get( x, y, A ) : 255

				}
			}

			callback( err, pixels )
		} )
	},

	getPixelsVideo: function( filename, pixels ) {

	},

	savePixels: function( filename, pixels ) {

		let w = pixels.length
		let h = pixels[ 0 ].length

		let ndOut = ndarray( _.flattenDeep( pixels ), [ w, h, 4 ] )
		let outStream = fs.createWriteStream( filename )

		savePixels( ndOut, 'png' ).pipe( outStream )
	}
}

module.exports = PixelUtils
