'use strict';
/*
	Shufflers are generator functions that split an input into chunks
*/
const Shufflers = {

	simpleChunks: ( numChunks ) => function*( array ) {

		let start = 0,
			l = array.length,
			step = l / numChunks

		for ( let i = 0; i < numChunks; i++ ) {
			yield array.slice( Math.round( i * step ), i == numChunks - 1 ? l : Math.round( ( i + 1 ) * step ) )
		}
	},

	imageChunks: ( numChunks ) => function*( pixels ) {

		const ImageBuffer = require( './ImageBuffer' )

		let w = pixels.width,
			h = pixels.height,
			buffer = pixels.getBuffer(),
			step = h / numChunks,
			start = 0,
			end = 0

		for ( let i = 0; i < numChunks; i++ ) {
			start = Math.round( i * step ) * w * 4
			end = i == numChunks - 1 ? buffer.length : Math.round( ( i + 1 ) * step ) * w * 4

			yield new ImageBuffer( w, end - start, buffer.slice( start, end ) )
		}
	}
}

module.exports = Shufflers
