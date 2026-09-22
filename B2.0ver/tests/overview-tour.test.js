import {test} from 'node:test'
import assert from 'node:assert/strict'
import * as T from 'three'
import {overviewTourFrame,createOverviewScan} from '../app/overviewTour.js'
test('overview returns to opening direction before scanning and holds after scan',()=>{
 assert.notDeepEqual(overviewTourFrame(6).direction,overviewTourFrame(0).direction)
 assert.deepEqual(overviewTourFrame(8).direction,overviewTourFrame(0).direction)
 assert.equal(overviewTourFrame(8).scanning,false)
 assert.equal(overviewTourFrame(9).scanning,true)
 assert.equal(overviewTourFrame(14).scanning,false)
 assert.equal(overviewTourFrame(20).scan,1)
})
test('scan plane travels from ceiling to floor and releases geometry',()=>{
 const scene=new T.Scene(),scan=createOverviewScan(scene,new T.Box3(new T.Vector3(-2,0,-3),new T.Vector3(2,3,3)))
 scan.tick(overviewTourFrame(9));assert.equal(scene.children[0].position.y,3)
 scan.tick(overviewTourFrame(11.5));assert.equal(scene.children[0].position.y,1.5)
 scan.tick(overviewTourFrame(14));assert.equal(scene.children[0].position.y,0);assert.equal(scene.children[0].visible,false)
 scan.dispose();assert.equal(scene.children.length,0)
})

test('overview makes a continuous full revolution and lights only after scanning',()=>{
 const frames=Array.from({length:101},(_,i)=>overviewTourFrame(2+i*.06))
 let total=0
 for(let i=1;i<frames.length;i++){
  const a=Math.atan2(frames[i-1].direction[0],frames[i-1].direction[2]),b=Math.atan2(frames[i].direction[0],frames[i].direction[2])
  total+=Math.atan2(Math.sin(b-a),Math.cos(b-a))
 }
 assert.ok(Math.abs(Math.abs(total)-Math.PI*2)<1e-8)
 assert.equal(overviewTourFrame(13.9).light,0)
 assert.equal(overviewTourFrame(14).light,0)
 assert.equal(overviewTourFrame(15).light,.5)
 assert.equal(overviewTourFrame(16).light,1)
})
