import {test} from 'node:test'
import assert from 'node:assert/strict'
import {overviewCaptionAt,OVERVIEW_CAPTIONS} from '../app/overviewCaptions.js'
import {begin,advancePlayback} from '../app/playback.js'
test('overview captions match the supplied narration and support media-time seeks',()=>{
 assert.equal(OVERVIEW_CAPTIONS.map(c=>c.text).join('').replace(/\n/g,''),'目前室溫26.2度，相對濕度58%，正在透過12合1感測器偵測空間的數據，以下是空間的詳細資訊。')
 assert.equal(overviewCaptionAt(3),'目前室溫26.2度，\n相對濕度58%，')
 assert.equal(overviewCaptionAt(5.22),'正在透過12合1感測器偵測空間的數據，')
 assert.equal(overviewCaptionAt(9.61),overviewCaptionAt(5.22))
 assert.equal(overviewCaptionAt(9.62),'以下是空間的詳細資訊。')
 assert.equal(overviewCaptionAt(0),'目前室溫26.2度，\n相對濕度58%，')
})
test('overview waits for narration then holds the information for three seconds',()=>{
 let s=advancePlayback(begin(0),{action:'invite',now:0})
 s=advancePlayback(s,{action:'audio-waiting',revision:s.revision,now:0})
 assert.equal(advancePlayback(s,{action:'clock',now:21000}).screen,'overview')
 s=advancePlayback(s,{action:'audio-ended',revision:s.revision,now:22000})
 assert.equal(advancePlayback(s,{action:'clock',now:24999}).screen,'overview')
 assert.equal(advancePlayback(s,{action:'clock',now:25000}).screen,'choose')
})

test('narration completion takes priority over the remaining overview animation',()=>{
 let s=advancePlayback(begin(0),{action:'invite',now:0})
 s=advancePlayback(s,{action:'overview-tour-started',revision:s.revision,now:0})
 s=advancePlayback(s,{action:'audio-ended',revision:s.revision,now:13000})
 assert.equal(advancePlayback(s,{action:'clock',now:15999}).screen,'overview')
 assert.equal(advancePlayback(s,{action:'clock',now:16000}).screen,'choose')
 s=advancePlayback(s,{action:'overview-tour-ended',revision:s.revision,now:20500})
 assert.equal(advancePlayback(s,{action:'clock',now:20500}).screen,'choose')
})
