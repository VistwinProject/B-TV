import {test} from 'node:test'
import assert from 'node:assert/strict'
import {overviewCaptionAt,OVERVIEW_CAPTIONS} from '../app/overviewCaptions.js'
import {begin,advancePlayback} from '../app/playback.js'
test('overview captions match the supplied narration and support media-time seeks',()=>{
 assert.equal(OVERVIEW_CAPTIONS.map(c=>c.text).join('').replace(/\n/g,''),'目前室溫26.2度，相對濕度58%，正在透過12合1感測器感知空間的即時變化，隨時更新，以下是空間的詳細資訊。')
 assert.equal(overviewCaptionAt(3),'目前室溫26.2度，\n相對濕度58%，')
 assert.equal(overviewCaptionAt(5.12),'正在透過12合1感測器感知空間的即時變化，隨時更新，')
 assert.equal(overviewCaptionAt(10),overviewCaptionAt(5.12))
 assert.equal(overviewCaptionAt(11),'以下是空間的詳細資訊。')
 assert.equal(overviewCaptionAt(0),'目前室溫26.2度，\n相對濕度58%，')
})
test('overview waits for narration and keeps the final heading visible before leaving',()=>{
 let s=advancePlayback(begin(0),{action:'invite',now:0})
 s=advancePlayback(s,{action:'audio-waiting',revision:s.revision,now:0})
 assert.equal(advancePlayback(s,{action:'clock',now:21000}).screen,'overview')
 s=advancePlayback(s,{action:'audio-ended',revision:s.revision,now:22000})
 assert.equal(advancePlayback(s,{action:'clock',now:25999}).screen,'overview')
 assert.equal(advancePlayback(s,{action:'clock',now:26000}).screen,'choose')
})
