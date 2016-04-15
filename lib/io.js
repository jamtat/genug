'use strict'


const _ = require( 'lodash' )
const ImageIO = require( './io/imageio' )
const TextIO = require( './io/textio' )
const FileIO = require( './io/fileio' )

const AutomaticIO = {
	get: ( filename, callback ) => {
		let parts = filename.split( '.' )

		if ( parts.length === 1 ) {
			FileIO.getFile( filename, callback )
		} else {
			let extension = parts.pop()

			if ( _.includes( ImageIO.extensions, extension ) ) {
				ImageIO.getPixels( filename, callback )
			} else if ( extension === 'json' ) {
				TextIO.getJSON( filename, callback )
			} else {
				TextIO.getText( filename, callback )
			}
		}
	},

	save: ( filename, data, callback ) => {
		if ( _.isString( data ) ) {
			TextIO.saveText( filename, data, callback )
		} else if ( _.isPlainObject( data ) ) {
			TextIO.saveJSON( filename, data, callback )
		} else if ( data.width && data.height ) {
			ImageIO.savePixels( filename, data, callback )
		} else {
			FileIO.saveFile( filename, data, callback )
		}
	}
}


module.exports = {
	AutomaticIO, ImageIO, TextIO, FileIO
}
