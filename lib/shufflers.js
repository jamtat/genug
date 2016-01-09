'use strict';
/*
	Shufflers are generator functions that split an input into chunks
*/
const Shufflers = {

	simpleChunks: ( numChunks ) => function*( array ) {

		let start = 0,
			l = array.length,
			step = l / numChunks,
			end = Math.round( step )

		for ( let i = 0; i < numChunks; i++ ) {
			yield array.slice( Math.round( i * step ), i == numChunks - 1 ? l : Math.round( ( i + 1 ) * step ) )
		}
	}
}

module.exports = Shufflers
