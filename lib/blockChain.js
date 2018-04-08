var crypto = require('crypto');

//blockchain contains information of who has what piece of information
var currentchain = [];
var ws = null;

exports.hookws = function(websocket){
  ws = websocket;
  ws.on('message', updateChain)
}

exports.hookwss = function(wssconns){
  wssconns.updateChain = function(data){
    updateChain(data);
    wssconns.write(chainToString())
  }
}

exports.getChain = function(){
  return currentchain;
}

exports.createNewBlock = function(contactip, dogname){
  var previousHash = currentchain.length == 0 ? "" : currentchain[currentchain.length-1].hash;
  var block = new Block(previousHash, findLastIndex(dogname), contactip, dogname, new Date().getTime());
  currentchain.push(block);
}

exports.writeBlockUpdates = function(){
  if(ws)ws.send(chainToString());
  else console.log("Sorry a ws has not been established yet")
}

function updateChain(data){
  console.log('Received new chain!')
  data = JSON.parse(data);
  data = data.data;
  if(data.length>currentchain.length){
    for(var i = currentchain.length; i<data.length; i++){
      var blockdata = data[i];
      var block = new Block(
        blockdata.previousHash, 
        blockdata.previousIndex, 
        blockdata.contactip,
        blockdata.dogname,
        blockdata.time,
        blockdata.hash,
        blockdata.nonce
      )
      currentchain.push(block);
    }
    console.log("Chain length now "+currentchain.length);
  }
}

var chainToString = exports.chainToString = function(){
  var dataobj = [];
  currentchain.forEach((block)=>{
    dataobj.push({
      hash: block.hash,
      previousHash: block.previousHash,
      previousSubHash: block.previousSubHash,
      previousIndex: block.previousIndex,
      contactip: block.contactip,
      dogname: block.dogname,
      time: block.time,
      nonce: block.nonce
    })
  })
  return JSON.stringify({data:dataobj});
}

function findLastIndex(dogname){
  for(var i = currentchain.length-1; i>=0; i--){
    console.log(currentchain[i].dogname, dogname)
    if(currentchain[i].dogname == dogname){
      return i;
    }
  }
  return -1;

}

function Block(previousHash, previousIndex, contactip, dogname, time, hash, nonce){
  this.hash = hash;
  this.previousHash = previousHash;
  this.previousSubHash = previousIndex >= 0 ? currentchain[previousIndex].hash : "";
  this.previousIndex = previousIndex;
  this.contactip = contactip;
  this.dogname = dogname;
  this.time = time;
  this.nonce = nonce || 0;

  this.calculateHash = function(difficulty){
    var target = "0000000000000000000000000000000000000000000000000000000000000000";
    while(this.hash==undefined || this.hash.substring(0,difficulty)!=target.substring(0,difficulty)){
      this.nonce++;
      var buf = new Buffer(
        this.previousHash + 
        this.previousSubHash + 
        this.previousIndex + 
        this.contactip + 
        this.dogname + 
        this.time +
        this.nonce
      )
      this.hash = crypto.createHmac('sha256', buf.toString())
        .digest('hex');
    }
    console.log('Calculated a hash:',this.hash);
  }

  if(this.hash == undefined){
    this.calculateHash(4);
  }
}