const path = require('path')
const webpack = require('webpack')
const config = require('./gulpfile.config.js')

module.exports = {
	entry: config.entry,
	output: {
		filename: '[name].js'
	},
	module: {
		rules: [
			{
				test: /\.js$/,
				exclude: /node_modules/,
				use: {
					loader: 'babel-loader'
				}
			}
		]
	},
	// devtool: 'source-map'
}