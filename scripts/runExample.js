var path = require('path')
var express = require('express')
var webpack = require('webpack')
var webpackMiddleware = require('webpack-dev-middleware')
var HtmlPlugin = require('html-webpack-plugin')
var open = require('open')

var app = express();
var middleware = webpackMiddleware(webpack({
  entry: path.resolve(__dirname, '../example/index.tsx'),

  output: {
    filename: 'bundle.js',
  },

  devtool: 'source-map',

  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.json']
  },

  module: {
    rules: [
      { test: /\.tsx?$/, loader: 'awesome-typescript-loader' },
      { enforce: 'pre', test: /\.js$/, loader: 'source-map-loader' }
    ]
  },

  plugins: [
    new HtmlPlugin({ inject: true })
  ]
}), {
	publicPath: "/",
	index: "index.html"
});

var opened = false

middleware.waitUntilValid(function () {
  if (opened) return;
  opened = true;
  open('http://localhost:8080');
})

app.use(middleware);

app.listen('8080');
