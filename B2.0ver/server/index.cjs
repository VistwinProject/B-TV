// Local ACR122U bridge. Pairing records UID mappings; it never writes to cards.
const fs=require('node:fs'),path=require('node:path'),readline=require('node:readline');
const {createRequire}=require('node:module');
const dependency=process.env.NFC_MODULE_ROOT?createRequire(path.join(process.env.NFC_MODULE_ROOT,'package.json')):require;
const {WebSocketServer}=dependency('ws');
const {createRelay}=require('./relay.cjs');
const file=path.join(__dirname,'uid-map.json');
let mappings=fs.existsSync(file)?JSON.parse(fs.readFileSync(file,'utf8')):{},armed=null;
const roles={invite:'邀請卡','anti-aging':'居家抗老',child:'兒童免疫',elder:'在宅樂齡',pregnancy:'孕婦照護',nomad:'數位遊牧'};
// Keep current B-TV pairings authoritative; also accept the table's registered cards.
const tableMapFile=path.join(__dirname,'../B-Table/server/uid-map.json');
if(fs.existsSync(tableMapFile)){
 const tableMappings=JSON.parse(fs.readFileSync(tableMapFile,'utf8'));
 for(const [uid,card] of Object.entries(tableMappings)){
  if(card&&typeof card==='object'&&(card.kind==='card'||(card.kind==='character'&&roles[card.id]))&&!mappings[uid])mappings[uid]=card;
 }
}
const readers=new Map();
const wss=new WebSocketServer({host:'127.0.0.1',port:8788});
const send=(ws,data)=>{if(ws.readyState===1)ws.send(JSON.stringify(data))};
const relay=createRelay(data=>{for(const ws of wss.clients)send(ws,data)});
const broadcast=relay.publish;
wss.on('listening',()=>console.log('[WS] Ready ws://127.0.0.1:8788'));
wss.on('error',e=>{console.error(e.message);process.exit(1)});
wss.on('connection',ws=>{
 for(const name of readers.keys())send(ws,{type:'reader-connected',reader:name});
 const current=relay.current();if(current)send(ws,current);
 const phase=relay.phase();if(phase)send(ws,phase);
 ws.on('message',raw=>{try{relay.receive(JSON.parse(raw))}catch{ /* invalid JSON */ }});
});
if(process.env.NFC_SIM_ONLY!=='1'){
const {NFC}=dependency('nfc-pcsc');
const nfc=new NFC();
nfc.on('reader',reader=>{
 const name=reader.reader.name;readers.set(name,null);console.log('[READER]',name);broadcast({type:'reader-connected',reader:name});
 reader.on('card',card=>{
  const uid=String(card.uid||'').toUpperCase();if(!uid)return;readers.set(name,uid);
  if(armed){
   if(mappings[uid]&&mappings[uid].id!==armed){console.log('[PAIR] Card already assigned:',mappings[uid].label,'— use a different card');return}
   if(armed!=='invite'&&Object.values(mappings).some(v=>v.id===armed)){console.log('[PAIR] Role already paired; keeping existing mapping');armed=null;return}
   mappings[uid]={kind:armed==='invite'?'card':'character',id:armed,label:roles[armed]};
   fs.writeFileSync(file+'.tmp',JSON.stringify(mappings,null,2)+'\n');fs.renameSync(file+'.tmp',file);
   console.log('[PAIRED]',roles[armed],uid);armed=null;
  }
  console.log('[CARD]',uid,mappings[uid]?.label||'unpaired');
  if(mappings[uid])broadcast({type:'tag-present',uid,data:mappings[uid]});
 });
 reader.on('card.off',()=>{readers.set(name,null);console.log('[REMOVED]');broadcast({type:'tag-remove'})});
 reader.on('end',()=>{readers.delete(name);broadcast({type:'reader-disconnected',reader:name})});
 reader.on('error',e=>console.error('[READER ERROR]',e.message));
});
nfc.on('error',e=>console.error('[NFC ERROR]',e.message));
}else console.log('[NFC] Simulation only; no physical reader');
readline.createInterface({input:process.stdin}).on('line',line=>{
 const [cmd,id]=line.trim().split(/\s+/);
 if(cmd==='pair'&&roles[id]){if([...readers.values()].some(Boolean)){console.log('[PAIR] Remove the current card first');return}armed=id;console.log('[PAIR READY]',roles[id])}
 else if(cmd==='cancel'){armed=null;console.log('[PAIR CANCELLED]')}
 else if(cmd==='status')console.log(JSON.stringify({readers:[...readers.keys()],armed,mappings}));
});
console.log('Commands: pair invite|anti-aging|child|elder|pregnancy|nomad, status, cancel');
