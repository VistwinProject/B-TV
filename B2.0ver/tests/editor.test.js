import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { makeDefaults, normalizeDesign, changeAt, importDesign, resizeTracks } from '../app/editor/model.js'
import { begin, advancePlayback } from '../app/playback.js'
const content = JSON.parse(readFileSync(new URL('../app/exhibition.json',import.meta.url)))
const defaults = makeDefaults(content.people,content.house)
test('editor settings round-trip all five scenes without changing initial data', () => {
  const edited = changeAt(defaults,['scenes','child','colors',0],'#123456')
  edited.scenes.elder.colors[1] = null
  edited.house.rows = [1,2,3,4]
  assert.deepEqual(importDesign(JSON.stringify(edited),defaults),edited)
  assert.notEqual(defaults.scenes.child.colors[0],'#123456')
  assert.deepEqual(Object.keys(edited.scenes),content.people.map(p=>p.id))
})
test('invalid imported values cannot inject CSS, unbounded sizes or foreign keys', () => {
  const bad = JSON.parse('{"schema":1,"__proto__":{"polluted":true},"theme":{"title":"url(https://example.com)"},"material":{"blur":999,"background":"remote"},"scenes":{"child":{"columns":[-1,999,"no"],"painHeight":999}}}')
  const safe = normalizeDesign(bad,defaults)
  assert.equal(safe.theme.title,defaults.theme.title)
  assert.equal(safe.material.blur,40)
  assert.equal(safe.material.background,'key')
  assert.deepEqual(safe.scenes.child.columns,[.15,5,defaults.scenes.child.columns[2]])
  assert.equal(safe.scenes.child.painHeight,70)
  assert.equal(Object.hasOwn(safe,'__proto__'),false)
  assert.throws(()=>importDesign('{"schema":2}',defaults))
  assert.throws(()=>changeAt(defaults,['foreign'],'#fff'))
})
test('dragging dividers preserves total space and keeps both tracks usable', () => {
  for (const delta of [-100,-.2,0,.6,100]) {
    const next=resizeTracks([1,2,3],0,delta)
    assert.equal(next[0]+next[1],3)
    assert.ok(next[0]>=.15 && next[1]>=.15-Number.EPSILON)
    assert.equal(next[2],3)
  }
})
test('editor pause excludes editing time and ignores NFC/late audio scene changes', () => {
  let state=advancePlayback(begin(0),{action:'invite',now:100})
  state=advancePlayback(state,{action:'pause',now:5100})
  for(const action of ['clock','person','next','reset','audio-ended']) assert.equal(advancePlayback(state,{action,now:100000,id:'child',revision:state.revision}),state)
  state=advancePlayback(state,{action:'remove',now:9000})
  assert.equal(state.held,null)
  state=advancePlayback(state,{action:'resume',now:105100})
  assert.equal(state.deadline,120100)
  assert.equal(advancePlayback(state,{action:'clock',now:120099}).screen,'overview')
  assert.equal(advancePlayback(state,{action:'clock',now:120100}).screen,'choose')
})
test('editing fifth scenario cannot consume its final cycle', () => {
  let state=begin(0)
  for(const p of content.people) state=advancePlayback(state,{action:'person',id:p.id,now:0})
  state=advancePlayback(state,{action:'pause',now:4000})
  state=advancePlayback(state,{action:'resume',now:104000})
  assert.equal(advancePlayback(state,{action:'clock',now:104999}).dimension,0)
  assert.equal(advancePlayback(state,{action:'clock',now:105000}).dimension,1)
  assert.equal(advancePlayback(state,{action:'clock',now:119999}).screen,'experience')
  assert.equal(advancePlayback(state,{action:'clock',now:120000}).screen,'farewell')
})

test('welcome typography migrates old presets and round-trips bounded text positions',()=>{
  const legacy=structuredClone(defaults);delete legacy.welcome
  assert.deepEqual(importDesign(JSON.stringify(legacy),defaults).welcome,defaults.welcome)
  const edited=changeAt(defaults,['welcome','subtitle'],{size:125,spacing:.12,x:-12,y:8})
  assert.deepEqual(importDesign(JSON.stringify(edited),defaults).welcome,edited.welcome)
  edited.welcome.title={size:999,spacing:-99,x:999,y:-999}
  const safe=normalizeDesign(edited,defaults)
  assert.deepEqual(safe.welcome.title,{size:200,spacing:-.1,x:80,y:-80})
})

test('house color modes preserve a balanced saved palette and share scene transparency',async()=>{
  const {houseCardColor,shuffleHouseColors,HOUSE_CARD_KEYS}=await import('../app/editor/model.js')
  const house=structuredClone(defaults.house)
  assert.ok(HOUSE_CARD_KEYS.every(key=>houseCardColor(house,key)==='#bbdcf5'))
  house.colorMode='palette';house.colorOrder=shuffleHouseColors(()=>.3)
  for(let i=0;i<5;i++)assert.equal(house.colorOrder.filter(v=>v===i).length,2)
  const edited={...defaults,house},restored=importDesign(JSON.stringify(edited),defaults)
  assert.deepEqual(restored.house,house)
  assert.equal(houseCardColor(house,'intro'),house.palette[house.colorOrder[0]])
  const old=structuredClone(defaults);delete old.house.colorMode;delete old.house.palette;delete old.house.colorOrder;delete old.house.uniformColor
  assert.equal(importDesign(JSON.stringify(old),defaults).house.colorMode,'uniform')
})

test('overview opacity migrates its old shared value then stays independent',()=>{
  const legacy=structuredClone(defaults);delete legacy.house.alpha;legacy.material.alpha=.43
  const migrated=normalizeDesign(legacy,defaults)
  assert.equal(migrated.house.alpha,.43)
  const changed=changeAt(migrated,['house','alpha'],.22)
  assert.equal(changed.material.alpha,.43)
  assert.equal(importDesign(JSON.stringify(changed),defaults).house.alpha,.22)
  assert.equal(normalizeDesign(changeAt(changed,['house','alpha'],5),defaults).house.alpha,1)
})
