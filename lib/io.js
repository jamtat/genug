'use strict'


const _ = require( 'lodash' )
const ImageIO = require( './io/imageio' )
const TextIO = require( './io/textio' )
const FileIO = require( './io/fileio' )

const AutomaticIO = {
	get: ( filename, callback ) => {
		let parts = filename.split( '.' )

		if ( parts.length > 1 ) {
			FileIO.getFile( filename, callback )
		} else {
			let extension = parts.pop()

			if ( _.contains( ImageIO.extensions, extension ) ) {
				ImageIO.getPixels( filename, callback )
			} else if ( extension === 'json' ) {
				TextIO.getJSON( filename, callback )
			} else {
				TextIO.getText( filename, callback )
			}
		}
	}
}


module.exports = {
	AutomaticIO, ImageIO, TextIO, FileIO
}
