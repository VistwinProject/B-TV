const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const http=require('node:http');
const {serve}=require('../offline/static.cjs');
test('offline server supports media ranges, HEAD, MIME and rejects traversal',async()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'b-static-'));fs.writeFileSync(path.join(root,'index.html'),'<h1>B</h1>');fs.writeFileSync(path.join(root,'voice.wav'),'0123456789');
 const server=http.createServer((req,res)=>serve(root,req,res));
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const base=`http://127.0.0.1:${server.address().port}`;
 try {
  let r=await fetch(base);assert.equal(r.status,200);assert.match(r.headers.get('content-type'),/text\/html/);
  r=await fetch(base+'/voice.wav',{headers:{Range:'bytes=2-5'}});assert.equal(r.status,206);assert.equal(r.headers.get('content-range'),'bytes 2-5/10');assert.equal(await r.text(),'2345');
  r=await fetch(base+'/voice.wav',{headers:{Range:'bytes=-3'}});assert.equal(await r.text(),'789');
  r=await fetch(base+'/voice.wav',{headers:{Range:'bytes=99-'}});assert.equal(r.status,416);
  r=await fetch(base+'/voice.wav',{method:'HEAD'});assert.equal(r.headers.get('content-length'),'10');assert.equal(await r.text(),'');
  r=await fetch(base+'/%2e%2e%2fsecret');assert.equal(r.status,403);
  r=await fetch(base+'/missing.wav');assert.equal(r.status,404);
 }finally{server.closeAllConnections();await new Promise(resolve=>server.close(resolve));fs.rmSync(root,{recursive:true});}
});
