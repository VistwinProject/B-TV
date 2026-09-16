import * as THREE from 'three'
import {createHomeWindows} from './homeWindows.js'
import { createHomeLighting } from './homeLighting.js'
import { createHomeVentilation } from './homeVentilation.js'
import {createHomeFixtures,SCENE_VIEWS} from './homeFixtures.js'

// Line data is extracted from 3d.glb by scripts/build-home-wireframe.mjs.
// Fixed orthographic camera with simplified translucent furniture and source-model lamps.
export async function createHomeScene(host, { signal, onBeat } = {}) {
  const base = `${import.meta.env.BASE_URL}models/home-wireframe`
  const [metadata, buffer, fillBuffer] = await Promise.all([
    fetch(`${base}.json`, { signal }).then(r => { if (!r.ok) throw new Error('Model metadata unavailable'); return r.json() }),
    fetch(`${base}.bin`, { signal }).then(r => { if (!r.ok) throw new Error('Model edges unavailable'); return r.arrayBuffer() }),
    fetch(`${import.meta.env.BASE_URL}models/home-fill.bin`, { signal }).then(r => { if (!r.ok) throw new Error('Model fills unavailable'); return r.arrayBuffer() }),
  ])
  signal?.throwIfAborted()
  if (buffer.byteLength !== metadata.segments * 6 * 4) throw new Error('Incomplete model edges')
  const geometry = new THREE.BufferGeometry()
  const position = new THREE.BufferAttribute(new Float32Array(buffer),3)
  geometry.setAttribute('position',position)
  if(fillBuffer.byteLength!==metadata.fillTriangles*9*4) throw new Error('Incomplete furniture fills')
  const fillGeometry=new THREE.BufferGeometry()
  fillGeometry.setAttribute('position',new THREE.BufferAttribute(new Float32Array(fillBuffer),3))
  const fillMaterial=new THREE.MeshBasicMaterial({color:'#bcbcbc',transparent:true,opacity:.10,side:THREE.DoubleSide,depthWrite:false})
  const partitionMaterial=new THREE.MeshBasicMaterial({color:'#eeeeee',transparent:true,opacity:.12,side:THREE.DoubleSide,depthWrite:false})
  const lampMaterial=new THREE.MeshBasicMaterial({color:'#ffffff',transparent:true,opacity:.7,side:THREE.DoubleSide,depthWrite:false})
  let fillCursor=0
  for(const wall of [...(metadata.partitionWalls || []).map(w=>({...w,material:1})),...(metadata.spotlightObjects || []).filter(w=>w.vertexCount>0).map(w=>({...w,material:2}))].sort((a,b)=>a.firstVertex-b.firstVertex)) {
    if(wall.firstVertex>fillCursor) fillGeometry.addGroup(fillCursor,wall.firstVertex-fillCursor,0)
    fillGeometry.addGroup(wall.firstVertex,wall.vertexCount,wall.material)
    fillCursor=wall.firstVertex+wall.vertexCount
  }
  if(fillCursor<fillGeometry.getAttribute('position').count) fillGeometry.addGroup(fillCursor,fillGeometry.getAttribute('position').count-fillCursor,0)
  const fillMesh=new THREE.Mesh(fillGeometry,[fillMaterial,partitionMaterial,lampMaterial])
  const scene = new THREE.Scene(); scene.background = new THREE.Color('#000000'); scene.add(fillMesh)
  const bounds = new THREE.Box3(new THREE.Vector3(...metadata.bounds.min),new THREE.Vector3(...metadata.bounds.max))
  const a=metadata.shellAlignment
  const wallGeometry=new THREE.BufferGeometry()
  wallGeometry.setAttribute('position',new THREE.Float32BufferAttribute([
    a.maxX,a.floorY,a.minZ, a.maxX,a.topY,a.minZ, a.maxX,a.topY,a.maxZ,
    a.maxX,a.floorY,a.minZ, a.maxX,a.topY,a.maxZ, a.maxX,a.floorY,a.maxZ,
  ],3))
  const wallMaterial=new THREE.MeshBasicMaterial({color:'#eeeeee',transparent:true,opacity:.12,side:THREE.DoubleSide,depthWrite:false})
  const walls=new THREE.Mesh(wallGeometry,wallMaterial);walls.renderOrder=-1;scene.add(walls)
  // TV remains in front of the sofa as an outline only, without wall or screen fill.
  const addedGeometries=[], addedMaterials=[]
  for(const [width,height,z] of [[1.95,1.1,a.minZ+.035]]) {
    const plane=new THREE.PlaneGeometry(width,height), edge=new THREE.EdgesGeometry(plane)
    plane.dispose()
    const ink=new THREE.LineBasicMaterial({color:'#ffffff',transparent:true,opacity:.8})
    const outline=new THREE.LineSegments(edge,ink);outline.position.set(-.85,1.4,z);outline.renderOrder=2;scene.add(outline)
    addedGeometries.push(edge);addedMaterials.push(ink)
  }
  const screenGeometry=new THREE.PlaneGeometry(1.95,1.1)
  const screenMaterial=new THREE.MeshBasicMaterial({color:'#000000',transparent:true,opacity:.38,side:THREE.DoubleSide,depthWrite:false})
  const screen=new THREE.Mesh(screenGeometry,screenMaterial);screen.position.set(-.85,1.4,a.minZ+.037);scene.add(screen)
  addedGeometries.push(screenGeometry);addedMaterials.push(screenMaterial)
  const center=bounds.getCenter(new THREE.Vector3()), size=bounds.getSize(new THREE.Vector3())
  const colors = new Float32Array(position.count*3)
  const low = new THREE.Color('#888888'), high = new THREE.Color('#ffffff'), color = new THREE.Color()
  for(let i=0;i<position.count;i++) {
    const height=(position.getY(i)-bounds.min.y)/Math.max(size.y,.001)
    color.copy(low).lerp(high,.3+.7*height); color.toArray(colors,i*3)
  }
  for(const lamp of metadata.spotlightObjects || []) {
    for(let i=lamp.firstSegment*2;i<(lamp.firstSegment+lamp.segments)*2;i++) colors.set([1,1,1],i*3)
  }
  geometry.setAttribute('color',new THREE.BufferAttribute(colors,3))
  const material = new THREE.LineBasicMaterial({vertexColors:true,transparent:true,opacity:.78,depthWrite:false})
  const lines=new THREE.LineSegments(geometry,material); lines.renderOrder=1; scene.add(lines)
  const camera = new THREE.OrthographicCamera(-1,1,1,-1,.01,Math.max(size.length()*8,100))
  camera.position.copy(center).add(new THREE.Vector3(-1,1.15,-1.35).normalize().multiplyScalar(size.length()*2))
  camera.lookAt(center); camera.updateMatrixWorld(true)
  // Project actual world-space vertices once to frame the complete model accurately.
  const projected = new THREE.Box3(), point=new THREE.Vector3()
  for(let i=0;i<position.count;i++) projected.expandByPoint(point.fromBufferAttribute(position,i).applyMatrix4(camera.matrixWorldInverse))
  const viewCenter=projected.getCenter(new THREE.Vector3()), viewSize=projected.getSize(new THREE.Vector3())
  // Center the card on the source model's sofa / coffee-table zone.
  // Crop the overall room composition rather than changing model geometry or angle.
  const livingCenter=new THREE.Vector3(-.85,.85,-1.95).applyMatrix4(camera.matrixWorldInverse)
  // Fit the complete room by default; the editor can deliberately zoom into it.
  let renderer
  try { renderer = new THREE.WebGLRenderer({antialias:true}) }
  catch(error) { geometry.dispose(); material.dispose(); fillGeometry.dispose(); fillMaterial.dispose(); partitionMaterial.dispose(); lampMaterial.dispose(); wallGeometry.dispose(); wallMaterial.dispose(); addedGeometries.forEach(g=>g.dispose()); addedMaterials.forEach(m=>m.dispose()); throw error }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1,2))
  host.appendChild(renderer.domElement)
  const lighting=createHomeLighting(scene,metadata,position)
  const ventilation=createHomeVentilation(scene,metadata,position)
  const fixtures=createHomeFixtures(scene)
  const windows=createHomeWindows(scene)
  const cameraDirection=new THREE.Vector3(...SCENE_VIEWS['anti-aging']).normalize(),targetDirection=cameraDirection.clone()
  const orbit=new THREE.Spherical().setFromVector3(cameraDirection),targetOrbit=new THREE.Spherical()
  let activeCameraScene=null,entrance=null,entranceZoom=1
  const dayBackground=new THREE.Color('#f1e8d8'),nightBackground=new THREE.Color('#34383b'),targetBackground=nightBackground.clone()
  const dayInk=new THREE.Color('#45423d'),nightInk=new THREE.Color('#ffffff'),captionInk=new THREE.Color()
  let disposed=false, frameId, previous=performance.now(), lastLabel=''
  const paint = () => renderer.render(scene,camera)
  let view={zoom:1,x:0,y:0,personId:'anti-aging'}
  const fitCamera = () => {
    camera.position.copy(center).addScaledVector(cameraDirection,size.length()*2)
    camera.lookAt(center);camera.updateMatrixWorld(true)
    projected.makeEmpty()
    for(const x of [bounds.min.x,bounds.max.x])for(const y of [bounds.min.y,bounds.max.y])for(const z of [bounds.min.z,bounds.max.z])projected.expandByPoint(point.set(x,y,z).applyMatrix4(camera.matrixWorldInverse))
    projected.getCenter(viewCenter);projected.getSize(viewSize)
    const width=host.clientWidth,height=host.clientHeight; if(!width||!height)return
    const aspect=width/height, extent=Math.max(viewSize.y*1.2,viewSize.x/aspect*1.1)
    const framedX=viewCenter.x, framedY=viewCenter.y
    const zoomed=extent/(view.zoom*entranceZoom), x=framedX-view.x/100*zoomed*aspect, y=framedY+view.y/100*zoomed
    camera.left=x-zoomed*aspect/2; camera.right=x+zoomed*aspect/2
    // Reserve caption space beneath the model without changing its viewing direction.
    camera.top=y+zoomed*.44; camera.bottom=y-zoomed*.56
    camera.updateProjectionMatrix()
  }
  const resize=()=>{fitCamera();renderer.setSize(host.clientWidth,host.clientHeight,false);paint()}
  const observer=new ResizeObserver(resize); observer.observe(host); resize()
  const animate=now=>{
    if(disposed)return
    const dt=Math.min((now-previous)/1000,.05);previous=now
    if(!document.hidden) {
      const state=lighting.tick(dt,view.paused)
      ventilation.tick(dt,view.paused)
      fixtures.tick(dt,view.personId,state)
      windows.tick(dt,view.personId,state,view.paused)
      // Follow the shortest horizontal arc, keeping height independent of the turn.
      targetOrbit.setFromVector3(targetDirection)
      const turn=1-Math.exp(-dt*1.4)
      const angle=Math.atan2(Math.sin(targetOrbit.theta-orbit.theta),Math.cos(targetOrbit.theta-orbit.theta))
      if(entrance){
        if(!view.paused)entrance.time=Math.min(3.2,entrance.time+dt)
        const t=entrance.time/3.2,ease=t*t*(3-2*t)
        orbit.theta=entrance.theta+entrance.angle*ease
        orbit.phi=THREE.MathUtils.lerp(entrance.phi,targetOrbit.phi,ease)
        entranceZoom=THREE.MathUtils.lerp(.94,1,ease)
        if(t===1)entrance=null
      }else{
        orbit.theta+=angle*turn
        orbit.phi=THREE.MathUtils.lerp(orbit.phi,targetOrbit.phi,turn)
      }
      cameraDirection.setFromSpherical(orbit)
      fitCamera()
      nightBackground.lerp(targetBackground,1-Math.exp(-dt*2))
      scene.background.copy(nightBackground).lerp(dayBackground,state.daylight)
      material.color.copy(nightInk).lerp(dayInk,state.daylight)
      fillMaterial.color.copy(nightInk).lerp(dayInk,state.daylight)
      wallMaterial.color.copy(nightInk).lerp(dayInk,state.daylight)
      partitionMaterial.color.copy(nightInk).lerp(dayInk,state.daylight)
      captionInk.copy(nightInk).lerp(dayInk,state.daylight)
      host.parentElement.style.setProperty('--scene-caption',captionInk.getStyle())
      fillMaterial.opacity=.065+state.brightness*.075
      lampMaterial.opacity=state.brightness*.95
      lampMaterial.color.copy(state.color)
      material.opacity=.45+state.brightness*.33
      if(lastLabel!==state.label){lastLabel=state.label;onBeat?.(lastLabel)}
      paint()
    }
    frameId=requestAnimationFrame(animate)
  }
  frameId=requestAnimationFrame(animate)
  return {
    // Keep the architectural lines fixed when NFC changes the surrounding scenario.
    update(settings) {
      if(settings) {
        view={...view,...settings}
        lighting.select(settings.personId)
        const tint=new THREE.Color(settings.color||'#7394a5'),hsl={}
        tint.getHSL(hsl,THREE.SRGBColorSpace)
        targetBackground.setHSL(hsl.h,.12,.23,THREE.SRGBColorSpace)
        dayBackground.setHSL(hsl.h,.22,.8,THREE.SRGBColorSpace)
        targetDirection.set(...(SCENE_VIEWS[settings.personId]||SCENE_VIEWS['anti-aging'])).normalize()
        if(activeCameraScene!==view.personId){
          entrance=null;entranceZoom=1
          if(view.personId==='anti-aging'){
            targetOrbit.setFromVector3(targetDirection)
            if(activeCameraScene===null){
              orbit.theta=targetOrbit.theta-.32
              orbit.phi=targetOrbit.phi-.16
              cameraDirection.setFromSpherical(orbit)
            }
            entrance={time:0,theta:orbit.theta,phi:orbit.phi,angle:Math.atan2(Math.sin(targetOrbit.theta-orbit.theta),Math.cos(targetOrbit.theta-orbit.theta))}
            entranceZoom=.94
          }
          activeCameraScene=view.personId
        }
      }
      resize()
    },
    dispose() { disposed=true; cancelAnimationFrame(frameId); lighting.dispose(); ventilation.dispose(); fixtures.dispose(); windows.dispose(); observer.disconnect(); geometry.dispose(); material.dispose(); fillGeometry.dispose(); fillMaterial.dispose(); partitionMaterial.dispose(); lampMaterial.dispose(); wallGeometry.dispose(); wallMaterial.dispose(); addedGeometries.forEach(g=>g.dispose()); addedMaterials.forEach(m=>m.dispose()); renderer.dispose(); renderer.domElement.remove() },
  }
}
