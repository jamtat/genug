'use strict'
/*
	Reducers reassemble the mapped inputs into a final result
	They recieve the inputs in the order that they were sent out
*/

const Reducers = {
	simpleChunks: require( './reducers/simplechunks' ),
	imageChunks: require( './reducers/imagechunks' )
}

module.exports = Reducers
