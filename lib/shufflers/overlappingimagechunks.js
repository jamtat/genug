'use strict'

module.exports = ( numChunks, overlap ) => function*( pixels ) {

	const crop = require( '../utils/pixelutils' ).crop

	let bound = ( x, min, max ) => {
		return Math.max( min, Math.min( x, max ) )
	}

	let w = pixels.width,
		h = pixels.height,
		step = h / numChunks,
		start = 0,
		end = 0

	for ( let i = 0; i < numChunks; i++ ) {
		start = bound( Math.round( i * step ) - overlap, 0, h )
		end = i === numChunks - 1 ? h : bound( Math.round( ( i + 1 ) * step ) + overlap, 0, h )

		yield crop( pixels, 0, start, w, end - start )
	}
}
