'use strict'

const R = 0,
	G = 1,
	B = 2,
	A = 3


const Filters = {
	invert: ( pixel ) => [
		255 - pixel[ R ],
		255 - pixel[ G ],
		255 - pixel[ B ],
		pixel[ A ]
	],

	invertAlpha: ( pixel ) => [
		pixel[ R ],
		pixel[ G ],
		pixel[ B ],
		255 - pixel[ A ]
	],

	greyscale: ( pixel ) => {
		let intensity = ( ( pixel[ R ] + pixel[ G ] + pixel[ B ] ) / 3 ) | 0
		return [ intensity, intensity, intensity, pixel[ A ] ]
	},

	visualGreyscale: ( pixel ) => {
		let intensity = 0.299 * pixel[ R ] + 0.587 * pixel[ G ] + 0.114 * pixel[ B ]
		return [ intensity, intensity, intensity, pixel[ A ] ]
	},

	lumaMap: ( pixel ) => [
		0,
		0,
		0, ( ( pixel[ R ] + pixel[ G ] + pixel[ B ] ) / 3 ) | 0
	],

	fill: ( r, g, b ) => ( pixel ) => [
		r,
		g,
		b,
		pixel[ A ]
	]
}

module.exports = Filters
