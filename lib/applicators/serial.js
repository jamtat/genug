'use strict'

module.exports = ( data, processFile, processArgs, applicatorArgs, callback ) => {

	let desiredProcess = require( processFile )( processArgs )

	let shuffler = desiredProcess.shuffler
	let mapper = desiredProcess.mapper
	let reducer = desiredProcess.reducer
	let preProcessor = desiredProcess.preProcessor ? desiredProcess.preProcessor : ( x ) => x

	let chunked = [ ...shuffler( preProcessor( data ) ) ]

	let mapped = chunked.map( mapper )

	let reduced = reducer( mapped )

	callback( null, reduced )
}
