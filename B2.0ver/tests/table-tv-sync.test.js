import {existsSync} from 'node:fs'
import {test} from 'node:test'
import assert from 'node:assert/strict'
import {createRequire} from 'node:module'
import {begin,nfcAction,PEOPLE} from '../app/playback.js'
import {advancePresentation} from '../app/pageTransitions.js'
const {createRelay}=createRequire(import.meta.url)('../server/relay.cjs')

test('table scans broadcast the invitation and all five roles to TV',()=>{
 let tv=begin(),now=0
 const received=[]
 const relay=createRelay(message=>{received.push(message);tv=advancePresentation(tv,{...nfcAction(message),now:++now})})
 relay.receive({type:'tag-present',data:{kind:'card',id:'invite'}})
 assert.equal(tv.screen,'overview')
 for(const id of PEOPLE){
  relay.receive({type:'tag-present',data:{kind:'character',id}})
  assert.equal(tv.screen,'experience');assert.equal(tv.person,id)
  assert.equal(relay.current().data.id,id)
 }
 assert.equal(received.length,6)
 relay.receive({type:'tag-remove'})
 assert.equal(tv.held,null);assert.equal(tv.person,'nomad');assert.equal(relay.current(),null)
 relay.receive({type:'reset'})
 assert.equal(tv.screen,'welcome')
})

test('held physical or simulated card is available to a reconnecting display',()=>{
 const relay=createRelay(()=>{})
 const scan={type:'tag-present',data:{kind:'character',id:'child'}}
 for(const route of ['publish','receive']){
  relay[route](scan)
  const restored=advancePresentation(begin(),{...nfcAction(relay.current()),now:1})
  assert.equal(restored.person,'child')
  relay.publish({type:'reader-disconnected'})
  assert.equal(relay.current(),null)
 }
})

test('invalid simulator messages cannot replace the current card',()=>{
 const messages=[],relay=createRelay(message=>messages.push(message))
 relay.receive({type:'tag-present',data:{kind:'character',id:'elder'}})
 for(const invalid of [null,{},'bad',{type:'reader-connected'},{type:'tag-present',data:{kind:'character',id:'unknown'}}])assert.equal(relay.receive(invalid),false)
 assert.equal(messages.length,1);assert.equal(relay.current().data.id,'elder')
})

test('narration completion fades to choices and rejects an older invitation completion',()=>{
 const messages=[],relay=createRelay(m=>messages.push(m))
 relay.receive({type:'tag-present',data:{kind:'card'}})
 const flowId=relay.current().flowId
 let tv=advancePresentation(begin(),{action:'invite',now:0,hasAudio:true})
 tv=advancePresentation(tv,{action:'overview-tour-started',revision:tv.revision,now:1})
 tv=advancePresentation(tv,{action:'audio-ended',revision:tv.revision,now:12000})
 tv=advancePresentation(tv,{action:'clock',now:12000})
 assert.equal(tv.screen,'overview');assert.equal(tv.transition.target.screen,'choose')
 tv=advancePresentation(tv,{action:'clock',now:12250})
 assert.equal(tv.screen,'choose');assert.equal(tv.fadeIn,true)
 assert.equal(relay.receive({type:'tv-phase',flowId,screen:tv.screen}),true)
 assert.equal(relay.phase().screen,'choose')
 relay.receive({type:'tag-remove'})
 relay.receive({type:'tag-present',data:{kind:'card'}})
 assert.equal(relay.receive({type:'tv-phase',flowId,screen:'choose'}),false)
 assert.equal(relay.phase(),null)
 relay.receive({type:'reset'})
 assert.equal(relay.receive({type:'tv-phase',flowId,screen:'choose'}),false)
})


test('table holds the connected prompt until TV chooses, including card removal and stale messages',{skip:!existsSync(new URL('../B-Table/src/session.js',import.meta.url))},async()=>{
 const {initial,reducer,deriveStep}=await import('../B-Table/src/session.js')
 let table=reducer(initial,{type:'tag-present',data:{kind:'card'},flowId:1})
 assert.equal(deriveStep(table),'connected')
 table=reducer(table,{type:'tag-remove'})
 assert.equal(deriveStep(table),'connected')
 table=reducer(table,{type:'tv-phase',flowId:0,screen:'choose'})
 assert.equal(deriveStep(table),'connected')
 table=reducer(table,{type:'tv-phase',flowId:1,screen:'choose'})
 assert.equal(deriveStep(table),'place-character')
 table=reducer(table,{type:'tag-present',data:{kind:'character',id:'child'}})
 assert.equal(deriveStep(table),'scene')
 table=reducer(table,{type:'tag-remove'})
 assert.equal(deriveStep(table),'place-character')
 table=reducer(table,{type:'tag-present',data:{kind:'card'},flowId:2})
 assert.equal(deriveStep(table),'connected')
 assert.equal(table.character,null)
 assert.equal(deriveStep(reducer(table,{type:'reset'})),'place-card')
})

test('automatic and operator TV endings synchronize table and a new card clears the ending',{skip:!existsSync(new URL('../B-Table/src/session.js',import.meta.url))},async()=>{
 const {initial,reducer,deriveStep}=await import('../B-Table/src/session.js')
 let table=initial,lastMessage
 const relay=createRelay(m=>{lastMessage=m;table=reducer(table,m)})
 let tv=begin()
 for(const id of PEOPLE){
  relay.receive({type:'tag-present',data:{kind:'character',id}})
  tv=advancePresentation(tv,{...nfcAction(lastMessage),now:0})
 }
 const flowId=lastMessage.flowId
 tv=advancePresentation(tv,{action:'clock',now:27000})
 tv=advancePresentation(tv,{action:'clock',now:27250})
 assert.equal(tv.screen,'farewell')
 relay.receive({type:'tv-phase',screen:tv.screen,flowId})
 assert.equal(deriveStep(table),'farewell')
 relay.receive({type:'tag-remove'})
 assert.equal(deriveStep(table),'farewell')
 relay.receive({type:'tag-present',data:{kind:'card'}})
 assert.equal(deriveStep(table),'connected')
 assert.equal(relay.receive({type:'tv-phase',screen:'farewell',flowId}),false)
 relay.receive({type:'outro'})
 relay.receive({type:'tv-phase',screen:'farewell',flowId:lastMessage.flowId})
 assert.equal(deriveStep(table),'farewell')
 relay.receive({type:'reset'})
 assert.equal(deriveStep(table),'place-card')
})
