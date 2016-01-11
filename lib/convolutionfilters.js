'use strict';

const MatrixUtils = require( './matrixutils' )

const ConvolutionFilters = {
	boxBlur: ( size ) => {
		let kernel = MatrixUtils.normalise( MatrixUtils.ones( size, size ) )
		let preserveAlpha = false

		return {
			kernel, preserveAlpha
		}
	}
}

module.exports = ConvolutionFilters
