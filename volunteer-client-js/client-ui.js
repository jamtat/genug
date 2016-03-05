'use strict'

const _ = require( 'lodash' )
const q = ( s ) => document.querySelectorAll( s )[ 0 ]

const UI = {
	working: false,

	init: () => {
		UI.root = document.body
		UI.header = q( 'header' )
		UI.console = q( 'code' )
		UI.button = q( '#wurkwurkwurk' )

		window.addEventListener( 'resize', UI.onResize )
		UI.onResize()
	},

	onResize: ( e ) => {
		UI.header.style.height = `${window.innerHeight}px`
	},

	toggleWorking: () => {
		UI.working = !UI.working
		UI.root.className = UI.working ? 'wurking' : 'wurked'
		UI.button.innerHTML = UI.working ? 'Working' : 'Get Work'
	},

	log: ( o ) => {
		console.log( o )
		UI.console.innerHTML += `<div>${_.isString( o ) ? o : JSON.stringify(o,null,'\t')}</div>\n`
		UI.console.scrollTop = UI.console.scrollHeight - UI.console.offsetHeight
	},

	displayError: () => {
		UI.root.classList.add( 'error' )
		UI.button.innerHTML = 'UH OH'
	},

	onButtonClick: ( callback ) => UI.button.addEventListener( 'click', callback )
}

UI.init()

module.exports = UI
