import {test} from 'node:test'
import assert from 'node:assert/strict'
import {begin,PEOPLE,DURATION} from '../app/playback.js'
import {advancePresentation as update} from '../app/pageTransitions.js'

test('manual navigation and scenario changes keep immediate switching',()=>{
 let s=begin(),now=0
 const events=[{action:'invite'},{action:'next'},...PEOPLE.map(id=>({action:'person',id})),{action:'outro'},{action:'reset'},{action:'intro'}]
 for(const event of events){
  const old=s
  s=update(s,{...event,now})
  assert.equal(s.transition,null);assert.equal(s.fadeIn,false)
  assert.equal(s.started,now);assert.ok(s.revision>old.revision)
  now+=5000
 }
})
test('manual navigation cancels an automatic fade without a delayed page switch',()=>{
 let s={...begin(),screen:'overview',deadline:25000}
 s=update(s,{action:'clock',now:25000})
 s=update(s,{action:'person',id:'elder',now:25100})
 assert.equal(s.person,'elder');assert.equal(s.screen,'experience')
 assert.equal(s.transition,null);assert.equal(s.fadeIn,false)
 assert.equal(update(s,{action:'clock',now:25250}).screen,'experience')
})
test('editing pauses the automatic fade and incoming timers start at commit',()=>{
 let s={...begin(),screen:'overview',deadline:25000}
 s=update(s,{action:'clock',now:25000})
 s=update(s,{action:'pause',now:25100});s=update(s,{action:'resume',now:35100})
 assert.equal(update(s,{action:'clock',now:35249}).screen,'overview')
 s=update(s,{action:'clock',now:35250})
 assert.equal(s.screen,'choose');assert.equal(s.started,35250);assert.equal(s.fadeIn,true)
})
test('automatic overview exit fades and late outgoing audio cannot alter the target',()=>{
 let s={...begin(),screen:'overview',deadline:25000}
 s=update(s,{action:'clock',now:25000})
 assert.equal(s.screen,'overview');assert.equal(s.transition.target.screen,'choose')
 assert.strictEqual(update(s,{action:'audio-ended',revision:s.revision,now:25200}),s)
 assert.equal(update(s,{action:'clock',now:25250}).screen,'choose')
})
test('the final scenario keeps its two-second hold and only fades out once',()=>{
 for(const person of PEOPLE){
  let s={...begin(),screen:'experience',person,seen:PEOPLE,sceneAudioFinishedAt:30000}
  assert.equal(update(s,{action:'clock',now:31999}).exitStartedAt,undefined)
  s=update(s,{action:'clock',now:32000})
  assert.equal(s.exitStartedAt,32000)
  s=update(s,{action:'clock',now:32250})
  assert.equal(s.screen,'farewell');assert.equal(s.transition,null);assert.equal(s.fadeIn,true)
 }
})

test('leaving the editor restarts the current page and discards pending endings',()=>{
 for(const screen of ['welcome','overview','choose','experience','farewell']){
  const s={...begin(),screen,person:'elder',seen:[...PEOPLE],revision:7,dimension:3,loop:2,pausedAt:40000,
   sceneAudioFinishedAt:35000,sceneAudioPending:true,exitStartedAt:38000,fadeIn:true,
   transition:{started:38000,target:{...begin(),screen:'farewell'}},overviewTourPending:true}
  const result=update(s,{action:'resume',restart:true,now:50000})
  assert.equal(result.screen,screen);assert.equal(result.person,'elder');assert.deepEqual(result.seen,PEOPLE)
  assert.equal(result.started,50000);assert.equal(result.revision,8);assert.equal(result.restartEpoch,1)
  assert.equal(result.dimension,0);assert.equal(result.loop,0);assert.equal(result.transition,null)
  assert.equal(result.exitStartedAt,null);assert.equal(result.sceneAudioFinishedAt,null)
  assert.equal(result.sceneAudioPending,false);assert.equal(result.pausedAt,null)
  assert.equal(result.deadline,screen==='overview'?68000:null)
 }
 const initial=begin();assert.strictEqual(update(initial,{action:'resume',restart:true,now:1}),initial)
})
