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
test('fifth scene waits for narration, then holds the core goal for four seconds',()=>{
 let s=update({...begin(),seen:PEOPLE},{action:'person',id:'child',now:0})
 s=update(s,{action:'audio-waiting',revision:s.revision})
 assert.equal(update(s,{action:'clock',now:24000}).screen,'experience')
 s=update(s,{action:'audio-ended',revision:s.revision,now:24270})
 assert.equal(update(s,{action:'clock',now:28269}).screen,'experience')
 assert.equal(update(s,{action:'clock',now:28270}).screen,'farewell')
})
