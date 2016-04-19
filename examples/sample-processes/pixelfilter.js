'use strict'

const _ = require( 'lodash' )
const Filters = require( './misc/filters' )
const Shufflers = require( '../../lib/shufflers' )
const Reducers = require( '../../lib/reducers' )

const parseFilters = ( filters ) => filters.map( ( filterName ) => {

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


const PixelFilterMapper = ( filters ) => ( pixels ) => {

	let w = pixels.width
	let h = pixels.height
	let buffer = pixels.getBuffer()
	let l = buffer.length

	if ( !_.isArray( filters ) ) {
		filters = [ filters ]
	}

	for ( let filter of filters ) {
		for ( let i = 0; i < l; i += 4 ) {
			let filtered = filter( buffer.slice( i, i + 4 ) )
			buffer[ i ] = filtered[ 0 ]
			buffer[ i + 1 ] = filtered[ 1 ]
			buffer[ i + 2 ] = filtered[ 2 ]
			buffer[ i + 3 ] = filtered[ 3 ]
		}
	}

	return pixels
}

module.exports = ( filters ) => ( {
	shuffler: Shufflers.imageChunks( 4 ),
	mapper: PixelFilterMapper( parseFilters( filters ) ),
	reducer: Reducers.imageChunks,
	encode: ( chunk ) => chunk.toBuffer(),
	decode: ( buffer ) => require( '../../lib/ImageBuffer' ).fromBuffer( buffer )
} )
