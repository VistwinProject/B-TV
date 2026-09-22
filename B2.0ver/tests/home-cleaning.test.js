import {test} from 'node:test'
import assert from 'node:assert/strict'
import * as T from 'three'
import {cleaningFrame,createHomeCleaning} from '../app/homeCleaning.js'

test('counter cleaning progresses left to right, removes germs and holds clean stars',()=>{
  assert.equal(cleaningFrame(2,0).germs,1)
  assert.equal(cleaningFrame(2,1).stars,0)
  assert.equal(cleaningFrame(8,0).germs,0)
  assert.equal(cleaningFrame(8,1).germs,1)
  assert.ok(cleaningFrame(8,0).stars>0)
  for(const p of [0,.25,.5,.75,1]){assert.equal(cleaningFrame(16,p).germs,0);assert.equal(cleaningFrame(16,p).stars,1)}
  assert.deepEqual(cleaningFrame(2,.5),cleaningFrame(27,.5))
})

test('cleaning effects follow the shared clock and are exclusive to the child scene',()=>{
  const scene=new T.Scene(),camera=new T.PerspectiveCamera(),cleaning=createHomeCleaning(scene),root=scene.children[0]
  cleaning.tick('child',{cycleSeconds:2},camera)
  assert.equal(root.visible,true)
  const scan=root.getObjectByName('left-to-right-counter-scan'),left=scan.position.x
  cleaning.tick('child',{cycleSeconds:10},camera);assert.ok(scan.position.x<left)
  const positions=root.children.map(o=>o.position.toArray())
  cleaning.tick('child',{cycleSeconds:10},camera);assert.deepEqual(root.children.map(o=>o.position.toArray()),positions)
  cleaning.tick('anti-aging',{cycleSeconds:10},camera);assert.equal(root.visible,false)
  cleaning.dispose();assert.equal(scene.children.length,0)
})
