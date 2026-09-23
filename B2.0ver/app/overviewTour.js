import * as T from 'three'
import {SCENE_VIEWS} from './homeFixtures.js'
export function overviewTourFrame(seconds){
 const t=Math.max(0,seconds),turn=T.MathUtils.smoothstep(t,2,8)
 const direction=new T.Vector3(...SCENE_VIEWS.nomad).applyAxisAngle(new T.Vector3(0,1,0),(turn===1?0:turn*Math.PI*2))
 return {direction:direction.toArray(),focus:[0,0,0],weight:0,zoom:1.536,scan:T.MathUtils.smoothstep(t,9,14),scanning:t>=9&&t<14,light:T.MathUtils.smoothstep(t,14,16),time:t}
}
export function createOverviewScan(scene,bounds){
 const size=bounds.getSize(new T.Vector3()),center=bounds.getCenter(new T.Vector3())
 const height={value:bounds.max.y},enabled={value:0},patched=[]
 // World-space height keeps the pulse attached to every transformed object surface.
 const materials=new Set()
 scene.traverse(object=>{for(const material of [].concat(object.material||[]))if(material.isMeshBasicMaterial||material.isLineBasicMaterial)materials.add(material)})
 for(const material of materials){
  const previous=material.onBeforeCompile,cacheKey=material.customProgramCacheKey
  material.onBeforeCompile=function(shader,renderer){
   previous.call(this,shader,renderer)
   shader.uniforms.scanHeight=height;shader.uniforms.scanEnabled=enabled
   shader.vertexShader='varying float scanY;\n'+shader.vertexShader.replace('#include <project_vertex>','#include <project_vertex>\nscanY=(modelMatrix*vec4(transformed,1.0)).y;')
   shader.fragmentShader='varying float scanY;uniform float scanHeight;uniform float scanEnabled;\n'+shader.fragmentShader.replace('#include <opaque_fragment>',`
    float distanceToScan=scanY-scanHeight;
    float core=1.-smoothstep(.015,.075,abs(distanceToScan));
    float halo=1.-smoothstep(.04,.24,abs(distanceToScan));
    float trail=step(0.,distanceToScan)*(1.-smoothstep(.06,.65,distanceToScan));
    float pulse=scanEnabled*max(core,max(halo*.55,trail*.38));
    outgoingLight=mix(outgoingLight,vec3(.22,.72,1.),pulse);
    outgoingLight=mix(outgoingLight,vec3(.78,.95,1.),core*scanEnabled*.85);
    diffuseColor.a=max(diffuseColor.a,pulse*${material.isLineBasicMaterial?'1.':'.55'});
    #include <opaque_fragment>`)
  }
  material.customProgramCacheKey=()=>cacheKey.call(material)+'-overview-surface-scan-v2'
  material.needsUpdate=true;patched.push({material,previous,cacheKey})
 }
 // A restrained horizontal sheet locates the scan; the bright contact is on the objects.
 const geometry=new T.PlaneGeometry(size.x,size.z),material=new T.MeshBasicMaterial({color:'#66cfff',transparent:true,opacity:.045,side:T.DoubleSide,depthWrite:false,blending:T.AdditiveBlending})
 const plane=new T.Mesh(geometry,material);plane.rotation.x=-Math.PI/2;plane.position.copy(center);plane.visible=false;scene.add(plane)
 const edges=new T.EdgesGeometry(geometry),ink=new T.LineBasicMaterial({color:'#9ee5ff',transparent:true,opacity:.45,depthWrite:false})
 plane.add(new T.LineSegments(edges,ink))
 return {tick(frame){plane.visible=frame.scanning;height.value=T.MathUtils.lerp(bounds.max.y,bounds.min.y,frame.scan);plane.position.y=height.value;enabled.value=frame.scanning?1:0},dispose(){
  for(const {material,previous,cacheKey} of patched){material.onBeforeCompile=previous;material.customProgramCacheKey=cacheKey;material.needsUpdate=true}
  scene.remove(plane);geometry.dispose();edges.dispose();material.dispose();ink.dispose()
 }}
}
