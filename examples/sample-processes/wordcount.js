'use strict'

const simpleChunks = require( '../../lib/shufflers/simplechunks' )

const linebreakRegex = /\r\n?|\n/g

const shuffler = ( numChunks ) => function*( str ) {
	let lines = str.split( linebreakRegex )

	for ( let chunk of simpleChunks( numChunks )( lines ) ) {
		yield chunk.join( ' ' )
	}
}

const mapper = ( chunk ) => {
	let words = chunk.toLowerCase()
		.split( /[^\-\w&(\w.\w)+]/g ) // Split on non word like characters
		.filter( ( s ) => !!s )

	let count = words.reduce( ( acc, word ) => {
		if ( !acc[ word ] ) {
			acc[ word ] = 1
		} else {
			acc[ word ] += 1
		}
		return acc
	}, {} )

	return JSON.stringify( count )
}

const reducer = ( counts ) => counts.map( JSON.parse ).reduce( ( a, b ) => {

	Object.keys( b ).map( ( word ) => {
		if ( !a[ word ] ) {
			a[ word ] = b[ word ]
		} else {
			a[ word ] += b[ word ]
		}
	} )

	return a
} )

const encode = ( str ) => new Buffer( str )
const decode = ( buff ) => buff.toString( 'utf8' )

module.exports = () => ( {
	shuffler: shuffler( 4 ),
	mapper,
	reducer,
	encode,
	decode
} )
