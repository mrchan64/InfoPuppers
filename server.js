var EXA = require('./lib/expressApp.js'),
    BCH = require('./lib/blockChain.js'),
    IFD = require('./lib/infoFinder.js');

if(process.argv[2]=='server'){
  EXA.startCentral();
  BCH.hookwss(EXA.wssconns);
  EXA.app.get('/currentChain', (req, res)=>{
    res.json(JSON.parse(BCH.chainToString()));
  })
}else if(process.argv[2]){
  EXA.startClient(process.argv[2]);
  BCH.hookws(EXA.ws);
  EXA.newBlock = BCH.createNewBlock;
  IFD.setUp(BCH.getChain());
  EXA.searchStream = IFD.constructDataStream
}else{
  console.log('exiting')
}
