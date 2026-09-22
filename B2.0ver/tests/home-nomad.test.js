import {test} from 'node:test'
import assert from 'node:assert/strict'
import * as T from 'three'
import {readFileSync} from 'node:fs'
import {nomadFrame} from '../app/homeNomad.js'
import {nomadCameraFrame} from '../app/homeCamera.js'
import {createHomeLighting,lightingFrame,LIGHT_PROFILES} from '../app/homeLighting.js'
import {createHomePeople} from '../app/homePeople.js'
import {createHomeFixtures} from '../app/homeFixtures.js'
import {createHomeWindows} from '../app/homeWindows.js'

test('nomad tour lights overview, opens blinds, visits desk before sofa, then returns',()=>{
  assert.equal(nomadCameraFrame(3).weight,0)
  assert.equal(nomadFrame(0).all,0);assert.equal(nomadFrame(4).all,1)
  assert.equal(nomadFrame(4).blinds,1)
  assert.ok(nomadFrame(6.5).blinds>0&&nomadFrame(6.5).blinds<1)
  assert.equal(nomadFrame(8.5).blinds,0)
  assert.equal(nomadCameraFrame(7).focus[0],4.91)
  assert.ok(nomadCameraFrame(13).focus[0]>2)
  assert.equal(nomadFrame(11).desk,0);assert.ok(nomadFrame(12.5).desk>0&&nomadFrame(12.5).desk<1);assert.equal(nomadFrame(14).desk,1);assert.notEqual(nomadFrame(13).mouse,0)
  assert.equal(nomadFrame(13).sofa,0)
  assert.ok(nomadCameraFrame(19).focus[0]<0);assert.equal(nomadFrame(18.5).sofa,0);assert.ok(nomadFrame(19.5).sofa>0&&nomadFrame(19.5).sofa<1);assert.equal(nomadFrame(20.5).sofa,1)
  assert.equal(nomadCameraFrame(23).weight,0)
  assert.deepEqual(nomadFrame(5),nomadFrame(30))
})
test('all eight nomad spotlights brighten together and remain vertical throughout',()=>{
  const metadata=JSON.parse(readFileSync(new URL('../public/models/home-wireframe.json',import.meta.url)))
  const data=readFileSync(new URL('../public/models/home-wireframe.bin',import.meta.url))
  const scene=new T.Scene(),lights=createHomeLighting(scene,metadata,new T.BufferAttribute(new Float32Array(data.buffer.slice(data.byteOffset,data.byteOffset+data.byteLength)),3))
  lights.select('nomad');lights.tick(0)
  const beams=scene.children[0].children.filter(o=>o.name.startsWith('downlight-beam'))
  assert.ok(beams.every(o=>o.material.uniforms.strength.value===0))
  lights.tick(2);const middle=beams[0].material.uniforms.strength.value
  assert.ok(middle>0&&middle<LIGHT_PROFILES.nomad.brightness)
  lights.tick(2)
  assert.ok(beams.every(o=>o.material.uniforms.strength.value===LIGHT_PROFILES.nomad.brightness))
  for(let i=0;i<420;i++){
    lights.tick(.05)
    assert.ok(beams.every(o=>Math.abs(o.quaternion.w-1)<.001))
  }
  lights.dispose()
})
test('nomad people, hand and mouse stay synchronized; blinds open after window shot; props clean up',()=>{
  const scene=new T.Scene(),people=createHomePeople(scene),fixtures=createHomeFixtures(scene),windows=createHomeWindows(scene)
  const state=t=>({...lightingFrame('nomad',t),cycleSeconds:t,color:new T.Color('white')})
  people.tick('nomad',state(13));fixtures.tick(10,'nomad',state(13));windows.tick(10,'nomad',state(13))
  const root=scene.getObjectByName('people-nomad');assert.equal(root.children.length,2);assert.equal(root.visible,true)
  for(const name of ['nomad-laptop','coffee-cup','nomad-laptop-beam','nomad-monitor-bar-beam','conference-tile'])assert.ok(scene.getObjectByName(name))
  const mouse=scene.getObjectByName('mouse');assert.equal(mouse.position.x,2.60+nomadFrame(13).mouse)
  const hand=root.getObjectByName('nomad-desk-worker').geometry.attributes.position.array.slice()
  people.tick('nomad',state(14));assert.notDeepEqual(root.getObjectByName('nomad-desk-worker').geometry.attributes.position.array,hand)
  assert.ok(nomadCameraFrame(13).direction[0]<0);assert.ok(nomadCameraFrame(13).direction[2]<0);assert.ok(nomadCameraFrame(13).direction[1]>1)
  assert.equal(root.getObjectByName('nomad-desk-worker').position.x,3.025)
  assert.equal(root.getObjectByName('nomad-desk-worker').position.z,-3.70)
  assert.ok(scene.getObjectByName('nomad-chair-briefcase'))
  assert.ok(scene.getObjectByName('nomad-clamp-head').position.x<-.8)
  assert.ok(scene.getObjectByName('conference-head-outline').geometry.attributes.position.count>20)
  fixtures.tick(10,'nomad',{...state(24.5),brightness:0});people.tick('nomad',{...state(24.5),brightness:0})
  assert.equal(scene.getObjectByName('fixtures-nomad').visible,false)
  assert.equal(scene.getObjectByName('coffee-cup').material.opacity,0)
  assert.equal(scene.getObjectByName('conference-head-outline').material.opacity,0)
  const blind=scene.getObjectByName('window-調光簾');assert.equal(blind.children[2].rotation.z,0)
  people.dispose();fixtures.dispose();windows.dispose();assert.equal(scene.children.length,0)
})
