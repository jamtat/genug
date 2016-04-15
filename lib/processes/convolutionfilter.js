'use strict'

const ConvolutionFilters = require( './misc/convolutionfilters' )
const Shufflers = require( '../shufflers' )
const Reducers = require( '../reducers' )
const PixelUtils = require( '../utils/pixelutils' )

const ConvolutionFilterMapper = ( kernel, preserveAlpha ) => ( pixels ) => {
	return PixelUtils.convolution( pixels, kernel, preserveAlpha )
}

module.exports = ( args ) => {

	let filterName = args[ 0 ]
	let filterSize = parseInt( args[ 1 ] )
	let filterArgs = JSON.parse( `[${args.slice( 2 ).join(', ')}]` )

	if ( !filterName ) {
		throw 'No filter given'
	}

	if ( !filterSize || isNaN( filterSize ) || filterSize < 0 ) {
		throw 'No size given'
	}

	filterArgs.unshift( 2 * filterSize + 1 )

	if ( !ConvolutionFilters[ filterName ] ) {
		throw `"${filterName}" is not a valid convolution filter`
	}

	let filter = ConvolutionFilters[ filterName ]

	if ( filterArgs.length !== filter.length ) {
		throw `Invalid number of arguments supplied to filter, got ${filterArgs.length}, expected ${filter.length}`
	}

	let resultingFilter = filter( ...filterArgs )
	let kernel = resultingFilter.kernel
	let preserveAlpha = resultingFilter.preserveAlpha

	return {
		preProcessor: ( pixels ) => require( '../utils/pixelutils' ).repeatEdges( pixels, filterSize ),
		shuffler: Shufflers.overlappingImageChunks( 4, filterSize ),
		mapper: ConvolutionFilterMapper( kernel, preserveAlpha ),
		reducer: Reducers.imageChunks,
		encode: ( chunk ) => chunk.toBuffer(),
		decode: ( buffer ) => require( '../ImageBuffer' ).fromBuffer( buffer )
	}
}
