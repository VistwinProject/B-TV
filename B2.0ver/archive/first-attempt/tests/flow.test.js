import test from 'node:test'
import assert from 'node:assert/strict'
import { reducer, initial } from '../src/flow.js'
import { PERSONA_ORDER, PERSONAS } from '../src/personas.js'
import { SCENES, DIMENSION_ORDER } from '../src/scenes.js'
import { scenePosition, OUTRO_MS, LEAD_FALLBACK_MS } from '../src/timing.js'
import { existsSync, readFileSync } from 'node:fs'

const invitation = { type: 'tag-present', data: { kind: 'card', id: 'invite' } }
const character = id => ({ type: 'tag-present', data: { kind: 'character', id } })
const done = state => reducer(state, { type: 'scene-done', run: state.sceneRun })

test('invitation skips optional intro and advances to five choices', () => {
  const house = reducer(initial, invitation)
  assert.equal(house.phase, 'house')
  assert.equal(reducer(house, { type: 'op-advance' }).phase, 'character')
  assert.equal(LEAD_FALLBACK_MS, 20000)
})
test('all 120 persona orders finish only AFTER the fifth complete cycle', () => {
  function permutations(items) {
    return items.length ? items.flatMap((item, i) => permutations(items.filter((_, j) => j !== i)).map(rest => [item, ...rest])) : [[]]
  }
  for (const order of permutations(PERSONA_ORDER)) {
    let state = reducer(initial, invitation)
    for (const [index, id] of order.entries()) {
      state = reducer(state, character(id))
      assert.equal(state.phase, 'scene')
      assert.equal(state.visited.length, index + 1)
      state = done(state)
      assert.equal(state.phase, index === 4 ? 'outro' : 'loop')
    }
    assert.equal(reducer(state, { type: 'outro-done' }).phase, 'idle')
  }
  assert.equal(OUTRO_MS, 9000)
})
test('continuous reads and repeated personas do not inflate completion', () => {
  const house = reducer(initial, invitation)
  assert.strictEqual(reducer(house, invitation), house)
  const choices = reducer(house, { type: 'op-advance' })
  assert.strictEqual(reducer(choices, invitation), choices)
  let state = reducer(house, character('child'))
  const run = state.sceneRun
  for (let i = 0; i < 20; i++) state = reducer(state, character('child'))
  assert.equal(state.sceneRun, run)
  assert.deepEqual(state.visited, ['child'])
  assert.equal(done(state).phase, 'loop')
})
test('return to a prior persona replays it without counting it twice', () => {
  let state = reducer(initial, character('child'))
  state = reducer(state, character('elder'))
  state = reducer(state, character('child'))
  assert.equal(state.sceneRun, 3)
  assert.deepEqual(state.visited, ['child', 'elder'])
  assert.equal(state.phase, 'scene')
})
test('removed tag or disconnected reader preserves active experience', () => {
  const state = reducer(initial, character('nomad'))
  for (const type of ['tag-remove', 'reader-disconnected']) {
    const next = reducer(state, { type })
    assert.equal(next.phase, 'scene')
    assert.equal(next.character, 'nomad')
    assert.equal(next.onReader, null)
  }
})
test('a new invitation clears the visitor and restarts the house sequence', () => {
  const state = reducer(reducer(initial, character('pregnancy')), invitation)
  assert.equal(state.phase, 'house')
  assert.equal(state.character, null)
  assert.deepEqual(state.visited, [])
})
test('stale completion and ripple callbacks cannot end a newer scene', () => {
  const old = reducer(initial, character('child'))
  const current = reducer(old, character('nomad'))
  assert.strictEqual(reducer(current, { type: 'scene-done', run: old.sceneRun }), current)
  assert.strictEqual(reducer(current, { type: 'confirm-clear', seq: old.seq }), current)
  assert.equal(reducer(current, { type: 'confirm-clear', seq: current.seq }).confirm, null)
})
test('unknown tags including inherited object keys are ignored', () => {
  for (const id of ['missing', '__proto__', 'constructor', null]) assert.strictEqual(reducer(initial, character(id)), initial)
  assert.strictEqual(reducer(initial, { type: 'tag-present' }), initial)
})
test('reset and outro keep connection status but clear visitor progress', () => {
  let state = reducer(initial, { type: 'ws-status', status: 'connected' })
  state = reducer(state, { type: 'reader-connected' })
  state = reducer(state, character('elder'))
  state = reducer(state, { type: 'op-outro' })
  for (const type of ['outro-done', 'op-reset']) {
    const next = reducer(state, { type })
    assert.equal(next.phase, 'idle')
    assert.equal(next.wsStatus, 'connected')
    assert.equal(next.connected, true)
    assert.deepEqual(next.visited, [])
  }
})
test('dimension boundaries and looping follow a 20 second clock', () => {
  for (const [elapsed, dim, completed] of [[0,0,false],[4999,0,false],[5000,1,false],[10000,2,false],[15000,3,false],[19999,3,false],[20000,0,true],[45000,1,true]]) {
    assert.equal(scenePosition(elapsed).dim, dim)
    assert.equal(scenePosition(elapsed).completed, completed)
  }
})
test('all 20 dimensions and referenced media are available locally', () => {
  for (const id of PERSONA_ORDER) {
    for (const dimension of DIMENSION_ORDER) {
      const data = SCENES[id][dimension]
      assert.ok(data.headline && data.detail)
      assert.ok(data.metrics.length)
    }
    if (PERSONAS[id].photo) assert.ok(existsSync(new URL('../public/' + PERSONAS[id].photo, import.meta.url)))
  }
  for (const path of ['video/house-tour.mp4', 'bg/anlb-key.jpg', 'icons/anlb.png', 'icons/personas.png']) {
    assert.ok(readFileSync(new URL('../public/' + path, import.meta.url)).length > 1024)
  }
})
