'use strict'

/*
	An example showing how to perform a local multicore computation with genug.

	In this particular instance we use the word count example process to generate
	a dictionary of word counts on random sample of lorem ipsum text
*/


const http = require( 'http' )

const genug = require( '../genug' )

let text = ''

http.get( 'http://loripsum.net/api/100/long', ( res ) => {

	res.setEncoding( 'utf8' )

	res.on( 'data', ( chunk ) => {
		text += chunk
	} )

	res.on( 'end', doWordCount )

} ).on( 'error', ( e ) => {
	console.error( `Got error: ${e.message}` );
} )

const doWordCount = () => {

	// Pre process the text to remove HTML tags.
	text = text.replace( /<.*?>/g, '' )

	// Get the path to the process file
	let processFile = require.resolve( './sample-processes/wordcount.js' )

	genug.parallel( text, processFile, null, null, ( err, result ) => {
		if ( err ) {
			console.error( err )
			return
		}

		// Display the top 20 words that are longer than 5 characters

		let mostFrequentWords = Object.keys( result )
			.filter( ( word ) => word.length > 5 )
			.map( ( word ) => [ word, result[ word ] ] )
			.sort( ( a, b ) => b[ 1 ] - a[ 1 ] )
			.slice( 0, 20 )

		let pad = ( s, n ) => {
			while ( s.length < n ) {
				s += ' '
			}
			return s
		}


		mostFrequentWords.forEach( ( pair ) => console.log( `${pad(pair[0],14)}   ${pair[1]}` ) )
	} )

}
