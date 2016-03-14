const express = require('express');
const webpack = require('webpack');
const webpackDevMiddleware = require('webpack-dev-middleware');
const webpackConfig = require('./webpack.config');

const app = express();

const validBundles = [
  '/counter'
];

const homeHtml = `
  <!DOCTYPE html>
  <html>
  <body>
    <p><a href="/counter">Counter</a></p>
  </body>
  </html>`;

function exampleHtml(bundleName) {
  return `
    <!DOCTYPE html>
    <html>
    <body>
      <p><a href="/">Home</a></p>
      <main></main>
      <script src="${bundleName}.js"></script>
    </body>
    </html>`;
};

app.use(webpackDevMiddleware(webpack(webpackConfig), {
  contentBase: '.',
  stats: { colors: true }
}));

app.get('*', function (req, res) {
  if(validBundles.indexOf(req.path) !== -1) {
    return res.send(exampleHtml(req.path));
  }

  return res.send(homeHtml);
});

app.listen(8080, function () {
  console.log('examples served from http://localhost:8080');
});
