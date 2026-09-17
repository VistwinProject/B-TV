import {test} from 'node:test'
import assert from 'node:assert/strict'
import {OUTRO_CAPTIONS,outroCaptionAt} from '../app/outroCaptions.js'
import {begin,advancePlayback as update} from '../app/playback.js'
test('outro captions follow media time including seeks and pauses',()=>{
 assert.equal(OUTRO_CAPTIONS.map(c=>c.text).join(''),'依照您不同的生活型態，感知空間的變化，做出即時的系統回應，房屋的健康，就是您的健康。')
 for(const c of OUTRO_CAPTIONS)assert.equal(outroCaptionAt(c.start),c.text)
 assert.equal(outroCaptionAt(3),outroCaptionAt(3));assert.equal(outroCaptionAt(9.9),'')
})
test('outro waits beyond nine seconds for its own audio completion',()=>{
 let s=update(begin(),{action:'outro',now:0})
 s=update(s,{action:'audio-waiting',revision:s.revision,now:0})
 assert.equal(update(s,{action:'clock',now:9500}).screen,'farewell')
 assert.equal(update(s,{action:'audio-ended',revision:s.revision-1,now:9890}).screen,'farewell')
 assert.equal(update(s,{action:'audio-ended',revision:s.revision,now:9890}).screen,'welcome')
})
