// Extract only genuine mesh edges, baking the GLB hierarchy's world transforms.
// Preserve furniture geometry; apply the requested panel removal and shell-edge alignment.
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import * as THREE from 'three'
import { ConvexGeometry } from 'three/addons/geometries/ConvexGeometry.js'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
const input = await readFile(new URL('../3d.glb', import.meta.url))
if (input.readUInt32LE(0) !== 0x46546c67) throw new Error('Expected a GLB file')
const jsonLength = input.readUInt32LE(12)
const json = JSON.parse(input.subarray(20,20+jsonLength).toString())
const binOffset = 20+jsonLength
const binary = input.subarray(binOffset+8,binOffset+8+input.readUInt32LE(binOffset))
for (const mesh of json.meshes) for (const primitive of mesh.primitives) delete primitive.material
for (const key of ['materials','textures','images','samplers','extensionsRequired','extensionsUsed']) delete json[key]
// Keep the original geometry buffers; omit material loading in the offline parser.
const encoded = Buffer.from(JSON.stringify(json)); const padded=Buffer.alloc(Math.ceil(encoded.length/4)*4,32); encoded.copy(padded)
const glb=Buffer.alloc(28+padded.length+binary.length)
glb.writeUInt32LE(0x46546c67,0); glb.writeUInt32LE(2,4); glb.writeUInt32LE(glb.length,8)
glb.writeUInt32LE(padded.length,12); glb.writeUInt32LE(0x4e4f534a,16); padded.copy(glb,20)
glb.writeUInt32LE(binary.length,20+padded.length); glb.writeUInt32LE(0x004e4942,24+padded.length); binary.copy(glb,28+padded.length)
const {scene}=await new GLTFLoader().parseAsync(glb.buffer.slice(glb.byteOffset,glb.byteOffset+glb.byteLength),'')
scene.updateMatrixWorld(true)
const fills=[], positions=[], bounds=new THREE.Box3(), vector=new THREE.Vector3()
// The thin dense panel and its backing frame identified in the supplied model.
const excludedObjects = ['___4_63', 'Group702', 'Plane04_01', 'Plane04_02', 'Plane04__3',
  'Group754','Group758', // Duplicate simplified cushions over the restored dining chairs.
  'Group736','Group737','Group739','Group740','Group741',
  'Group743','Group744','Group746','Group747','Group748','Group749','Group750',
]
const removedCabinetObjects=[]
const removedRoomObjects=[]
const retainedCabinetObjects=[]
const roomCutZ=-.9
const chairObjects=['3DGeom_202','Mesh295']
const shellNames = ['Plane', 'Plane001', 'Plane002']
const shellBounds = Object.fromEntries(shellNames.map(name => {
  const object=scene.getObjectByName(name)
  if (!object?.isMesh) throw new Error(`Missing shell object: ${name}`)
  return [name,new THREE.Box3().setFromObject(object)]
}))
// The two walls' planes define their common corner. Trim protruding floor/wall ends
// to the other wall's span and raise the wall bottoms to the existing floor level.
const aligned = {
  minX: shellBounds.Plane002.min.x, maxX: shellBounds.Plane.min.x,
  minZ: shellBounds.Plane.min.z-1.25, maxZ: .05,
  floorY: shellBounds.Plane001.min.y,
  topY: Math.min(shellBounds.Plane.max.y,shellBounds.Plane002.max.y),
}
const shellTargets = {
  Plane: new THREE.Box3(new THREE.Vector3(aligned.maxX,aligned.floorY,aligned.minZ),new THREE.Vector3(aligned.maxX,aligned.topY,aligned.maxZ)),
  Plane001: new THREE.Box3(new THREE.Vector3(aligned.minX,aligned.floorY,aligned.minZ),new THREE.Vector3(aligned.maxX,aligned.floorY,aligned.maxZ)),
  Plane002: new THREE.Box3(new THREE.Vector3(aligned.minX,aligned.floorY,aligned.maxZ),new THREE.Vector3(aligned.maxX,aligned.topY,aligned.maxZ)),
}
const spotlights=['Mesh01001','Mesh08001','Mesh15001','Mesh22001','Mesh29001','Mesh36001','Mesh43001','Mesh50001']
const spotlightMounts=['Mesh05','Mesh12','Mesh19','Mesh26','Mesh33','Mesh40','Mesh47','Mesh54']
const spotlightObjects=[]
const partitionWalls=[]
const shellObjects=[]
const omittedDetails=[], simplifiedObjects=[]
// All simplified dimensions come from each source mesh's own bounds and transform.
const leftShelfPanels=new Set(['Group914','Group919','Group924','Group926','Group930','Group934','Group935','Group938','Group942','Group946','Group950','Group959','Group965','Group971','Group984','Group985','Group987','Group988','Group989','Group994','Group995','Group998','Group999'])
function outlineGeometry(object, leftBookcase=false) {
  if(leftBookcase) {
    const b=new THREE.Box3().setFromObject(object), size=b.getSize(new THREE.Vector3()), center=b.getCenter(new THREE.Vector3())
    const axes=['x','y','z'].sort((a,b)=>size[a]-size[b]), [a,bAxis]=axes.slice(1)
    const inverse=object.matrixWorld.clone().invert()
    const corners=[[0,0],[1,0],[1,1],[0,1]].map(([u,v])=>{
      const p=center.clone();p[a]=u?b.max[a]:b.min[a];p[bAxis]=v?b.max[bAxis]:b.min[bAxis];return p.applyMatrix4(inverse)
    })
    simplifiedObjects.push({name:object.name,kind:'plane-outline',firstSegment:positions.length/6,segments:4})
    return new THREE.BufferGeometry().setFromPoints(corners.flatMap((p,i)=>[p,corners[(i+1)%4]]))
  }
  if (['Cube001','Cube002'].includes(object.name)) {
    const a=new THREE.Box3().setFromObject(scene.getObjectByName('Cube001'))
    const b=new THREE.Box3().setFromObject(scene.getObjectByName('Cube002'))
    const cornerX=(b.min.x+b.max.x)/2, cornerZ=(a.min.z+a.max.z)/2
    const bottom=aligned.floorY, top=Math.min(a.max.y,b.max.y)
    const corners=(object.name==='Cube001'
      ? [[a.min.x,bottom,cornerZ],[cornerX,bottom,cornerZ],[cornerX,top,cornerZ],[a.min.x,top,cornerZ]]
      : [[cornerX,bottom,cornerZ],[cornerX,bottom,b.max.z],[cornerX,top,b.max.z],[cornerX,top,cornerZ]])
      .map(p=>new THREE.Vector3(...p).applyMatrix4(object.matrixWorld.clone().invert()))
    simplifiedObjects.push({name:object.name,kind:'plane-outline',firstSegment:positions.length/6,segments:4})
    return new THREE.BufferGeometry().setFromPoints(corners.flatMap((p,i)=>[p,corners[(i+1)%4]]))
  }
  object.geometry.computeBoundingBox()
  const local=object.geometry.boundingBox, size=local.getSize(new THREE.Vector3()), center=local.getCenter(new THREE.Vector3())
  const axes=['x','y','z'].sort((a,b)=>size[a]-size[b])
  let points,kind
  if (size[axes[1]] < .055) {
    const a=center.clone(), b=center.clone(); a[axes[2]]=local.min[axes[2]]; b[axes[2]]=local.max[axes[2]]
    points=[a,b];kind='single-line'
  } else if (size[axes[0]] < .11 && size[axes[1]] > .16) {
    const a=axes[1],b=axes[2]
    const corners=[[0,0],[1,0],[1,1],[0,1]].map(([u,v])=>{
      const p=center.clone();p[a]=u?local.max[a]:local.min[a];p[b]=v?local.max[b]:local.min[b];return p
    })
    points=corners.flatMap((p,i)=>[p,corners[(i+1)%4]]);kind='plane-outline'
  }
  if(points) {
    simplifiedObjects.push({name:object.name,kind,firstSegment:positions.length/6,segments:points.length/2})
    return new THREE.BufferGeometry().setFromPoints(points)
  }
  const edges=new THREE.EdgesGeometry(object.geometry,35)
  if(edges.getAttribute('position').count/2>80) {
    edges.dispose()
    const box=new THREE.BoxGeometry(size.x,size.y,size.z);box.translate(center.x,center.y,center.z)
    const outline=new THREE.EdgesGeometry(box);box.dispose()
    simplifiedObjects.push({name:object.name,kind:'furniture-outline',firstSegment:positions.length/6,segments:12})
    return outline
  }
  return edges
}
function addFill(geometry, matrix, cutZ=roomCutZ, forward=0) {
  const expanded=geometry.index ? geometry.toNonIndexed() : geometry.clone()
  expanded.applyMatrix4(matrix)
  const points=expanded.getAttribute('position')
  for(let i=0;i<points.count;i++) fills.push(points.getX(i),points.getY(i),Math.min(points.getZ(i),cutZ)-forward)
  expanded.dispose()
}
let meshes=0, sourceMeshes=0
scene.traverse(object=>{
  if (!object.isMesh) return
  sourceMeshes++
  const objectBounds=new THREE.Box3().setFromObject(object)
  if (excludedObjects.includes(object.name)) return
  const keepCabinet=(objectBounds.min.x>1.88 && objectBounds.max.x<2.26 && objectBounds.min.z>-1.05 && objectBounds.max.z<-.3)
    || (objectBounds.min.x>-2.83 && objectBounds.max.x<-1.1 && objectBounds.min.z>-1.05 && objectBounds.max.z<-.7)
  if(object.name==='Plane002' || (!shellNames.includes(object.name) && !keepCabinet && object.name!=='Group770' && objectBounds.getCenter(new THREE.Vector3()).z>roomCutZ)) { removedRoomObjects.push(object.name);return }
  const leftBookcase=object.name!=='Group680' && objectBounds.min.x>3.78 && objectBounds.max.x<4.9 && objectBounds.min.z>-3.85 && objectBounds.max.z< -2.93
  if(leftBookcase && !leftShelfPanels.has(object.name)) { omittedDetails.push(object.name);return }
  const dining=objectBounds.min.x>1.85 && objectBounds.max.x<4.01 && objectBounds.min.z> -3.5 && objectBounds.max.z< -2.3 && objectBounds.max.y<.9
  const coffee=['Group1013','Group1014','Group1015'].includes(object.name)
  const forward=leftBookcase || dining || chairObjects.includes(object.name) ? .45 : coffee ? .35 : 0
  const objectCutZ=keepCabinet || shellNames.includes(object.name) ? Infinity : roomCutZ
  const isSpotlight=spotlights.includes(object.name), isMount=spotlightMounts.includes(object.name)
  const worldSize=new THREE.Box3().setFromObject(object).getSize(new THREE.Vector3())
  const smallDecoration=object.name.startsWith('Mesh') && Math.max(...worldSize.toArray())<.55
  const hanger=/^Mesh(20[4-9]|21[0-9]|22[0-6])$/.test(object.name)
  if (!shellNames.includes(object.name) && !isSpotlight && !isMount && (Math.max(...worldSize.toArray())<.3 || hanger || smallDecoration)) {
    omittedDetails.push(object.name);return
  }
  meshes++
  let lampGeometry
  if(isSpotlight) {
    const points=object.geometry.getAttribute('position'), vertices=[]
    for(let i=0;i<points.count;i++) vertices.push(new THREE.Vector3().fromBufferAttribute(points,i))
    lampGeometry=new ConvexGeometry(vertices)
  }
  const edges=chairObjects.includes(object.name) ? new THREE.EdgesGeometry(object.geometry,55) : isSpotlight ? new THREE.EdgesGeometry(lampGeometry,28) : shellNames.includes(object.name) ? new THREE.EdgesGeometry(object.geometry,25) : outlineGeometry(object,leftBookcase)
  const simplified=simplifiedObjects.findLast(item=>item.name===object.name)
  const firstFillVertex=fills.length/3
  if(!shellNames.includes(object.name)) {
    if (simplified?.kind==='plane-outline') {
      const p=edges.getAttribute('position'), verts=[0,2,4,0,4,6].flatMap(i=>[p.getX(i),p.getY(i),p.getZ(i)])
      const plane=new THREE.BufferGeometry();plane.setAttribute('position',new THREE.Float32BufferAttribute(verts,3))
      addFill(plane,object.matrixWorld,objectCutZ,forward);plane.dispose()
    } else if(simplified?.kind==='furniture-outline') {
      const b=object.geometry.boundingBox, d=b.getSize(new THREE.Vector3()), c=b.getCenter(new THREE.Vector3())
      const box=new THREE.BoxGeometry(d.x,d.y,d.z);box.translate(c.x,c.y,c.z)
      addFill(box,object.matrixWorld,objectCutZ,forward);box.dispose()
    } else if(simplified?.kind!=='single-line') addFill(lampGeometry || object.geometry,object.matrixWorld,objectCutZ,forward)
  }
  if (['Cube001','Cube002','Group770'].includes(object.name)) partitionWalls.push({name:object.name,firstVertex:firstFillVertex,vertexCount:fills.length/3-firstFillVertex})
  lampGeometry?.dispose()
  const attribute=edges.getAttribute('position')
  if(keepCabinet) retainedCabinetObjects.push({name:object.name,firstSegment:positions.length/6,segments:attribute.count/2,firstFillVertex,fillVertexCount:fills.length/3-firstFillVertex})
  const original=shellBounds[object.name], target=shellTargets[object.name]
  if (isSpotlight || isMount) spotlightObjects.push({name:object.name,firstSegment:positions.length/6,segments:attribute.count/2,firstVertex:firstFillVertex,vertexCount:fills.length/3-firstFillVertex})
  if (target) shellObjects.push({name:object.name,firstSegment:positions.length/6,segments:attribute.count/2})
  for(let i=0;i<attribute.count;i++) {
    vector.fromBufferAttribute(attribute,i).applyMatrix4(object.matrixWorld)
    if (target) for (const axis of ['x','y','z']) {
      const span=original.max[axis]-original.min[axis]
      const fraction=span>1e-6 ? (vector[axis]-original.min[axis])/span : 0
      vector[axis]=THREE.MathUtils.lerp(target.min[axis],target.max[axis],fraction)
    }
    vector.z=Math.min(vector.z,objectCutZ)-forward
    positions.push(vector.x,vector.y,vector.z); bounds.expandByPoint(vector)
  }
  edges.dispose(); object.geometry.dispose()
  for(const material of Array.isArray(object.material)?object.material:[object.material]) material.dispose()
})
const array=new Float32Array(positions)
const metadata={source:'3d.glb',sha256:createHash('sha256').update(input).digest('hex'),sourceMeshes,meshes,retainedCabinetObjects,removedRoomObjects,roomCutZ,removedCabinetObjects,chairObjects,partitionWalls,spotlights,spotlightObjects,fillTriangles:fills.length/9,excludedObjects,omittedDetails,simplifiedObjects,shellAlignment:aligned,shellObjects,segments:array.length/6,thresholdDegrees:35,bounds:{min:bounds.min.toArray(),max:bounds.max.toArray()}}
const destination=new URL('../public/models/',import.meta.url); await mkdir(destination,{recursive:true})
await writeFile(new URL('home-wireframe.bin',destination),Buffer.from(array.buffer))
await writeFile(new URL('home-fill.bin',destination),Buffer.from(new Float32Array(fills).buffer))
await writeFile(new URL('home-wireframe.json',destination),JSON.stringify(metadata,null,2)+'\n')
console.log(JSON.stringify({sourceMeshes,meshes,retainedCabinetObjects,removedRoomObjects,roomCutZ,removedCabinetObjects,chairObjects,partitionWalls,spotlights,spotlightObjects,fillTriangles:fills.length/9,excludedObjects,omittedDetails:omittedDetails.length,simplifiedObjects:simplifiedObjects.length,segments:metadata.segments,bytes:array.byteLength},null,2))
