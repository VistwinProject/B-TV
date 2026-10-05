const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const net = require('node:net');
const crypto = require('node:crypto');
const {spawn} = require('node:child_process');
const {serve} = require('./static.cjs');
const root = __dirname;
const stateFile = path.join(root, 'run', 'session.json');
const offset=Number(process.env.B_TEST_PORT_OFFSET || 0);
const ports = {table:5273+offset, tv:5284+offset, nfc:8788+offset};
let cleanup;
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
const readState = () => { try { return JSON.parse(fs.readFileSync(stateFile)); } catch { return null; } };
async function control(state, action, body) {
  if (!state) return null;
  try {
    const response = await fetch(`http://127.0.0.1:${ports.table}/__b/${action}`, {method:['stop','command'].includes(action)?'POST':'GET', body, headers:{'X-B-Token':state.token}, signal:AbortSignal.timeout(1500)});
    return response.ok ? await response.json() : null;
  } catch { return null; }
}
async function portFree(port) {
  return new Promise(resolve => {
    const server = net.createServer();
    server.once('error',()=>resolve(false));
    server.listen(port,'127.0.0.1',()=>server.close(()=>resolve(true)));
  });
}
function browserPath() {
  const candidates = process.platform === 'darwin' ? [
    path.join(root,'browser/Google Chrome.app/Contents/MacOS/Google Chrome'),
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
  ] : [process.env.PROGRAMFILES,process.env['PROGRAMFILES(X86)'],process.env.LOCALAPPDATA].filter(Boolean).flatMap(base=>[
    path.join(base,'Google/Chrome/Application/chrome.exe'),path.join(base,'Microsoft/Edge/Application/msedge.exe')
  ]);
  return candidates.find(file=>fs.existsSync(file));
}
async function main() {
  const command = process.argv[2] || 'start';
  if (command === 'stop') {
    const state = readState();
    if (!await control(state,'status')) { console.log('B 區離線包目前未啟動。'); return; }
    if (!await control(state,'stop')) throw Error('停止失敗，請查看 logs/session.log。');
    for(let i=0;i<50;i++){ if(!await control(state,'status')){console.log('B 區 TV、Table 與 NFC 服務已關閉。');return;} await pause(200); }
    throw Error('停止逾時，請查看 logs/session.log。');
  }
  if (command === 'pair') {
    const id=process.argv[3];
    if(!['invite','anti-aging','child','elder','pregnancy','nomad','cancel','status'].includes(id)) throw Error('請指定 invite / anti-aging / child / elder / pregnancy / nomad。');
    if(!await control(readState(),'command',id==='status'||id==='cancel'?id:'pair '+id)) throw Error('請先雙擊 Start。');
    console.log('已送出指令；結果請查看 logs/session.log。配對前請先拿起卡片，再放上要配對的卡。'); return;
  }
  if (command === 'status') { console.log(await control(readState(),'status') || '未啟動'); return; }
  if (command !== 'serve') {
    if (await control(readState(),'status')) { console.log('B 區已啟動，無需重複開啟。'); return; }
    const occupied=[];
    for(const [name,port] of Object.entries(ports)) if(!await portFree(port)) occupied.push(`${name}: ${port}`);
    if(occupied.length) throw Error(`埠口已被占用：${occupied.join(', ')}。請先停止原本的開發版或其他 B 區服務，再雙擊 Start；不會自動關閉其他程式。`);
    if(process.env.B_TEST_NO_BROWSER!=='1'&&!browserPath()) throw Error('請先安裝 Google Chrome 或 Microsoft Edge。');
    // Fail before opening either display if the bundled native module cannot load.
    if(process.env.NFC_SIM_ONLY!=='1') require('./server/node_modules/nfc-pcsc');
    fs.mkdirSync(path.join(root,'run'),{recursive:true}); fs.mkdirSync(path.join(root,'logs'),{recursive:true});
    const token=crypto.randomBytes(24).toString('hex');
    const fd=fs.openSync(path.join(root,'logs/session.log'),'a');
    const child=spawn(process.execPath,[__filename,'serve',token],{cwd:root,detached:true,stdio:['ignore',fd,fd],env:{...process.env,NFC_MODULE_ROOT:path.join(root,'server')}});
    child.unref(); fs.closeSync(fd);
    for(let i=0;i<60;i++){ const state=readState(); if(state?.token===token && await control(state,'status')){console.log('B 區已啟動：Table 5273 / TV 5284 / NFC 8788。');return;} await pause(250); }
    throw Error('啟動未完成，請查看 logs/session.log。');
  }
  const token=process.argv[3];
  if(!token) throw Error('請使用 Start 啟動。');
  const servers=[],children=[]; let stopping=false,ready=false;
  async function shutdown() {
    if(stopping)return; stopping=true; ready=false;
    for(const child of children.reverse()) {
      if(child.exitCode!==null)continue;
      if(process.platform==='win32') await new Promise(resolve=>spawn('taskkill',['/PID',String(child.pid),'/T','/F'],{stdio:'ignore'}).on('exit',resolve));
      else child.kill('SIGTERM');
    }
    await pause(500);
    for(const child of children) if(child.exitCode===null) child.kill('SIGKILL');
    for(const server of servers){server.closeAllConnections();server.close();}
    if(readState()?.token===token)fs.rmSync(stateFile,{force:true});
    console.log('[STOP]',new Date().toISOString()); process.exit(0);
  }
  cleanup=shutdown;
  process.on('SIGTERM',shutdown);process.on('SIGINT',shutdown);
  process.on('uncaughtException',error=>{console.error(error);shutdown();});
  process.on('unhandledRejection',error=>{console.error(error);shutdown();});
  for(const [name,port] of [['table',ports.table],['tv',ports.tv]]) {
    const server=http.createServer((req,res)=>{
      if(req.url.startsWith('/__b/')){
        if(req.headers['x-b-token']!==token){res.writeHead(403).end();return;}
        res.setHeader('Content-Type','application/json');
        if(req.url==='/__b/command'&&req.method==='POST'){
          let body='';req.on('data',chunk=>{body+=chunk;if(body.length>100)req.destroy();});
          req.on('end',()=>{if(!/^(status|cancel|pair (invite|anti-aging|child|elder|pregnancy|nomad))$/.test(body)){res.writeHead(400).end();return;}bridge.stdin.write(body+'\n');res.end(JSON.stringify({accepted:true}));});return;
        }
        if(req.url==='/__b/status'){res.writeHead(ready?200:503).end(JSON.stringify({ready,table:ports.table,tv:ports.tv,nfc:ports.nfc}));return;}
        if(req.url==='/__b/stop'&&req.method==='POST'){res.end(JSON.stringify({stopping:true}));setImmediate(shutdown);return;}
        res.writeHead(404).end();return;
      }
      serve(path.join(root,name),req,res);
    });
    servers.push(server);
    await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(port,'127.0.0.1',resolve);});
  }
  const bridge=spawn(process.execPath,[path.join(root,'server/index.cjs')],{cwd:root,stdio:['pipe','pipe','pipe'],env:{...process.env,NFC_WS_PORT:String(ports.nfc),NFC_MODULE_ROOT:path.join(root,'server')}});
  children.push(bridge);
  bridge.stdout.on('data',chunk=>process.stdout.write(chunk));bridge.stderr.on('data',chunk=>process.stderr.write(chunk));
  bridge.on('error',error=>{console.error(error);shutdown();});
  bridge.on('exit',code=>{if(!stopping){console.error('[NFC EXIT]',code);shutdown();}});
  const {WebSocket}=require('./server/node_modules/ws');
  await new Promise((resolve,reject)=>{
    let attempts=0;
    const connect=()=>{
      const ws=new WebSocket(`ws://127.0.0.1:${ports.nfc}`);
      ws.on('open',()=>{ws.close();resolve();});
      ws.on('error',()=>{ws.terminate();if(++attempts<40)setTimeout(connect,100);else reject(Error('NFC bridge 未就緒'));});
    };connect();
  });
  if(stopping)return;
  if(process.env.B_TEST_NO_BROWSER!=='1') {
  const browser=browserPath();
  // A separate profile lets Stop close only the exhibition's browser windows.
  const args=['--user-data-dir='+path.join(root,'browser-profile'),'--no-first-run','--no-default-browser-check','--autoplay-policy=no-user-gesture-required','--new-window'];
  const first=spawn(browser,[...args,`--app=http://127.0.0.1:${ports.table}/`],{stdio:'ignore'});children.push(first);
  first.on('error',error=>{console.error(error);shutdown();});
  await pause(1200);
  const second=spawn(browser,[...args,`--app=http://127.0.0.1:${ports.tv}/`],{stdio:'ignore'});children.push(second);
  second.on('error',error=>{console.error(error);shutdown();});
  }
  ready=true;fs.writeFileSync(stateFile,JSON.stringify({pid:process.pid,token}),{mode:0o600});
  console.log('[START]',new Date().toISOString());
}
main().catch(error=>{console.error(error.message);if(cleanup)cleanup();else process.exitCode=1;});
