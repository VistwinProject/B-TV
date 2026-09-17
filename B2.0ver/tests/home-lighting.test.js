import {test} from 'node:test'
import assert from 'node:assert/strict'
import * as T from 'three'
import {readFileSync} from 'node:fs'
import {LIGHT_PROFILES,lightingFrame,createHomeLighting} from '../app/homeLighting.js'
test('five lighting scenes repeat smoothly, retaining the specified temperature ranges',()=>{
  assert.equal(Object.keys(LIGHT_PROFILES).length,5)
  for(const id of Object.keys(LIGHT_PROFILES)){
    assert.deepEqual(lightingFrame(id,2),lightingFrame(id,27))
    assert.equal(lightingFrame(id,0).brightness,id==='anti-aging'?.85:0)
    assert.ok(lightingFrame(id,id==='anti-aging'?23.999:24.999).brightness<.001)
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
  assert.equal(scene.children.length,1);assert.equal(scene.children[0].children.length,17)
  for(const id of Object.keys(LIGHT_PROFILES)){lights.select(id);for(let i=0;i<660;i++)assert.ok(Number.isFinite(lights.tick(1/60).brightness))}
  lights.dispose();assert.equal(scene.children.length,0)
})

 test('anti-aging begins in daylight and progressively darkens until lights are off',()=>{
  assert.equal(lightingFrame('anti-aging',0).daylight,1)
  let prior=lightingFrame('anti-aging',0)
  for(let t=.1;t<20;t+=.1){const current=lightingFrame('anti-aging',t);assert.ok(current.daylight<=prior.daylight);assert.ok(current.brightness<=prior.brightness);prior=current}
  assert.equal(lightingFrame('anti-aging',9).daylight,0)
  assert.equal(lightingFrame('anti-aging',20).brightness,0)
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

test('anti-aging keeps the lamps on after the background becomes dark',()=>{assert.equal(lightingFrame('anti-aging',10).daylight,0);assert.equal(lightingFrame('anti-aging',12).brightness,.85);assert.ok(lightingFrame('anti-aging',19).brightness<.85);assert.equal(lightingFrame('anti-aging',20).brightness,0)})

 test('anti-aging holds lights off through 24s and eases continuously back to daylight at 25s',()=>{
  for(let t=20;t<=24;t+=.1){const f=lightingFrame('anti-aging',t);assert.equal(f.brightness,0);assert.equal(f.daylight,0)}
  const middle=lightingFrame('anti-aging',24.5);assert.equal(middle.brightness,.425);assert.equal(middle.daylight,.5);assert.equal(middle.kelvin,3850)
  const end=lightingFrame('anti-aging',24.99999),start=lightingFrame('anti-aging',25);
  for(const key of ['brightness','daylight','kelvin','windowLight'])assert.ok(Math.abs(end[key]-start[key])<.00001,key)
})

test('child reading spotlight tracks scene brightness down to zero',async()=>{
  const {createHomeFixtures}=await import('../app/homeFixtures.js')
  const scene=new T.Scene(),fixtures=createHomeFixtures(scene)
  const beam=scene.getObjectByName('book-reading-spotlight'),state={brightness:.75,daylight:0,color:new T.Color('#ffffff')}
  for(let i=0;i<120;i++)fixtures.tick(1/60,'child',state)
  assert.ok(beam.material.uniforms.strength.value>0)
  fixtures.tick(1/60,'child',{...state,brightness:0});assert.equal(beam.material.uniforms.strength.value,0)
  fixtures.dispose();assert.equal(scene.children.length,0)
})

test('elder floor lamps flank the TV and their bulbs extinguish with downlights',async()=>{
  const {createHomeFixtures}=await import('../app/homeFixtures.js')
  const scene=new T.Scene(),fixtures=createHomeFixtures(scene),bulbs=[]
  scene.traverse(o=>{if(o.name==='floor-lamp-bulb')bulbs.push(o)})
  assert.equal(bulbs.length,2);assert.ok(bulbs[0].position.x<-.85&&bulbs[1].position.x>-.85)
  for(const bulb of bulbs)assert.equal(bulb.position.z,-4.7)
  const state={brightness:1,daylight:0,color:new T.Color('#ffffff')}
  fixtures.tick(1,'elder',state);for(const bulb of bulbs)assert.ok(bulb.material.opacity>0)
  fixtures.tick(1,'elder',{...state,brightness:0});for(const bulb of bulbs)assert.equal(bulb.material.opacity,0)
  fixtures.dispose()
})

test('elder walking spotlights begin vertical and ease toward the path after the eye-level turn',()=>{
  const metadata=JSON.parse(readFileSync(new URL('../public/models/home-wireframe.json',import.meta.url)))
  const b=readFileSync(new URL('../public/models/home-wireframe.bin',import.meta.url))
  const positions=new T.BufferAttribute(new Float32Array(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength)),3)
  const scene=new T.Scene(),lights=createHomeLighting(scene,metadata,positions)
  lights.select('elder');lights.tick(6)
  const pools=scene.children[0].children.filter(o=>o.userData.elderWalkingPath)
  assert.equal(pools.length,3)
  const starts=pools.map(o=>o.position.clone())
  const beams=pools.map(o=>scene.getObjectByName(o.name.replace('pool','beam')))
  for(const beam of beams)assert.ok(beam.quaternion.angleTo(new T.Quaternion())<1e-6)
  lights.tick(2);const middle=pools.map(o=>o.position.clone())
  lights.tick(2)
  pools.forEach((o,i)=>{assert.ok(starts[i].distanceTo(middle[i])>0);assert.ok(middle[i].distanceTo(starts[i].clone().lerp(o.position,.5))<1e-6)})
  lights.tick(7)
  pools.forEach((o,i)=>assert.ok(o.position.distanceTo(starts[i])<1e-6))
  lights.dispose()
})
