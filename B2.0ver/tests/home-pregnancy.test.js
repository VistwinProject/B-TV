import {test} from 'node:test'
import assert from 'node:assert/strict'
import * as T from 'three'
import {pregnancyFrame} from '../app/homePregnancy.js'
import {pregnancyCameraFrame} from '../app/homeCamera.js'
import {createHomePeople} from '../app/homePeople.js'
import {lightingFrame} from '../app/homeLighting.js'

test('care tour opens curtains with lights, visits father, baby and mother, and returns',()=>{
  for(const t of [0,1,2,3])assert.equal(pregnancyFrame(t).curtain,1-lightingFrame('pregnancy',t).brightness/.3)
  assert.equal(pregnancyCameraFrame(0).weight,0)
  assert.ok(pregnancyCameraFrame(12).focus[0]>1)
  assert.equal(pregnancyCameraFrame(16).focus[0],.55)
  assert.equal(pregnancyCameraFrame(20).focus[0],-1.05)
  assert.equal(pregnancyCameraFrame(24).weight,0)
  assert.deepEqual(pregnancyFrame(0),pregnancyFrame(25))
})
test('care gestures animate only during their shots and restore without drift',()=>{
  const scene=new T.Scene(),people=createHomePeople(scene),root=scene.getObjectByName('people-pregnancy')
  const frame=t=>people.tick('pregnancy',{...lightingFrame('pregnancy',t),cycleSeconds:t})
  for(const [name,time] of [['pregnancy-feeding-father',12.5],['pregnancy-cradle-baby',16],['pregnancy-mother-hand-1',20]]){
    const actor=root.getObjectByName(name);frame(4);const base=actor.geometry.attributes.position.array.slice()
    frame(time);assert.notDeepEqual(actor.geometry.attributes.position.array,base)
    frame(23);assert.deepEqual(actor.geometry.attributes.position.array,base)
  }
  const mother=root.getObjectByName('pregnancy-mother'),belly=mother.geometry.attributes.position.array.slice();frame(19.5);assert.deepEqual(mother.geometry.attributes.position.array,belly)
  frame(0);assert.equal(root.visible,false)
  frame(3);assert.equal(root.visible,true)
  const baby=root.getObjectByName('pregnancy-cradle-baby');baby.geometry.computeBoundingBox()
  assert.ok(baby.geometry.boundingBox.min.y+baby.position.y>.44)
  people.tick('nomad',{...lightingFrame('nomad',5),cycleSeconds:5});assert.equal(root.visible,false)
  people.dispose();assert.equal(scene.children.length,0)
})

test('sink scan removes bottle germs in sequence and uses scene-colored stars without replaying late',async()=>{
  const {createHomeCleaning}=await import('../app/homeCleaning.js')
  const scene=new T.Scene(),cleaning=createHomeCleaning(scene,'pregnancy'),camera=new T.PerspectiveCamera(),color=new T.Color('#ffb45e')
  const root=scene.getObjectByName('pregnancy-counter-cleaning'),icons=root.children.filter(o=>o.name.startsWith('cleanliness-icon'))
  const tick=t=>cleaning.tick('pregnancy',{cycleSeconds:t,color},camera)
  tick(4);assert.equal(icons.length,6);assert.ok(icons.every(o=>o.material.uniforms.germs.value===1))
  tick(6.5);assert.ok(icons[0].material.uniforms.germs.value<icons[2].material.uniforms.germs.value)
  tick(9);assert.ok(icons.every(o=>o.material.uniforms.germs.value===0&&o.material.uniforms.stars.value>0))
  assert.ok(icons[0].material.uniforms.starColor.value.equals(color))
  tick(24);assert.equal(root.getObjectByName('left-to-right-counter-scan').material.uniforms.alpha.value,0)
  assert.equal(pregnancyCameraFrame(6).focus[0],3)
  cleaning.dispose();assert.equal(scene.children.length,0)
})
