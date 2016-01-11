'use strict';
const _ = require( 'lodash' )

const MatrixUtils = {

	prettyPrint: ( matrix, padding ) => {

		padding = padding === undefined ? '  ' : padding

		let l = Math.max( ...matrix.map(
			( row ) => Math.max( ...row.map( ( cell ) => ( cell + '' ).length ) )
		) )

		let strMatrix = matrix.map( ( row ) => row.map( ( cell ) => {
			let s = cell + ''
			return ' '.repeat( l - s.length ) + s
		} ) )

		console.log( strMatrix.map( ( row ) => row.join( padding ) ).join( '\n' ) )
	},

	slowSum: ( matrix ) => {
		return _.sum( matrix.map( ( row ) => _.sum( row ) ) )
	},

	sum: ( matrix ) => {
		let l = matrix.length
		let m = 0

		let i = 0
		let j = 0

		let sum = 0

		for ( i = 0; i < l; i++ ) {
			m = matrix[ i ].length
			for ( j = 0; j < m; j++ ) {
				sum = sum + matrix[ i ][ j ]
			}
		}

		return sum
	},

	normalise: ( matrix ) => {
		let sum = MatrixUtils.sum( matrix )
		return matrix.map( ( row ) => row.map( ( cell ) => cell / sum ) )
	},

	randomMatrix: ( width, height ) => {
		return _.fill( Array( height ), 0 ).map( ( row ) => _.fill( Array( width ), 0 ).map( Math.random ) )
	},

	scale: ( matrix, scalar ) => {
		return matrix.map( ( row ) => row.map( ( cell ) => cell * scalar ) )
	}
}

module.exports = MatrixUtils
