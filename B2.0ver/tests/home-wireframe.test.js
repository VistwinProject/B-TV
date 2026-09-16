import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'
import { createHash } from 'node:crypto'

test('wireframe is derived from the current GLB and contains complete finite model-space edges', () => {
  const sourceURL=new URL('../3d.glb',import.meta.url)
  const source=existsSync(sourceURL)?readFileSync(sourceURL):null
  const metadata=JSON.parse(readFileSync(new URL('../public/models/home-wireframe.json',import.meta.url)))
  const binary=readFileSync(new URL('../public/models/home-wireframe.bin',import.meta.url))
  if(source){
  assert.equal(metadata.sha256,createHash('sha256').update(source).digest('hex'),'Run npm run model:wireframe after replacing 3d.glb')
  const gltf=JSON.parse(source.subarray(20,20+source.readUInt32LE(12)))
  assert.equal(metadata.sourceMeshes,gltf.nodes.filter(n=>n.mesh!==undefined).length)
  }
  assert.equal(metadata.meshes,metadata.sourceMeshes-metadata.excludedObjects.length-metadata.omittedDetails.length-metadata.removedCabinetObjects.length-metadata.removedRoomObjects.length)
  for(const name of ['___4_63','Group702','Plane04_01','Plane04_02','Plane04__3','Group754','Group758','Group739','Group746','Group749','Group750']) assert.ok(metadata.excludedObjects.includes(name))
  assert.equal(binary.length,metadata.segments*6*4)
  const min=[Infinity,Infinity,Infinity],max=[-Infinity,-Infinity,-Infinity]
  for(let offset=0;offset<binary.length;offset+=4) {
    const value=binary.readFloatLE(offset),axis=(offset/4)%3
    assert.ok(Number.isFinite(value))
    min[axis]=Math.min(min[axis],value); max[axis]=Math.max(max[axis],value)
  }
  for(let axis=0;axis<3;axis++) {
    assert.ok(Math.abs(min[axis]-metadata.bounds.min[axis])<1e-5)
    assert.ok(Math.abs(max[axis]-metadata.bounds.max[axis])<1e-5)
  }
})


test('both walls and the floor share exactly aligned perimeter corners', () => {
  const metadata=JSON.parse(readFileSync(new URL('../public/models/home-wireframe.json',import.meta.url)))
  const binary=readFileSync(new URL('../public/models/home-wireframe.bin',import.meta.url))
  const a=metadata.shellAlignment
  const expected={
    Plane:[[a.maxX,a.floorY,a.minZ],[a.maxX,a.topY,a.maxZ]],
    Plane001:[[a.minX,a.floorY,a.minZ],[a.maxX,a.floorY,a.maxZ]],
    Plane002:[[a.minX,a.floorY,a.maxZ],[a.maxX,a.topY,a.maxZ]],
  }
  assert.equal(metadata.shellObjects.length,2)
  for(const object of metadata.shellObjects) {
    assert.equal(object.segments,4)
    const min=[Infinity,Infinity,Infinity],max=[-Infinity,-Infinity,-Infinity]
    for(let i=0;i<object.segments*6;i++) {
      const value=binary.readFloatLE((object.firstSegment*6+i)*4),axis=i%3
      min[axis]=Math.min(min[axis],value);max[axis]=Math.max(max[axis],value)
      const [lo,hi]=expected[object.name]
      assert.ok(Math.min(Math.abs(value-lo[axis]),Math.abs(value-hi[axis]))<1e-5)
    }
    for(let axis=0;axis<3;axis++) {
      assert.ok(Math.abs(min[axis]-expected[object.name][0][axis])<1e-5)
      assert.ok(Math.abs(max[axis]-expected[object.name][1][axis])<1e-5)
    }
  }
})


