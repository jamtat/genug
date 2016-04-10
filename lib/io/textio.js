'use strict'

const fs = require( 'fs' )
const _ = require( 'lodash' )
const FileIO = require( './fileio' )

const getText = ( filename, options, callback ) => {
	if ( !callback ) {
		callback = options
		options = {}
	}

	if ( !options.encoding ) {
		options.encoding = 'utf8'
	}

	FileIO.getFile( filename, options, callback )
}

const saveText = ( filename, options, txt, callback ) => {
	if ( _.isFunction( txt ) ) {
		callback = txt
	}

	if ( _.isString( options ) ) {
		txt = options
		options = {}
	}

	if ( !options.encoding ) {
		options.encoding = 'utf8'
	}

	if ( !callback ) {
		callback = _.noop
	}

	FileIO.saveFile( filename, txt, options, callback )
}

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

const saveJSON = ( filename, obj, callback ) => {

	if ( !callback ) {
		callback = _.noop
	}

	let txt

	try {
		txt = JSON.stringify( obj, null, '\t' )
	} catch ( err ) {
		callback( err )
	}

	saveText( filename, txt, callback )
}

module.exports = {
	getText, saveText, getJSON, saveJSON
}
