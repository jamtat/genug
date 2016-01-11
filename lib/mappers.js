'use strict';
/*
	Mappers take a chunk of input and produce a mapped output
*/

const _ = require( 'lodash' )
const PixelUtils = require( './pixelutils' )

const Mappers = {
	pixelFilter: ( filters ) => ( pixels ) => {

		let w = pixels.width
		let h = pixels.height
		let buffer = pixels.getBuffer()
		let l = buffer.length

		if ( !_.isArray( filters ) ) filters = [ filters ];

		for ( let filter of filters ) {
			for ( let i = 0; i < l; i += 4 ) {
				let filtered = filter( buffer.slice( i, i + 4 ) )
				buffer[ i ] = filtered[ 0 ]
				buffer[ i + 1 ] = filtered[ 1 ]
				buffer[ i + 2 ] = filtered[ 2 ]
				buffer[ i + 3 ] = filtered[ 3 ]
			}
		}

		return pixels
	},

	convolutionFilter: ( kernel, preserveAlpha ) => ( pixels ) => {

		return PixelUtils.convolution( pixels, kernel, preserveAlpha )

	}
}

module.exports = Mappers
