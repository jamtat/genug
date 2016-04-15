'use strict'
/*
	Shufflers are generator functions that split an input into chunks
*/

const Shufflers = {

	simpleChunks: require( './shufflers/simplechunks' ),

	imageChunks: require( './shufflers/imagechunks' ),

	overlappingImageChunks: require( './shufflers/overlappingimagechunks' )
}

module.exports = Shufflers
