require('babel-register');

console.log('Please, wait while the sources are transpiled');

const serverApp = require('./server');

serverApp.listen('8081', function() {
  console.log('Server started on port 8081');
});
