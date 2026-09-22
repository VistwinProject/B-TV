import {test} from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {SCENE_CAPTIONS,sceneCaptionAt} from '../app/sceneCaptions.js'
import {begin,advancePlayback as update,PEOPLE} from '../app/playback.js'
test('five narration files and media-time caption tracks are present',()=>{
 for(const id of PEOPLE){
  const bytes=readFileSync(new URL(`../public/voice/scene-${id}.wav`,import.meta.url));assert.equal(bytes.toString('ascii',0,4),'RIFF')
  const track=SCENE_CAPTIONS[id];assert.equal(track[0][0],0)
  track.forEach(([t,text],i)=>{assert.equal(sceneCaptionAt(id,t),text);if(i)assert.ok(t>track[i-1][0])})
 }
})
test('any final scene waits for narration and its animation, holds two seconds, then fades',()=>{
 for(const id of PEOPLE){
  let s=update({...begin(),seen:PEOPLE},{action:'person',id,now:0})
  s=update(s,{action:'audio-waiting',revision:s.revision})
  assert.equal(update(s,{action:'clock',now:30000}).exitStartedAt,null)
  s=update(s,{action:'audio-ended',revision:s.revision,now:31000})
  assert.equal(update(s,{action:'clock',now:32999}).exitStartedAt,null)
  s=update(s,{action:'clock',now:33000})
  assert.equal(s.screen,'experience');assert.equal(s.exitStartedAt,33000)
  assert.equal(update(s,{action:'clock',now:33249}).screen,'experience')
  assert.equal(update(s,{action:'clock',now:33250}).screen,'farewell')
 }
})
test('switching scenes cancels the old exit and stale narration cannot end the new scene',()=>{
 let s=update({...begin(),seen:PEOPLE},{action:'person',id:'child',now:0})
 s=update(s,{action:'clock',now:27000})
 const oldRevision=s.revision
 s=update(s,{action:'person',id:'elder',now:27500})
 assert.equal(s.exitStartedAt,null)
 assert.strictEqual(update(s,{action:'audio-ended',revision:oldRevision,now:28000}),s)
 assert.equal(update(s,{action:'clock',now:28500}).screen,'experience')
})
test('editing pauses both the ending hold and fade countdown',()=>{
 let s=update({...begin(),seen:PEOPLE},{action:'person',id:'child',now:0})
 s=update(s,{action:'audio-ended',revision:s.revision,now:30000})
 s=update(s,{action:'pause',now:31000});s=update(s,{action:'resume',now:41000})
 assert.equal(update(s,{action:'clock',now:41999}).exitStartedAt,null)
 s=update(s,{action:'clock',now:42000})
 s=update(s,{action:'pause',now:42100});s=update(s,{action:'resume',now:52100})
 assert.equal(update(s,{action:'clock',now:52249}).screen,'experience')
 assert.equal(update(s,{action:'clock',now:52250}).screen,'farewell')
})
