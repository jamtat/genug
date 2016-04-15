'use strict'

const ImageBuffer = require( '../ImageBuffer' )

module.exports = ( numChunks ) => function*( pixels ) {

	let w = pixels.width,
		h = pixels.height,
		buffer = pixels.getBuffer(),
		step = h / numChunks,
		start = 0,
		end = 0

	for ( let i = 0; i < numChunks; i++ ) {
		start = Math.round( i * step ) * w * 4
		end = i === numChunks - 1 ? buffer.length : Math.round( ( i + 1 ) * step ) * w * 4

		yield new ImageBuffer( w, Math.round( ( i + 1 ) * step ) - Math.round( i * step ), buffer.slice( start, end ) )
	}
}
