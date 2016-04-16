'use strict'

const _ = require( 'lodash' )

const LENGTH_BYTES = 4

let isNode = typeof window === 'undefined'


const MessageUtils = {

	createDataBuffer: ( data ) => {
		if ( _.isPlainObject( data ) ) {
			data = JSON.stringify( data )
		}

		if ( _.isString( data ) ) {
			data = new Buffer( data )
		}

		if ( !data.length ) {
			throw 'Data object has no length property'
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

	writeData: ( data, channel ) => {
		if ( isNode ) {
			MessageUtils.writeDataPipe( data, channel )
		} else {
			MessageUtils.writeDataWebsocket( data, channel )
		}
	},

	writeDataPipe: ( data, pipe ) => {
		let dataBuffer = MessageUtils.createDataBuffer( data )

		let i = 0
		let l = dataBuffer.length
		const step = 5000
		let n = 0
		for ( i = 0; i < l; i += step ) {
			pipe.write( dataBuffer.slice( i, Math.min( l, i + step ) ) )
		}
	},

	writeDataWebsocket: ( data, socket ) => {
		let dataBuffer = MessageUtils.createDataBuffer( data )

		socket[ _.isFunction( socket.sendBytes ) ? 'sendBytes' : 'send' ]( dataBuffer )
	},

	handleIncomingMessages: ( channel, callback ) => {
		if ( isNode ) {
			MessageUtils.handleIncomingMessagesPipe( channel, callback )
		} else {
			MessageUtils.handleIncomingMessagesWebsocket( channel, callback )
		}
	},

	handleIncomingMessagesPipe: ( pipe, callback ) => {

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

	},

	handleIncomingMessagesWebsocket: ( socket, callback ) => {

		if ( _.isFunction( socket.on ) ) {
			let handleChunk = ( chunk ) => {
				if ( chunk.type === 'binary' ) {
					callback( chunk.binaryData.slice( LENGTH_BYTES ) )
				} else {
					callback( chunk.utf8Data.slice( LENGTH_BYTES ) )
				}
			}

			socket.on( 'message', handleChunk )
		} else {
			// Client side listening
			socket.binaryType = 'arraybuffer'
			socket.onmessage = ( e ) => {

				if ( e.data instanceof Blob ) {
					let buf
					let fileReader = new FileReader()
					fileReader.onload = function() {
						buf = new Buffer( this.result )
						callback( buf.slice( LENGTH_BYTES ) )
					}
					fileReader.readAsArrayBuffer( e.data )
				} else {
					callback( new Buffer( e.data ).slice( LENGTH_BYTES ) )
				}
			}
		}

	}
}

module.exports = MessageUtils
