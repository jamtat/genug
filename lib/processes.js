'use strict';
/*
	The processes are effectively pipelines that describe how to perform an operation on data

	Each process has a shuffler, mapper and reducer.

	The input is split with a shuffler, operations performed with a mapper and reassembled with a reducer
*/

const Shufflers = require( './shufflers' )
const Mappers = require( './mappers' )
const Reducers = require( './reducers' )
const Filters = require( './filters' )
const _ = require( 'lodash' )

let parseFilters = ( filters ) => filters.map( ( filterName ) => {

	if ( _.isFunction( filterName ) ) {
		return filterName
	}

	if ( Filters[ filterName ] ) {
		return Filters[ filterName ]
	}

	if ( _.isString( filterName ) ) {
		//Split about a (
		let split = filterName.split( '(' )

		if ( Filters[ split[ 0 ] ] ) {
			//Parse the arguments
			let fn = Filters[ split[ 0 ] ]
			let args = JSON.parse(
				`[${split[1].replace(/\)$/,'')}]`
			)

			return fn( ...args )
		} else {
			throw `"${filterName}" is not a valid pixel filter`
		}
	}
} )

const Processes = {
	pixelFilter: ( filters ) => ( {
		shuffler: Shufflers.imageChunks( require( 'os' ).cpus().length ),
		mapper: Mappers.pixelFilter( parseFilters( filters ) ),
		reducer: Reducers.imageChunks,
		encode: ( chunk ) => chunk.toBuffer(),
		decode: ( buffer ) => require( './ImageBuffer' ).fromBuffer( buffer )
	} )
}

module.exports = Processes
