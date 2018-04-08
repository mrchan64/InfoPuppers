var express = require('express'),
    path    = require('path'),
    ws = require('ws'),
    bp = require('body-parser'),
    stream = require('stream'),
    http    = require('http');

exports.startClient = function(port){
  var app = exports.app = express();

  app.use(bp.json());
  app.use(bp.urlencoded());
  app.use('/public', express.static(path.join(__dirname, '../public')));
  app.set('views', path.join(__dirname, '../public'));

  app.get('/', (req, res) =>{
    res.render(path.join(__dirname, '../public/index.jade'),{});
  });
  app.get('/about', (req, res) =>{
    res.render(path.join(__dirname, '../public/about.jade'),{});
  });

  app.post('/userdoginput', (req, res)=>{
    var body = req.body;
    if(!body.dogname || !body.contactip){
      console.log('missing info');
      res.end();
      return;
    }
    if(exports.newBlock){
      exports.newBlock(body.contactip, body.dogname);

    }
    res.end();
  })

  app.get('/profile', (req, res)=>{
    var dogname = req.query.dogname;
    var interm = new stream.PassThrough();
    var results = exports.searchStream(dogname);
    var data = null;
    results.on('data', (dat)=>{
      data = dat;
    })
    results.on('end', ()=>{
      console.log(data);
      res.render(path.join(__dirname, '../public/profile.jade'),{data: data})
    })
    interm.pipe(res);
  })

  app.post('/search', (req, res)=>{
    if(!req.body.fname || req.body.fname.length==0){
      res.end();
      return;
    }
    res.writeHead(302, {'location': '/profile?id='+req.body.fname})
    res.end();
  })

  var server = http.createServer(app);
  server.listen(port);

  exports.ws = new ws('ws://localhost:9000/getchain');
}

exports.startCentral = function(){
  console.log('Starting central')
  var app = exports.app = express();
  var server = http.createServer(app);
  server.listen(9000);

  exports.wss = new ws.Server({server: server, path: '/getchain'});

  exports.wssconns = [];
  exports.wss.on('connection', function(client) {
    var addr = client._socket.remoteAddress;
    console.warn('Connection from '+addr+ ' opened');
    exports.wssconns.push(client);
    client.on('message', function(msg){
      if(exports.wssconns.updateChain)exports.wssconns.updateChain(msg);
      else console.log('Missing updateChain');
    })
    client.on('close', function(){
      exports.wssconns.splice(exports.wssconns.indexOf(client), 1);
      console.warn('Connection from '+addr+ ' closed');
    })
  });

  exports.wssconns.write = function(data){
    exports.wssconns.forEach(function(conn){
      conn.send(data);
    })
  }
}