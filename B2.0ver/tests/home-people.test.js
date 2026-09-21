import {test} from 'node:test'
import assert from 'node:assert/strict'
import * as T from 'three'
import {createHomePeople} from '../app/homePeople.js'
import {lightingFrame} from '../app/homeLighting.js'

test('each static figure has a single connected surface through torso and joints',()=>{
  const scene=new T.Scene(),people=createHomePeople(scene)
  assert.equal(scene.children[0].children.length,2)
  for(const mesh of [...scene.children[0].children,...scene.getObjectByName('people-nomad').children]){
    const {position}=mesh.geometry.attributes,indices=mesh.geometry.index.array
    assert.ok([...position.array].every(Number.isFinite))
    const neighbors=Array.from({length:position.count},()=>[])
    for(let i=0;i<indices.length;i+=3)for(let j=0;j<3;j++){
      const a=indices[i+j],b=indices[i+(j+1)%3];neighbors[a].push(b);neighbors[b].push(a)
    }
    const seen=new Set([0]),pending=[0]
    while(pending.length)for(const n of neighbors[pending.pop()])if(!seen.has(n)){seen.add(n);pending.push(n)}
    assert.equal(seen.size,position.count,mesh.name)
  }
  people.dispose();assert.equal(scene.children.length,0)
})

test('figures fade with lighting and stay absent throughout the all-off hold',()=>{
  const scene=new T.Scene(),people=createHomePeople(scene),root=scene.children[0],mesh=root.children[0]
  people.tick('anti-aging',lightingFrame('anti-aging',12));const full=mesh.children[0].material.opacity
  people.tick('anti-aging',lightingFrame('anti-aging',19));assert.ok(mesh.children[0].material.opacity<full)
  for(const t of [20,21,23,24]){
    people.tick('anti-aging',lightingFrame('anti-aging',t));assert.equal(root.visible,false);assert.equal(mesh.material.opacity,0);assert.equal(mesh.children[0].material.opacity,0)
  }
  people.tick('anti-aging',lightingFrame('anti-aging',24.5));assert.equal(root.visible,true);assert.ok(mesh.children[0].material.opacity>0)
  people.tick('child',lightingFrame('child',5));assert.equal(root.visible,false)
  people.dispose()
})

test('child scene shows a seated companion and smaller reader with a book, independently of the couple',()=>{
  const scene=new T.Scene(),people=createHomePeople(scene)
  people.tick('child',lightingFrame('child',8))
  const root=scene.getObjectByName('people-child'),child=root.getObjectByName('child-holding-book'),adult=root.getObjectByName('adult-reading-companion')
  assert.equal(root.visible,true);assert.equal(scene.getObjectByName('people-anti-aging').visible,false)
  assert.ok(child.position.x<adult.position.x)
  child.geometry.computeBoundingBox();adult.geometry.computeBoundingBox()
  assert.ok(child.geometry.boundingBox.max.y<adult.geometry.boundingBox.max.y)
  assert.ok(root.getObjectByName('child-open-book'))
  people.tick('elder',lightingFrame('elder',8));assert.equal(root.visible,false)
  people.dispose();assert.equal(scene.children.length,0)
})
