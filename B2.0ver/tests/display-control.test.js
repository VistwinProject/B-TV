import {test} from 'node:test'
import assert from 'node:assert/strict'
import {createRequire} from 'node:module'
import {begin,advancePlayback} from '../app/playback.js'
const {createDisplayControl}=createRequire(import.meta.url)('../server/display-control.cjs')
function fixture(){
 let now=10;const sent=[],published=[]
 const control=createDisplayControl({now:()=>now,epoch:'epoch-test',publish:m=>{published.push(m);return true},send:(client,m)=>sent.push({client,...m}),broadcast:()=>{}})
 const report=(id,patch={},client=id)=>control.receive(client,{type:'b-display-state',protocol:'b-display-v1',displayId:id,ready:true,screen:id==='tv'?'welcome':'place-card',activity:'idle',...patch})
 const command=(type='reset',reqId='r1')=>control.receive('x',{type:'b-command',reqId,command:{type}})
 return {control,sent,published,report,command,advance:n=>{now+=n;control.tick()}}
}
test('ready requires both fresh distinct displays and reset waits for both committed acks',()=>{
 const f=fixture();f.report('table');assert.equal(f.control.snapshot().ready,false)
 f.command();assert.equal(f.sent.at(-1).ok,false);assert.equal(f.published.length,0)
 f.report('tv');assert.equal(f.control.snapshot().ready,true)
 f.command();assert.equal(f.published.length,1)
 f.report('table',{appliedReqId:'r1'});assert.equal(f.sent.length,1)
 f.report('tv',{appliedReqId:'r1',screen:'experience',activity:'active'});assert.equal(f.sent.length,1)
 f.report('tv',{appliedReqId:'r1'});assert.equal(f.sent.at(-1).ok,true);assert.equal(f.sent.at(-1).status.activity,'idle')
})
test('disconnect, duplicate display, stale state and superseding input fail closed',()=>{
 for(const fault of ['close','duplicate','stale','superseded']){
  const f=fixture();f.report('table');f.report('tv');f.command()
  if(fault==='close')f.control.close('tv')
  if(fault==='duplicate')f.report('tv',{},'tv2')
  if(fault==='stale')f.advance(4600)
  if(fault==='superseded')f.control.onEvent({type:'tag-present'})
  assert.equal(f.sent.at(-1).ok,false,fault)
 }
})
test('old ack cannot satisfy a new request and healthy heartbeats without applied ack time out',()=>{
 const f=fixture();f.report('table');f.report('tv');f.command('reset','new')
 for(let i=0;i<6;i++){f.report('table',{appliedReqId:'old'});f.report('tv',{appliedReqId:'old'});f.advance(1000)}
 assert.equal(f.sent.at(-1).error,'display-ack-timeout')
})
test('outro is active until explicit narration-ended evidence; reset is idle',()=>{
 const f=fixture();f.report('table',{screen:'farewell',activity:'active'});f.report('tv',{screen:'farewell',activity:'active'})
 assert.equal(f.control.snapshot().activity,'active')
 f.report('tv',{screen:'farewell',activity:'complete'});assert.equal(f.control.snapshot().activity,'active')
 f.report('tv',{screen:'farewell',activity:'complete',completionEvidence:'narration-ended'});assert.equal(f.control.snapshot().activity,'complete')
 let state=advancePlayback(begin(),{action:'outro',now:1});assert.notEqual(state.completedRevision,state.revision)
 state=advancePlayback(state,{action:'audio-failed',revision:state.revision,now:2});assert.notEqual(state.completedRevision,state.revision)
 state=advancePlayback(state,{action:'audio-ended',revision:state.revision-1,now:3});assert.notEqual(state.completedRevision,state.revision)
 state=advancePlayback(state,{action:'audio-ended',revision:state.revision,now:4});assert.equal(state.completedRevision,state.revision)
 state=advancePlayback(state,{action:'reset',now:5});assert.equal(state.screen,'welcome');assert.equal(state.completedRevision,undefined)
})
