'use strict';
/*
	Reducers reassemble the mapped inputs into a final result
	They recieve the inputs in the order that they were sent out
*/

const Reducers = {
	simpleChunks: ( results ) => {
		return [].concat( ...results )
	},

	imageChunks: ( imageBuffers ) => {
		let height = imageBuffers.reduce( ( acc, imageBuffer ) => {
			return acc + imageBuffer.height
		}, 0 )

		const ImageBuffer = require( './ImageBuffer' )

		return new ImageBuffer( imageBuffers[ 0 ].width, height, Buffer.concat(
			imageBuffers.map( ( imageBuffer ) => imageBuffer.getBuffer() )
		) )

	}
}

module.exports = Reducers