test('shelf outlines are single planar rectangles and detail density is reduced', () => {
  const metadata=JSON.parse(readFileSync(new URL('../public/models/home-wireframe.json',import.meta.url)))
  const binary=readFileSync(new URL('../public/models/home-wireframe.bin',import.meta.url))
  assert.ok(metadata.segments<7000)
  const panels=metadata.simplifiedObjects.filter(o=>o.kind==='plane-outline')
  assert.ok(panels.length>0)
  for(const panel of panels) {
    assert.equal(panel.segments,4)
    const corners=[]
    for(let i=0;i<4;i++) corners.push([0,1,2].map(a=>binary.readFloatLE((panel.firstSegment*6+i*6+a)*4)))
    const subtract=(a,b)=>a.map((v,i)=>v-b[i])
    const u=subtract(corners[1],corners[0]),v=subtract(corners[3],corners[0]),w=subtract(corners[2],corners[0])
    const normal=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]]
    assert.ok(Math.abs(normal.reduce((sum,n,i)=>sum+n*w[i],0))<1e-5,panel.name)
  }
})


test('source spotlights survive detail filtering and translucent fills are complete', () => {
  const metadata=JSON.parse(readFileSync(new URL('../public/models/home-wireframe.json',import.meta.url)))
  const fill=readFileSync(new URL('../public/models/home-fill.bin',import.meta.url))
  assert.equal(metadata.spotlights.length,8)
  for(const name of metadata.spotlights) {
    assert.ok(!metadata.omittedDetails.includes(name))
    assert.ok(metadata.spotlightObjects.some(o=>o.name===name && o.segments>0))
  }
  assert.ok(metadata.fillTriangles>0)
  assert.equal(fill.length,metadata.fillTriangles*9*4)
  for(let i=0;i<fill.length;i+=4) assert.ok(Number.isFinite(fill.readFloatLE(i)))
})


test('left column and bookcase are restored while dining chairs keep their contours', () => {
  const metadata=JSON.parse(readFileSync(new URL('../public/models/home-wireframe.json',import.meta.url)))
  assert.deepEqual(metadata.removedCabinetObjects,[])
  for(const name of ['Group680','Group938','Group984','Group998']) {
    assert.ok(!metadata.omittedDetails.includes(name))
    assert.ok(!metadata.removedRoomObjects.includes(name))
    assert.ok(!metadata.excludedObjects.includes(name))
  }
  assert.deepEqual(metadata.chairObjects,['3DGeom_202','Mesh295'])
  for(const name of metadata.chairObjects) {
    assert.ok(!metadata.simplifiedObjects.some(o=>o.name===name))
    assert.ok(!metadata.omittedDetails.includes(name))
    assert.ok(!metadata.removedCabinetObjects.includes(name))
  }
})


test('rooms beyond the marked living-room boundary are absent from lines and fills', () => {
  const metadata=JSON.parse(readFileSync(new URL('../public/models/home-wireframe.json',import.meta.url)))
  assert.equal(metadata.roomCutZ,-.9)
  assert.ok(metadata.removedRoomObjects.includes('Defintion1001'))
  assert.ok(metadata.removedRoomObjects.includes('Defintion1'))
  assert.ok(metadata.removedRoomObjects.includes('Cube002'))
  for(const filename of ['home-wireframe.bin','home-fill.bin']) {
    const binary=readFileSync(new URL(`../public/models/${filename}`,import.meta.url))
    for(let offset=8;offset<binary.length;offset+=12) {
      const vertex=(offset-8)/12
      const cabinet=metadata.retainedCabinetObjects.some(o=> filename==='home-wireframe.bin'
        ? vertex>=o.firstSegment*2 && vertex<(o.firstSegment+o.segments)*2
        : vertex>=o.firstFillVertex && vertex<o.firstFillVertex+o.fillVertexCount)
      const shell=filename==='home-wireframe.bin' && metadata.shellObjects.some(o=>vertex>=o.firstSegment*2 && vertex<(o.firstSegment+o.segments)*2)
      if(!cabinet && !shell) assert.ok(binary.readFloatLE(offset)<=metadata.roomCutZ+1e-5)
    }
    assert.ok(metadata.retainedCabinetObjects.some(o=>o.name==='Group729'))
    assert.ok(metadata.retainedCabinetObjects.some(o=>o.name==='Group819'))
    assert.ok(metadata.removedRoomObjects.includes('Plane002'))
  }
})
