'use strict';

const R = 0,
	G = 1,
	B = 2,
	A = 3

class ImageBuffer {

	constructor( w, h, buffer ) {
		this.width = w
		this.height = h
		this.channels = 4

		this._buffer = buffer ? buffer : new Buffer( w * h * this.channels )
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
		let offset = ( y * this.width + x ) * this.channels
		this._buffer[ offset + R ] = pixel[ R ]
		this._buffer[ offset + G ] = pixel[ G ]
		this._buffer[ offset + B ] = pixel[ B ]
		this._buffer[ offset + A ] = pixel[ A ]
	}

	getPixel( x, y ) {
		let offset = ( y * this.width + x ) * this.channels
		return this._buffer.slice( offset, offset + this.channels )
	}

	toBuffer() {
		let dimensionsBuffer = new Buffer( 6 )
		dimensionsBuffer.writeUInt16BE( this.width, 0 )
		dimensionsBuffer.writeUInt16BE( this.height, 2 )
		dimensionsBuffer.writeUInt16BE( this.channels, 4 )

		return Buffer.concat( [ dimensionsBuffer, this._buffer ] )
	}

	static fromBuffer( buffer ) {
		let w = buffer.readUInt16BE( 0 )
		let h = buffer.readUInt16BE( 2 )
		let channels = buffer.readUInt16BE( 4 )
		let imageBuffer = buffer.slice( 6 )
		return new ImageBuffer( w, h, imageBuffer )
	}

}

module.exports = ImageBuffer
