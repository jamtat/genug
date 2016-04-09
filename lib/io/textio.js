'use strict'

const fs = require( 'fs' )

const _getFile = ( filename, options, callback ) => {
	if ( !callback ) {
		callback = options
		options = {}
	}

	fs.readFile( filename, options, callback )
}

const getText = ( filename, options, callback ) => {
	if ( !callback ) {
		callback = options
		options = {}
	}

	if ( !options.encoding ) {
		options.encoding = 'utf8'
	}

	_getFile( filename, options, callback )
}

const saveText = ( filename, options, txt ) => {}

const getJSON = ( filename, callback ) => getText( filename, ( err, txt ) => {

	if ( err ) {
		callback( err, null )
		return
	}

	let result = null

	try {
		result = JSON.parse( txt )
	} catch ( err ) {
		callback( err, null )
	}

	callback( null, result )
} )

const saveJSON = ( filename, obj ) => {}

module.exports = {
	getText, saveText, getJSON, saveJSON
}
