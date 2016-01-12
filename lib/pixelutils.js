'use strict';

const getPixels = require( 'get-pixels' )
const savePixels = require( 'save-pixels' )
const ndarray = require( 'ndarray' )
const _ = require( 'lodash' )
const fs = require( 'fs' )
const ImageBuffer = require( './ImageBuffer' )
const MatrixUtils = require( './matrixutils' )

const R = 0,
	G = 1,
	B = 2,
	A = 3

const PixelUtils = {

	getPixels: ( filename, callback ) => {

		getPixels( filename, ( err, ndPixels ) => {
			if ( err ) callback( err, null );

			let shape = ndPixels.shape

			let w = shape[ 0 ]
			let h = shape[ 1 ]
			let channels = shape[ 2 ]

			let pixels = new ImageBuffer( w, h )

			for ( let x = 0; x < w; x++ ) {
				for ( let y = 0; y < h; y++ ) {
					pixels.setPixel( x, y, [
						ndPixels.get( x, y, R ),
						ndPixels.get( x, y, G ),
						ndPixels.get( x, y, B ),
						channels === 4 ? ndPixels.get( x, y, A ) : 255
					] )
				}
			}

			callback( err, pixels )
		} )
	},

	savePixels: ( filename, pixels ) => {

		let w = pixels.width
		let h = pixels.height
		let ndOut = ndarray( pixels.getBuffer(), [ w, h, 4 ], [ 4, w * 4, 1 ] )
		let outStream = fs.createWriteStream( filename )

		savePixels( ndOut, 'png' ).pipe( outStream )
	},

	repeatEdges: ( pixels, distance ) => {

		let bound = ( x, min, max ) => {
			return Math.max( min, Math.min( x, max ) )
		}

		let w = pixels.width
		let h = pixels.height

		let rw = w + 2 * distance
		let rh = h + 2 * distance

		let repeatedEdges = new ImageBuffer( w + 2 * distance, h + 2 * distance )

		let i = 0,
			j = 0

		for ( let x = 0; x < rw; x++ ) {
			i = bound( x - distance, 0, w - 1 )
			for ( let y = 0; y < rh; y++ ) {
				j = bound( y - distance, 0, h - 1 )
				repeatedEdges.setPixel( x, y, pixels.getPixel( i, j ) )
			}
		}

		return repeatedEdges
	},

	mirrorEdges: ( pixels, distance ) => {
		let flip = ( x, min, max ) => {
			return x < min ? min + ( min - x ) : ( x > max ? max + ( max - x ) : x )
		}

		let w = pixels.width
		let h = pixels.height

		let rw = w + 2 * distance
		let rh = h + 2 * distance

		let repeatedEdges = new ImageBuffer( w + 2 * distance, h + 2 * distance )

		let i = 0,
			j = 0

		for ( let x = 0; x < rw; x++ ) {
			i = flip( x - distance, 0, w - 1 )
			for ( let y = 0; y < rh; y++ ) {
				j = flip( y - distance, 0, h - 1 )
				repeatedEdges.setPixel( x, y, pixels.getPixel( i, j ) )
			}
		}

		return repeatedEdges
	},

	convolution: ( pixels, kernel, preserveAlpha ) => {

		let bound = ( x, min, max ) => {
			return Math.max( min, Math.min( x, max ) )
		}

		preserveAlpha = !!preserveAlpha

		let kernelHeight = kernel.length
		let kernelWidth = kernel[ 0 ].length

		if ( kernelWidth % 2 === 0 || kernelHeight % 2 === 0 ) {
			throw 'Kernel size must be an odd number'
		}

		let x = 0
		let y = 0

		let kx = 0
		let ky = 0

		let h = pixels.height - ( kernelHeight - 1 )
		let w = pixels.width - ( kernelWidth - 1 )

		let resultImage = new ImageBuffer( w, h )
		let resultBuffer = resultImage.getBuffer()

		let sourceBuffer = pixels.getBuffer()
		let sourceWidth = pixels.width

		let sumR = 0,
			sumG = 0,
			sumB = 0,
			sumA = 0

		let offset = 0

		let newPixel = [ 0, 0, 0, 0 ]

		let centreX = Math.floor( kernelWidth / 2 )
		let centreY = Math.floor( kernelHeight / 2 )

		for ( y = 0; y < h; y++ ) {
			for ( x = 0; x < w; x++ ) {

				sumR = 0
				sumG = 0
				sumB = 0
				sumA = 0

				for ( ky = 0; ky < kernelHeight; ky++ ) {
					for ( kx = 0; kx < kernelWidth; kx++ ) {

						offset = ( ( y + ky ) * sourceWidth + ( x + kx ) ) * 4

						sumR += kernel[ ky ][ kx ] * sourceBuffer[ offset + R ]
						sumG += kernel[ ky ][ kx ] * sourceBuffer[ offset + G ]
						sumB += kernel[ ky ][ kx ] * sourceBuffer[ offset + B ]
						sumA += kernel[ ky ][ kx ] * sourceBuffer[ offset + A ]

					}
				}

				resultImage.setPixel( x, y, [
					bound( sumR, 0, 255 ),
					bound( sumG, 0, 255 ),
					bound( sumB, 0, 255 ),
					preserveAlpha ? sourceBuffer[ ( ( y + centreY ) * sourceWidth + ( x + centreX ) ) * 4 + A ] : bound( sumA, 0,
						255 )
				] )

			}
		}

		return resultImage

	},

	crop: ( pixels, xStart, yStart, width, height ) => {

		let cropped = new ImageBuffer( width, height )

		let x = 0,
			y = 0

		for ( x = 0; x < width; x++ ) {
			for ( y = 0; y < height; y++ ) {
				let source = pixels.getPixel( xStart + x, yStart + y )
				cropped.setPixel( x, y, source )
			}
		}

		return cropped

	}

}

module.exports = PixelUtils
