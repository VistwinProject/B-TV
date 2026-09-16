import * as T from 'three'

// Each particle owns a speed, lifetime, phase and spreading direction.
export function airflowSample(index,time){
  const random=seed=>{const n=Math.sin(seed*127.1+311.7)*43758.5453;return n-Math.floor(n)}
  const lifetime=3.5+random(index+10)*2.5
  const age=(time+random(index+30)*lifetime)%lifetime,u=age/lifetime
  const speed=.28+random(index+50)*.3
  return {
    x:(random(index+70)-.5)*.85+(random(index+90)-.5)*age*age*.055,
    y:-age*(.09+random(index+110)*.07)+Math.sin(age*1.5+index)*.025*u,
    z:-age*speed,
    alpha:Math.min(1,u/.1)*Math.pow(1-u,1.8)*.75,
    size:2.1+random(index+130)*1.6,
  }
}
export function createHomeVentilation(scene,metadata,sourcePositions){
  const wall=metadata.simplifiedObjects.find(o=>o.name==='Cube001')
  if(!wall) return {tick(){},dispose(){}}
  const bounds=new T.Box3(),point=new T.Vector3()
  for(let i=wall.firstSegment*2;i<(wall.firstSegment+wall.segments)*2;i++)bounds.expandByPoint(point.fromBufferAttribute(sourcePositions,i))
  const center=bounds.getCenter(new T.Vector3())
  const root=new T.Group();root.name='fresh-air-unit';root.position.set(center.x,bounds.max.y-.25,center.z-.14);scene.add(root)
  const bodyGeometry=new T.BoxGeometry(1.2,.32,.23),edgeGeometry=new T.EdgesGeometry(bodyGeometry)
  const bodyMaterial=new T.MeshBasicMaterial({color:'#808080',transparent:true,opacity:.28,depthWrite:false})
  const lineMaterial=new T.LineBasicMaterial({color:'#ffffff',transparent:true,opacity:.9,depthWrite:false})
  root.add(new T.Mesh(bodyGeometry,bodyMaterial),new T.LineSegments(edgeGeometry,lineMaterial))
  // Recessed outlet grille, facing forward into the living room (-Z).
  const grille=[]
  for(let row=0;row<3;row++)grille.push(-.5,-.065-row*.029,-.119,.5,-.065-row*.029,-.119)
  for(let x=-.45;x<=.46;x+=.15)grille.push(x,-.06,-.12,x,-.13,-.12)
  const grilleGeometry=new T.BufferGeometry();grilleGeometry.setAttribute('position',new T.Float32BufferAttribute(grille,3))
  root.add(new T.LineSegments(grilleGeometry,lineMaterial))
  const count=110,positions=new Float32Array(count*3),alphas=new Float32Array(count),sizes=new Float32Array(count)
  const particlesGeometry=new T.BufferGeometry()
  particlesGeometry.setAttribute('position',new T.BufferAttribute(positions,3).setUsage(T.DynamicDrawUsage))
  particlesGeometry.setAttribute('alpha',new T.BufferAttribute(alphas,1).setUsage(T.DynamicDrawUsage))
  particlesGeometry.setAttribute('size',new T.BufferAttribute(sizes,1))
  const particlesMaterial=new T.ShaderMaterial({transparent:true,depthWrite:false,blending:T.AdditiveBlending,
    uniforms:{pixelRatio:{value:Math.min(globalThis.devicePixelRatio||1,2)}},
    vertexShader:'attribute float alpha;attribute float size;uniform float pixelRatio;varying float opacity;void main(){opacity=alpha;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);gl_PointSize=size*pixelRatio;}',
    fragmentShader:'varying float opacity;void main(){float radius=length(gl_PointCoord-.5)*2.;float soft=1.-smoothstep(.15,1.,radius);gl_FragColor=vec4(vec3(1.),opacity*soft);}'})
  const particles=new T.Points(particlesGeometry,particlesMaterial);particles.name='fresh-air-particles';particles.frustumCulled=false;particles.position.set(0,-.1,-.14);root.add(particles)
  let time=0
  function tick(dt,paused=false){
    if(!paused)time+=dt
    for(let i=0;i<count;i++){
      const p=airflowSample(i,time);positions.set([p.x,p.y,p.z],i*3);alphas[i]=p.alpha;sizes[i]=p.size
    }
    particlesGeometry.attributes.position.needsUpdate=true;particlesGeometry.attributes.alpha.needsUpdate=true;particlesGeometry.attributes.size.needsUpdate=true
  }
  tick(0)
  return {tick,dispose(){scene.remove(root);[bodyGeometry,edgeGeometry,grilleGeometry,particlesGeometry].forEach(g=>g.dispose());[bodyMaterial,lineMaterial,particlesMaterial].forEach(m=>m.dispose())}}
}
