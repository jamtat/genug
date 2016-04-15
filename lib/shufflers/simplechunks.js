'use strict'

module.exports = ( numChunks ) => function*( array ) {

	let start = 0,
		l = array.length,
		step = l / numChunks

	for ( let i = 0; i < numChunks; i++ ) {
		yield array.slice( Math.round( i * step ), i == numChunks - 1 ? l : Math.round( ( i + 1 ) * step ) )
	}
}
