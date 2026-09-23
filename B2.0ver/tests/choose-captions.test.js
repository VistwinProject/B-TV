import {test} from 'node:test'
import assert from 'node:assert/strict'
import {CHOOSE_CAPTIONS,chooseCaptionAt} from '../app/chooseCaptions.js'
import {begin,advancePlayback} from '../app/playback.js'

test('role narration follows media-time phrase boundaries and supports replay',()=>{
  for(const [index,caption] of CHOOSE_CAPTIONS.entries()){
    assert.equal(chooseCaptionAt(caption.start),caption.text)
    assert.equal(chooseCaptionAt(caption.end-.01),caption.text)
    if(index>0)assert.equal(CHOOSE_CAPTIONS[index-1].end,caption.start)
  }
  assert.equal(chooseCaptionAt(23.919),CHOOSE_CAPTIONS[3].text)
  assert.equal(chooseCaptionAt(0),CHOOSE_CAPTIONS[0].text)
})

test('finishing role narration leaves the role cards available',()=>{
  let state=advancePlayback(begin(0),{action:'invite',now:0})
  state=advancePlayback(state,{action:'next',now:100})
  assert.equal(state.screen,'choose')
  state=advancePlayback(state,{action:'audio-ended',revision:state.revision,now:26000})
  assert.equal(state.screen,'choose')
})
