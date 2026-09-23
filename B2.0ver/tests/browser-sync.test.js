import {test} from 'node:test'
import assert from 'node:assert/strict'
import {createBrowserSync,isBrowserPreview} from '../app/browserSync.js'
import {readFileSync,existsSync} from 'node:fs'
function browser() {
 const channels=new Set(),storage=new Map();let seq=0
 return {
  BroadcastChannel:class {
   constructor(){channels.add(this)}
   postMessage(data){for(const peer of channels)if(peer!==this)peer.onmessage?.({data})}
   close(){channels.delete(this)}
  },
  crypto:{randomUUID:()=>String(++seq)},
  localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)},
 }
}
test('HTTPS uses browser synchronization while local NFC keeps its WebSocket',()=>{
 assert.equal(isBrowserPreview({protocol:'https:',search:''}),true)
 assert.equal(isBrowserPreview({protocol:'http:',search:''}),false)
 assert.equal(isBrowserPreview({protocol:'https:',search:'?hardware=1'}),false)
})
test('commands arrive once in both tabs and TV completion returns with the same flow',()=>{
 const env=browser(),table=[],tv=[]
 const a=createBrowserSync(m=>table.push(m),env),b=createBrowserSync(m=>tv.push(m),env)
 a.send({type:'tag-present',data:{kind:'card',id:'invite'}})
 assert.deepEqual(table,tv);assert.equal(tv.length,1)
 const flowId=tv[0].flowId
 b.send({type:'tv-phase',screen:'choose',flowId})
 assert.equal(table.at(-1).screen,'choose');assert.equal(table.length,2)
 for(const id of ['anti-aging','child','elder','pregnancy','nomad'])a.send({type:'tag-present',data:{kind:'character',id}})
 assert.equal(tv.at(-1).data.id,'nomad')
 const count=table.length
 b.send({type:'tv-phase',screen:'farewell',flowId})
 assert.equal(table.length,count)
 a.send({type:'outro'});assert.equal(tv.at(-1).type,'outro')
 a.send({type:'reset'});assert.equal(tv.at(-1).type,'reset')
 a.close();b.close()
})
test('refresh and later-opened tabs restore the current selection and completion',()=>{
 const env=browser(),a=createBrowserSync(()=>{},env)
 a.send({type:'tag-present',data:{kind:'card',id:'invite'}})
 let flowId
 const b=createBrowserSync(m=>{if(m.flowId)flowId=m.flowId},env)
 a.send({type:'tag-remove'})
 b.send({type:'tv-phase',screen:'choose',flowId});b.close()
 const replay=[];const c=createBrowserSync((m,meta)=>replay.push([m,meta]),env)
 assert.deepEqual(replay.map(([m])=>m.type),['tag-present','tag-remove','tv-phase'])
 assert.equal(replay.at(-1)[0].screen,'choose')
 assert.ok(replay.every(([,meta])=>meta.replay))
 a.send({type:'reset'});c.close()
 const reset=[];createBrowserSync(m=>reset.push(m),env).close()
 assert.deepEqual(reset.map(m=>m.type),['reset']);a.close()
})
test('table and TV ship the identical channel protocol',{skip:!existsSync(new URL('../B-Table/src/browserSync.js',import.meta.url))},()=>{
 assert.equal(readFileSync(new URL('../app/browserSync.js',import.meta.url),'utf8'),readFileSync(new URL('../B-Table/src/browserSync.js',import.meta.url),'utf8'))
})
