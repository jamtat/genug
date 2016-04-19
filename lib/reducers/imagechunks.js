'use strict'

const ImageBuffer = require( '../ImageBuffer' )

module.exports = ( imageBuffers ) => {
	let height = imageBuffers.reduce( ( acc, imageBuffer ) => {
		return acc + imageBuffer.height
	}, 0 )

	return new ImageBuffer( imageBuffers[ 0 ].width, height, Buffer.concat(
		imageBuffers.map( ( imageBuffer ) => imageBuffer.getBuffer() )
	) )
}
