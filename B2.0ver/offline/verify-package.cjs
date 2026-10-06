const assert=require('node:assert/strict');
const path=require('node:path');
const fs=require('node:fs');
const {promisify}=require('node:util');
const execFile=promisify(require('node:child_process').execFile);
const root=path.resolve(process.argv[2]);
const node=path.join(root,'runtime/node');
const env={...process.env,NFC_SIM_ONLY:'1',B_TEST_NO_BROWSER:process.env.B_VERIFY_BROWSER==='1'?'0':'1',B_TEST_PORT_OFFSET:'10000'};
const {WebSocket}=require(path.join(root,'server/node_modules/ws'));
const run=action=>execFile(node,[path.join(root,'launcher.cjs'),action],{env,timeout:25000});
async function client(){ const ws=new WebSocket('ws://127.0.0.1:18788');await new Promise((resolve,reject)=>{ws.once('open',resolve);ws.once('error',reject)});return ws; }
function next(ws,type,id){return new Promise((resolve,reject)=>{
 const cleanup=()=>{clearTimeout(timer);ws.off('message',receive)};
 const receive=raw=>{const message=JSON.parse(raw);if(message.type!==type || (id!==undefined && message.data?.id!==id))return;cleanup();resolve(message)};
 const timer=setTimeout(()=>{cleanup();reject(Error(`sync timeout: ${type} ${id||''}`))},3000);
 ws.on('message',receive);
});}
(async()=>{
 let a,b;
 try {
  console.log((await run('start')).stdout.trim());
  assert.match((await run('start')).stdout,/已啟動/);
  for(const port of [15273,15284]) { const response=await fetch(`http://127.0.0.1:${port}/`);assert.equal(response.status,200);assert.match(await response.text(),/assets\/index/); }
  a=await client();b=await client();
  const roles=['invite','anti-aging','child','elder','pregnancy','nomad'];
  for(const id of roles){ const ra=next(a,'tag-present',id),rb=next(b,'tag-present',id);a.send(JSON.stringify({type:'tag-present',data:{id,kind:id==='invite'?'card':'character'}}));const [left,right]=await Promise.all([ra,rb]);assert.equal(right.data.id,id);assert.deepEqual(left,right); }
  let ra=next(a,'tag-remove'),rb=next(b,'tag-remove');a.send(JSON.stringify({type:'tag-remove'}));assert.equal((await ra).type,'tag-remove');assert.equal((await rb).type,'tag-remove');
  a.close();b.close();
  console.log('PASS: both web pages; duplicate start; invitation + all five roles broadcast identically; removal sync.');
 } finally { a?.terminate();b?.terminate();console.log((await run('stop')).stdout.trim()); }
 await new Promise(r=>setTimeout(r,800));
 for(const port of [15273,15284,18788]) { let closed=false;try{await fetch(`http://127.0.0.1:${port}/`,{signal:AbortSignal.timeout(800)});}catch{closed=true;}assert.ok(closed,`port ${port} still open`); }
 assert.equal(fs.existsSync(path.join(root,'run/session.json')),false);
 console.log('PASS: Stop releases all three ports and clears the owned session.');
})().catch(error=>{console.error(error);process.exitCode=1});
