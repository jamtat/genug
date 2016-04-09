'use strict'

const fs = require( 'fs' )

const getFile = ( filename, options, callback ) => {
	if ( !callback ) {
		callback = options
		options = {}
	}

	fs.readFile( filename, options, callback )
}

const saveFile = ( filename, data, options, callback ) => {
	if ( !callback ) {
		callback = options
		options = {}
	}

	fs.writeFile( filename, data, options, callback )
}

module.exports = {
	getFile, saveFile
}
