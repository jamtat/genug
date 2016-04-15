'use strict'
/*
	The processes are effectively pipelines that describe how to perform an operation on data

	Each process has a shuffler, mapper and reducer.

	The input is split with a shuffler, operations performed with a mapper and reassembled with a reducer
*/

const Processes = {
	pixelFilter: require( './processes/pixelfilter' ),
	convolutionFilter: require( './processes/convolutionfilter' ),
	wordCount: require( './processes/wordcount' )
}

module.exports = Processes
