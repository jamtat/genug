'use strict';

const getPixels = require( 'get-pixels' )
const savePixels = require( 'save-pixels' )
const Parallel = require( 'paralleljs' )
const ndarray = require( 'ndarray' )
const _ = require( 'lodash' )
const fs = require( 'fs' )

const R = 0,
	G = 1,
	B = 2,
	A = 3

const PixelTransform = {
	transform: function( imageName, filters ) {

		PixelTransform.getPixels( imageName, ( err, pixels ) => {

			let w = pixels[ 0 ].length
			let h = pixels.length

			for ( let filter of filters ) {
				for ( let y = 0; y < h; y++ ) {
					for ( let x = 0; x < w; x++ ) {
						pixels[ x ][ y ] = filter( pixels[ x ][ y ] )
					}
				}
			}

			let ndOut = ndarray( _.flattenDeep( pixels ), [ w, h, 4 ] )
			let outStream = fs.createWriteStream( 'out.png' )

			savePixels( ndOut, 'png' ).pipe( outStream )
		} )
	},

	getPixels: function( imageName, callback ) {

		getPixels( imageName, ( err, ndPixels ) => {
			if ( err ) callback( err, null );

			let shape = ndPixels.shape

			let w = shape[ 0 ]
			let h = shape[ 1 ]
			let channels = shape[ 2 ]

			let pixels = []

			for ( let x = 0; x < w; x++ ) {
				pixels[ x ] = []
				for ( let y = 0; y < h; y++ ) {
					pixels[ x ][ y ] = [
						ndPixels.get( x, y, R ),
						ndPixels.get( x, y, G ),
						ndPixels.get( x, y, B ),
						channels === 4 ? ndPixels.get( x, y, A ) : 255
					]
				}
			}

			callback( err, pixels )
		} )
	}
}

const Filters = {
	invert: ( pixel ) => [
		255 - pixel[ R ],
		255 - pixel[ G ],
		255 - pixel[ B ],
		pixel[ A ]
	],

	invertAlpha: ( pixel ) => [
		pixel[ R ],
		pixel[ G ],
		pixel[ B ],
		255 - pixel[ A ]
	],

	greyscale: ( pixel ) => {
		let intensity = ( pixel[ R ] + pixel[ G ] + pixel[ B ] ) / 3
		return [ intensity, intensity, intensity, pixel[ A ] ]
	},

	lumaMap: ( pixel ) => [
		0,
		0,
		0, ( pixel[ R ] + pixel[ G ] + pixel[ B ] ) / 3
	],

	fill: ( r, g, b ) => ( pixel ) => [
		r,
		g,
		b,
		pixel[ A ]
	]
}


module.exports = PixelTransform


PixelTransform.transform( 'olivia.jpg', [ Filters.lumaMap, Filters.invertAlpha, Filters.fill( 0, 0, 255 ) ] )
