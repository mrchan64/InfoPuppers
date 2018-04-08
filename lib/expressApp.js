var express = require('express'),
    path    = require('path'),
    http    = require('http');

var app = exports.app = express();
app.use('/public', express.static(path.join(__dirname, '../public')));
app.set('views', path.join(__dirname, '../public'));

app.get('/', (req, res) =>{
  res.render(path.join(__dirname, '../public/index.jade'),{});
});

var server = http.createServer(app);

server.listen(9000);