'use strict';
/*
	Reducers reassemble the mapped inputs into a final result
	They recieve the inputs in the order that they were sent out
*/

const Reducers = {
	simpleChunks: function( results ) {
		return [].concat( ...results )
	}
}

module.exports = Reducers
