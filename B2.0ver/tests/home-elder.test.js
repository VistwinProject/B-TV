import {test} from 'node:test'
import assert from 'node:assert/strict'
import {elderFrame} from '../app/homeElder.js'
import {elderCameraFrame} from '../app/homeCamera.js'

test('elder tour brightens the walking area, returns, closes curtains, then turns off lamps',()=>{
  assert.equal(elderCameraFrame(2).weight,0)
  assert.ok(elderCameraFrame(11).zoom>elderCameraFrame(6).zoom)
  assert.ok(elderCameraFrame(11).direction[1]<.4)
  assert.equal(elderFrame(11).floorBoost,1)
  assert.equal(elderCameraFrame(17).weight,0)
  assert.equal(elderFrame(17).curtain,0)
  assert.equal(elderFrame(20).curtain,1)
  assert.equal(elderFrame(20).lamps,1)
  assert.equal(elderFrame(22).lamps,0)
  assert.equal(elderFrame(22).floorBoost,0)
  assert.deepEqual(elderFrame(0),elderFrame(25))
  assert.deepEqual(elderCameraFrame(0),elderCameraFrame(25))
})
