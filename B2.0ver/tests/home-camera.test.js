import {test} from 'node:test'
import assert from 'node:assert/strict'
import {childCameraFrame} from '../app/homeCamera.js'
import {SCENE_VIEWS} from '../app/homeFixtures.js'

test('child tour preserves entry, covers cleaning, visits reading, and returns to overview',()=>{
  for(const t of [0,1,2,23,24]){const f=childCameraFrame(t);assert.equal(f.zoom,1);assert.equal(f.weight,0);assert.deepEqual(f.direction,SCENE_VIEWS.child)}
  for(const t of [4,8,12,14]){const f=childCameraFrame(t);assert.equal(f.weight,1);assert.ok(f.focus[0]>3);assert.ok(f.zoom>2)}
  for(const t of [17,19,20]){const f=childCameraFrame(t);assert.equal(f.weight,1);assert.ok(f.focus[0]<0);assert.ok(f.zoom>2)}
  assert.deepEqual(childCameraFrame(0),childCameraFrame(25))
  for(const boundary of [2,4,14.5,17,20.5,23]){
    const a=childCameraFrame(boundary-.0001),b=childCameraFrame(boundary+.0001)
    for(const key of ['zoom','weight'])assert.ok(Math.abs(a[key]-b[key])<1e-6)
    for(let j=0;j<3;j++)assert.ok(Math.abs(a.direction[j]-b.direction[j])<1e-6)
  }
})

test('anti-aging tour preserves entry then visits sofa, stretching and eye-level blinds',async()=>{
  const {antiAgingCameraFrame:frame}=await import('../app/homeCamera.js')
  for(const t of [0,3.2,20.5,24]){const f=frame(t);assert.equal(f.weight,0);assert.equal(f.zoom,1);assert.deepEqual(f.direction,SCENE_VIEWS['anti-aging'])}
  assert.equal(frame(6).focus[0],-1.46)
  assert.equal(frame(10).focus[0],.7)
  assert.equal(frame(15).focus[0],4.91);assert.ok(frame(15).direction[1]<.3)
  assert.deepEqual(frame(0),frame(25))
})

test('blinds close during their close-up, stay shut in darkness and reopen at dawn',async()=>{
  const {blindsClosure,createHomeWindows}=await import('../app/homeWindows.js')
  const T=await import('three')
  assert.equal(blindsClosure(12),0);assert.ok(blindsClosure(13.5)>0&&blindsClosure(13.5)<1)
  assert.equal(blindsClosure(17),1);assert.equal(blindsClosure(24),1);assert.equal(blindsClosure(25),0)
  const scene=new T.Scene(),windows=createHomeWindows(scene)
  windows.tick(1,'anti-aging',{cycleSeconds:17,windowLight:0})
  const root=scene.getObjectByName('window-百葉簾')
  assert.equal(root.children.filter(o=>Math.abs(o.rotation.z-Math.PI/2)<1e-6).length,24)
  windows.dispose();assert.equal(scene.children.length,0)
})

 test('anti-aging finishes closing blinds and returning to overview before dimming',async()=>{
  const {antiAgingCameraFrame:camera}=await import('../app/homeCamera.js')
  const {lightingFrame}=await import('../app/homeLighting.js')
  const {blindsClosure}=await import('../app/homeWindows.js')
  assert.equal(blindsClosure(15),1);assert.equal(camera(15).weight,1)
  for(let t=12;t<=17.5;t+=.25)assert.equal(lightingFrame('anti-aging',t).brightness,.85)
  assert.equal(camera(17.5).weight,0)
  let previous=.85
  for(let t=17.5;t<=20;t+=.25){const f=lightingFrame('anti-aging',t);assert.equal(camera(t).weight,0);assert.ok(f.brightness<=previous);previous=f.brightness}
  assert.equal(previous,0)
  for(const t of [20,21,22,23,24])assert.equal(lightingFrame('anti-aging',t).brightness,0)
})
