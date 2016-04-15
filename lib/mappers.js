'use strict'
/*
	Mappers take a chunk of input and produce a mapped output
*/

const _ = require( 'lodash' )

const Mappers = {

	convolutionFilter: ( kernel, preserveAlpha ) => ( pixels ) => {

		return PixelUtils.convolution( pixels, kernel, preserveAlpha )

	}
}

module.exports = Mappers
