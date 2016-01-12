'use strict';

const MatrixUtils = require( './matrixutils' )

const ConvolutionFilters = {
	boxBlur: ( size ) => {
		let kernel = MatrixUtils.normalise( MatrixUtils.ones( size, size ) )
		let preserveAlpha = false

		return {
			kernel, preserveAlpha
		}
	},

	gaussianBlur: ( size, sigma ) => {
		let kernel = MatrixUtils.gaussian( size, sigma )
		let preserveAlpha = false

		return {
			kernel, preserveAlpha
		}
	}
}

module.exports = ConvolutionFilters
