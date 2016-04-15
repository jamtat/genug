'use strict'
/*
	The processes are effectively pipelines that describe how to perform an operation on data

	Each process has a shuffler, mapper and reducer.

	The input is split with a shuffler, operations performed with a mapper and reassembled with a reducer
*/

const Shufflers = require( './shufflers' )
const Mappers = require( './mappers' )
const Reducers = require( './reducers' )
const ConvolutionFilters = require( './processes/misc/convolutionfilters' )

const NUM_WORKERS = Math.min( require( 'os' ).cpus().length, 4 )

const Processes = {
	pixelFilter: require( './processes/pixelfilter' ),

	convolutionFilter: ( args ) => {

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
			preProcessor: ( pixels ) => require( './pixelutils' ).repeatEdges( pixels, filterSize ),
			shuffler: Shufflers.overlappingImageChunks( NUM_WORKERS, filterSize ),
			mapper: Mappers.convolutionFilter( kernel, preserveAlpha ),
			reducer: Reducers.imageChunks,
			encode: ( chunk ) => chunk.toBuffer(),
			decode: ( buffer ) => require( './ImageBuffer' ).fromBuffer( buffer )
		}

	},

	wordCount: require( './processes/wordcount' )


}

module.exports = Processes
