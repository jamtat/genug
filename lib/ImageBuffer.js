'use strict';

const R = 0,
	G = 1,
	B = 2,
	A = 3

class ImageBuffer {

	constructor( w, h, buffer ) {
		this.width = w
		this.height = h

		this._buffer = buffer ? buffer : new Buffer( w * h * 4 )
	}

	setBuffer( buff ) {
		this._buffer = buff
	}

	getBuffer() {
		return this._buffer
	}

	setWidth( w ) {
		this.width = w
	}

	setHeight( h ) {
		this.height = h
	}

	setPixel( x, y, pixel ) {
		let offset = ( y * this.width + x ) * 4
		this._buffer[ offset + R ] = pixel[ R ]
		this._buffer[ offset + G ] = pixel[ G ]
		this._buffer[ offset + B ] = pixel[ B ]
		this._buffer[ offset + A ] = pixel[ A ]
	}

	getPixel( x, y ) {
		let offset = ( y * this.width + x ) * 4
		return this._buffer.slice( offset, offset + 4 )
	}

}

module.exports = ImageBuffer
