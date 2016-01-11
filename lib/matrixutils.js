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

	fill: ( width, height, val ) => {
		return _.fill( Array( height ), val ).map( ( row ) => _.fill( Array( width ), val ) )
	},

	zeros: ( width, height ) => {
		return MatrixUtils.fill( width, height, 0 )
	},

	ones: ( width, height ) => {
		return MatrixUtils.fill( width, height, 1 )
	},

	scale: ( matrix, scalar ) => {
		return matrix.map( ( row ) => row.map( ( cell ) => cell * scalar ) )
	},

	map: ( matrix, fn ) => {
		return matrix.map( ( row ) => row.map( fn ) )
	},

	gaussian: ( size, sigma ) => {

		if ( size % 2 === 0 ) {
			throw 'Mask size must be an odd number'
		}

		let gaussianMask = MatrixUtils.zeros( size, size )

		const factor = 1 / ( sigma * Math.sqrt( 2 * Math.PI ) )
		const otherFactor = 2 * sigma * sigma

		let g = ( x ) => factor * Math.exp( -( x * x ) / otherFactor )

		let d = ( x, y ) => Math.sqrt( x * x + y * y )

		let halfSize = size / 2 | 0

		let i = -halfSize
		let j = -halfSize

		for ( i = -halfSize; i <= halfSize; i++ ) {
			for ( j = -halfSize; j <= halfSize; j++ ) {
				gaussianMask[ j + halfSize ][ i + halfSize ] = g( d( i, j ) )
			}
		}

		return MatrixUtils.normalise( gaussianMask )

	},

	convolution: ( matrix, kernel ) => {
		let kernelHeight = kernel.length
		let kernelWidth = kernel[ 0 ].length

		let x = 0
		let y = 0

		let kx = 0
		let ky = 0

		let h = matrix.length - ( kernelHeight - 1 )
		let w = matrix[ 0 ].length - ( kernelWidth - 1 )

		let result = MatrixUtils.zeros( w, h )

		let sum = 0

		for ( y = 0; y < h; y++ ) {
			for ( x = 0; x < w; x++ ) {

				sum = 0

				for ( ky = 0; ky < kernelHeight; ky++ ) {
					for ( kx = 0; kx < kernelWidth; kx++ ) {

						sum = sum + ( kernel[ ky ][ kx ] * matrix[ y + ky ][ x + kx ] )

					}
				}

				result[ y ][ x ] = sum

			}
		}

		return result
	},

	MATRICES: {
		laplacian: [
			[ 0, -1, 0 ],
			[ -1, 4, -1 ],
			[ 0, -1, 0 ]
		]
	}
}

module.exports = MatrixUtils
