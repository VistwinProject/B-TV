import {test} from 'node:test'
import assert from 'node:assert/strict'
import * as T from 'three'
import {readFileSync} from 'node:fs'
import {LIGHT_PROFILES,lightingFrame,createHomeLighting} from '../app/homeLighting.js'
test('five lighting scenes repeat smoothly, retaining the specified temperature ranges',()=>{
  assert.equal(Object.keys(LIGHT_PROFILES).length,5)
  for(const id of Object.keys(LIGHT_PROFILES)){
    assert.deepEqual(lightingFrame(id,2),lightingFrame(id,22))
    assert.equal(lightingFrame(id,0).brightness,id==='anti-aging'?.85:0)
    assert.ok(lightingFrame(id,19.999).brightness<.001)
  }
  assert.equal(lightingFrame('anti-aging',3).kelvin,5000)
  assert.equal(lightingFrame('anti-aging',10).kelvin,2700)
  assert.ok(lightingFrame('pregnancy',5).kelvin>=1800&&lightingFrame('pregnancy',5).kelvin<=2700)
  assert.ok(lightingFrame('nomad',5).kelvin>=5000&&lightingFrame('nomad',5).kelvin<=6500)
})
test('eight downlights originate at source lamps and dispose without leaving actors or props',()=>{
  const metadata=JSON.parse(readFileSync(new URL('../public/models/home-wireframe.json',import.meta.url)))
  const b=readFileSync(new URL('../public/models/home-wireframe.bin',import.meta.url))
  const positions=new T.BufferAttribute(new Float32Array(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength)),3)
  const scene=new T.Scene(),lights=createHomeLighting(scene,metadata,positions)
  assert.equal(scene.children.length,1);assert.equal(scene.children[0].children.length,16)
  for(const id of Object.keys(LIGHT_PROFILES)){lights.select(id);for(let i=0;i<660;i++)assert.ok(Number.isFinite(lights.tick(1/60).brightness))}
  lights.dispose();assert.equal(scene.children.length,0)
})

 test('anti-aging begins in daylight and progressively darkens until lights are off',()=>{
  assert.equal(lightingFrame('anti-aging',0).daylight,1)
  let prior=lightingFrame('anti-aging',0)
  for(let t=.1;t<20;t+=.1){const current=lightingFrame('anti-aging',t);assert.ok(current.daylight<=prior.daylight);assert.ok(current.brightness<=prior.brightness);prior=current}
  assert.equal(lightingFrame('anti-aging',9).daylight,0)
  assert.equal(lightingFrame('anti-aging',19).brightness,0)
  assert.equal(lightingFrame('child',4).daylight,0)
})

test('five distinct camera directions and fixture groups crossfade and release resources',async()=>{
  const {SCENE_VIEWS,createHomeFixtures}=await import('../app/homeFixtures.js')
  assert.equal(new Set(Object.values(SCENE_VIEWS).map(v=>v.join(','))).size,5)
  const scene=new T.Scene(),fixtures=createHomeFixtures(scene)
  for(const id of Object.keys(SCENE_VIEWS)){
    for(let i=0;i<180;i++)fixtures.tick(1/60,id,{brightness:.8,daylight:0,color:new T.Color('#ffffff')})
    const active=scene.children.find(g=>g.name===`fixtures-${id}`)
    assert.ok(active.visible);assert.ok(active.children.length>0)
    scene.updateMatrixWorld(true);scene.traverse(o=>assert.ok(o.matrixWorld.elements.every(Number.isFinite)))
  }
  fixtures.dispose();assert.equal(scene.children.length,0)
})

test('anti-aging keeps the lamps on after the background becomes dark',()=>{assert.equal(lightingFrame('anti-aging',10).daylight,0);assert.equal(lightingFrame('anti-aging',12).brightness,.85);assert.ok(lightingFrame('anti-aging',16).brightness<.85);assert.equal(lightingFrame('anti-aging',19).brightness,0)})
