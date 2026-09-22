import {test} from 'node:test'
import assert from 'node:assert/strict'
import * as T from 'three'
import {createHomePeople} from '../app/homePeople.js'
import {createHomeFixtures} from '../app/homeFixtures.js'
const state=t=>({brightness:1,daylight:0,cycleSeconds:t,color:new T.Color('white')})
test('invisible people retain vertex buffers until their scene becomes visible',()=>{
 const scene=new T.Scene(),people=createHomePeople(scene)
 const mother=scene.getObjectByName('pregnancy-mother-hand-1').geometry.attributes.position
 const worker=scene.getObjectByName('nomad-desk-worker').geometry.attributes.position
 people.tick('elder',state(13));assert.equal(mother.version,0);assert.equal(worker.version,0)
 people.tick('pregnancy',state(20));assert.ok(mother.version>0);assert.equal(worker.version,0)
 const version=mother.version
 people.tick('nomad',state(13));assert.equal(mother.version,version);assert.ok(worker.version>0)
 const deskVersion=worker.version
 people.tick('nomad',{...state(14),brightness:0});assert.equal(worker.version,deskVersion)
 people.tick('nomad',state(14));assert.ok(worker.version>deskVersion)
 people.dispose()
})
test('hidden props stop uploading particle buffers and resume on selection',()=>{
 const scene=new T.Scene(),fixtures=createHomeFixtures(scene)
 const root=scene.getObjectByName('fixtures-pregnancy'),particles=[]
 root.traverse(o=>{if(o.isPoints)particles.push(o.geometry.attributes.position)})
 assert.ok(particles.length)
 const before=particles.map(p=>p.version)
 fixtures.tick(10,'elder',state(13));assert.deepEqual(particles.map(p=>p.version),before)
 fixtures.tick(10,'pregnancy',state(13));assert.ok(particles.some((p,i)=>p.version>before[i]))
 fixtures.tick(10,'elder',state(14));const hidden=particles.map(p=>p.version)
 fixtures.tick(1,'elder',state(15));assert.deepEqual(particles.map(p=>p.version),hidden)
 fixtures.dispose()
})
