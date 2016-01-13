'use strict';

const _ = require( 'lodash' )

const LENGTH_BYTES = 4

const MessageUtils = {

	createDataBuffer: ( data ) => {
		if ( _.isPlainObject( data ) ) {
			data = JSON.stringify( data )
		}

		let dataLength = data.length

		let dataBuffer = new Buffer( LENGTH_BYTES + dataLength )

		dataBuffer.writeUInt32BE( dataLength, 0 )

		if ( _.isString( data ) ) {
			dataBuffer.write( data, LENGTH_BYTES )
		} else {
			data.copy( dataBuffer, LENGTH_BYTES )
		}

		return dataBuffer
	},

	writeData: ( data, pipe ) => {
		let dataBuffer = MessageUtils.createDataBuffer( data )

		pipe.write( dataBuffer )
	},

	handleIncomingMessages: ( pipe, callback ) => {

		let chunks
		let dataLength
		let messageCount = 0
		let messageId

		let resetMessageHandlerState = () => {
			chunks = new Buffer( 0 )
			dataLength = 0
			messageId = Math.random() * 1000 | 0
		}

		resetMessageHandlerState()

		let handleChunk = ( chunk ) => {
			if ( dataLength === 0 ) {
				dataLength = chunk.readUInt32BE( 0 )
				let rest = chunk.slice( LENGTH_BYTES )

				if ( rest.length > dataLength ) {
					let message = rest.slice( 0, dataLength )
					callback( message )
					messageCount++

					let tempLength = dataLength
					resetMessageHandlerState()
					handleChunk( rest.slice( tempLength ) )
				} else if ( rest.length === dataLength ) {
					let message = rest
					callback( message )
					messageCount++
					resetMessageHandlerState()
				} else {
					chunks = Buffer.concat( [ chunks, rest ] )
				}

			} else {
				if ( chunk.length + chunks.length > dataLength ) {
					let rest = chunk.slice( dataLength - chunks.length )
					let message = Buffer.concat( [ chunks, chunk.slice( 0, dataLength - chunks.length ) ] )
					callback( message )
					messageCount++
					resetMessageHandlerState()
					handleChunk( rest )
				} else if ( chunk.length + chunks.length === dataLength ) {
					let message = Buffer.concat( [ chunks, chunk.slice( 0, dataLength - chunks.length ) ] )
					callback( message )
					messageCount++
					resetMessageHandlerState()
				} else {
					chunks = Buffer.concat( [ chunks, chunk ] )
				}
			}
		}

		pipe.on( 'data', handleChunk )

	}
}

module.exports = MessageUtils
