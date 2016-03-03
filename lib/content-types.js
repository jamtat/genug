'use strict'

const types = {
	'html': 'text/html',
	'css': 'text/css',
	'js': 'text/javascript',
	'txt': 'text/plain',
	'tag': 'text/html',
	'ico': 'image/x-icon',
	'png': 'image/png',
	'jpg': 'image/jpeg',
	'svg': 'image/svg+xml'
}

module.exports = ( filename ) => {
	let extension = filename.split( '.' ).pop()

	return types.hasOwnProperty( extension ) ? types[ extension ] : types.txt
}
