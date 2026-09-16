import { test } from 'node:test'
import assert from 'node:assert/strict'
import { advancePlayback as update, begin, PEOPLE, DURATION, nfcAction } from '../app/playback.js'

test('invitation timeline: overview for 20 seconds, then choices', () => {
  const started = update(begin(), { action: 'invite', now: 100 })
  assert.equal(started.screen, 'overview')
  assert.equal(update(started, { action: 'clock', now: 20099 }).screen, 'overview')
  assert.equal(update(started, { action: 'clock', now: 20100 }).screen, 'choose')
})

test('held invitation cannot restart either the overview or choices', () => {
  const overview = update(begin(), { action: 'invite', now: 1 })
  assert.strictEqual(update(overview, { action: 'invite', now: 10 }), overview)
  const choices = update(overview, { action: 'clock', now: 21000 })
  assert.strictEqual(update(choices, { action: 'invite', now: 22000 }), choices)
  const removed = update(choices, { action: 'remove', now: 22000 })
  assert.equal(update(removed, { action: 'invite', now: 23000 }).screen, 'overview')
})

test('dimension clock progresses at exact boundaries and keeps looping', () => {
  const scene = update(begin(), { action: 'person', id: 'child', now: 100 })
  for (const [elapsed, dimension, loop] of [[0,0,0],[4999,0,0],[5000,1,0],[10000,2,0],[15000,3,0],[20000,0,1],[65000,1,3]]) {
    const result = update(scene, { action: 'clock', now: 100 + elapsed })
    assert.equal(result.dimension, dimension)
    assert.equal(result.loop, loop)
    assert.equal(result.screen, 'experience')
  }
})

test('all 120 encounter orders wait for the entire fifth cycle and outro', () => {
  let checked = 0
  function visit(state, remaining, time) {
    if (!remaining.length) {
      checked++
      assert.equal(state.seen.length, 5)
      assert.equal(update(state, { action: 'clock', now: time + 19999 }).screen, 'experience')
      const ending = update(state, { action: 'clock', now: time + 20000 })
      assert.equal(ending.screen, 'farewell')
      assert.equal(update(ending, { action: 'clock', now: time + 28999 }).screen, 'farewell')
      const home = update(ending, { action: 'clock', now: time + 29000 })
      assert.equal(home.screen, 'welcome')
      assert.deepEqual(home.seen, [])
      return
    }
    for (const id of remaining) {
      const scene = update(state, { action: 'person', id, now: time + 30000 })
      assert.equal(scene.screen, 'experience')
      visit(scene, remaining.filter(item => item !== id), time + 30000)
    }
  }
  visit(begin(), PEOPLE, 0)
  assert.equal(checked, 120)
})

test('switches restart the clock but duplicate tags do not count or restart', () => {
  const first = update(begin(), { action: 'person', id: 'elder', now: 0 })
  const same = update(first, { action: 'person', id: 'elder', now: 1000 })
  assert.strictEqual(same, first)
  const second = update(first, { action: 'person', id: 'nomad', now: 15000 })
  assert.equal(update(second, { action: 'clock', now: 19999 }).dimension, 0)
  const again = update(second, { action: 'person', id: 'elder', now: 18000 })
  assert.deepEqual(again.seen, ['elder','nomad'])
  assert.equal(again.started, 18000)
})

test('new invitation and reset clear a visit, with monotonic revisions', () => {
  const scene = update(begin(), { action: 'person', id: 'child', now: 0 })
  const house = update(scene, { action: 'invite', now: 200 })
  assert.deepEqual(house.seen, [])
  assert.equal(house.person, null)
  assert.ok(house.revision > scene.revision)
  const reset = update(house, { action: 'reset', now: 300 })
  assert.equal(reset.screen, 'welcome')
  assert.ok(reset.revision > house.revision)
})

test('audio end, unavailable audio, watchdog and stale callbacks', () => {
  const state = update(begin(), { action: 'invite', now: 0, hasAudio: true })
  assert.equal(state.deadline, DURATION.audioLimit)
  assert.equal(update(state, { action: 'clock', now: 120000 }).screen, 'choose')
  assert.equal(update(state, { action: 'audio-ended', revision: state.revision, now: 5000 }).screen, 'choose')
  const failure = update(state, { action: 'audio-failed', revision: state.revision, now: 300 })
  assert.equal(failure.deadline, 20300)
  const scene = update(state, { action: 'person', id: 'pregnancy', now: 100 })
  for (const action of ['audio-ended','audio-failed']) assert.strictEqual(update(scene, { action, revision: state.revision, now: 1000 }), scene)
})

test('removal preserves the current scene and unknown tags are ignored', () => {
  const state = update(begin(), { action: 'person', id: 'child', now: 0 })
  assert.equal(update(state, { action: 'remove', now: 1 }).screen, 'experience')
  for (const id of ['__proto__','constructor','missing',null]) assert.strictEqual(update(state, { action: 'person', id, now: 0 }), state)
  for (const input of [null, {}, {type:'tag-present'}, {type:'tag-present',data:{kind:'character',id:'unknown'}}]) assert.equal(nfcAction(input), null)
  assert.deepEqual(nfcAction({type:'tag-present',data:{kind:'card'}}), {action:'invite'})
  assert.deepEqual(nfcAction({type:'tag-present',data:{kind:'character',id:'nomad'}}), {action:'person',id:'nomad'})
})

test('intro waits for audio completion then goes directly to character selection', () => {
  const intro = update(begin(), {action:'intro',now:0})
  assert.equal(intro.screen,'narration')
  assert.equal(update(intro,{action:'clock',now:20000}).screen,'narration')
  assert.equal(update(intro,{action:'next',now:20000}).screen,'choose')
  assert.equal(update(intro,{action:'audio-ended',revision:intro.revision,now:21230}).screen,'choose')
  assert.equal(update(intro,{action:'audio-ended',revision:intro.revision-1,now:21230}),intro)
  assert.equal(update(intro,{action:'audio-failed',revision:intro.revision,now:100}),intro)
})

test('confirmation clears at 1.8 seconds without changing the active page', () => {
  const initial = update(begin(),{action:'person',id:'child',now:0})
  assert.ok(update(initial,{action:'clock',now:1799}).confirmation)
  const settled = update(initial,{action:'clock',now:1800})
  assert.equal(settled.confirmation,null)
  assert.equal(settled.screen,'experience')
})
