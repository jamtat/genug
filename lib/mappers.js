'use strict';
/*
	Mappers take a chunk of input and produce a mapped output
*/

const _ = require( 'lodash' )

const Mappers = {
	pixelFilter: ( filters ) => ( pixels ) => {
		'use strict';

		let w = pixels.length
		let h = pixels[ 0 ].length

		if ( !_.isArray( filters ) ) filters = [ filters ];

		for ( let filter of filters ) {
			for ( let y = 0; y < h; y++ ) {
				for ( let x = 0; x < w; x++ ) {
					pixels[ x ][ y ] = filter( pixels[ x ][ y ] )
				}
			}
		}

		return pixels
	}
}

module.exports = Mappers
