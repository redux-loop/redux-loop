const webpack = require('webpack');
const path = require('path');
const HtmlPlugin = require('html-webpack-plugin');

module.exports = {

  target: 'web',

  devtool: 'inline-source-map',

  entry: {
    counter: path.join(__dirname, 'counter/index.js')
  },

  output: {
    path: path.join(__dirname, 'tmp'),
    filename: '[name].js',
    publicPath: '',
  },

  resolve: {
    alias: {
      'redux-loop': path.resolve(__dirname, '../modules/index.js')
    }
  },

  module: {
    loaders: [
      {
        exclude: /node_modules/,
        test: /\.js$/,
        loader: 'babel'
      }
    ]
  },

  plugins: [
    new webpack.NoErrorsPlugin()
  ]
};
