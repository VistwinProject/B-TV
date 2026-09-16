import * as T from 'three'

export const WINDOW_STYLES={'anti-aging':'百葉簾',child:'透光捲簾',elder:'對開布簾',pregnancy:'雙層紗簾',nomad:'調光簾'}
export function createHomeWindows(scene){
  const geometries=[],materials=[],sets=[]
  for(const [id,style] of Object.entries(WINDOW_STYLES)){
    const root=new T.Group();root.name=`window-${style}`;scene.add(root)
    const uniforms={amount:{value:0},phase:{value:0},kind:{value:id==='nomad'?2:id==='anti-aging'?1:0}}
    const cloth=new T.MeshBasicMaterial({color:'#d4d4d4',transparent:true,opacity:0,side:T.DoubleSide,depthWrite:false})
    const ink=new T.LineBasicMaterial({color:'#eeeeee',transparent:true,opacity:0,depthWrite:false})
    const light=new T.ShaderMaterial({uniforms,transparent:true,depthWrite:false,side:T.DoubleSide,blending:T.AdditiveBlending,
      vertexShader:'varying vec2 tex;void main(){tex=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
      fragmentShader:'varying vec2 tex;uniform float amount;uniform float phase;uniform float kind;void main(){float soft=sin(tex.x*3.14159)*sin(tex.y*3.14159);float bands=kind>0.?mix(.15,1.,smoothstep(.35,.5,fract(tex.y*9.+phase))):1.;gl_FragColor=vec4(.94,.97,1.,soft*bands*amount);}'})
    materials.push(cloth,ink,light)
    function box(x,y,z,w,h,d){const g=new T.BoxGeometry(w,h,d),e=new T.EdgesGeometry(g);geometries.push(g,e);const m=new T.Mesh(g,cloth),l=new T.LineSegments(e,ink);m.position.set(x,y,z);l.position.copy(m.position);root.add(m,l)}
    function pane(x,y,z,w,h,material){const g=new T.PlaneGeometry(w,h);geometries.push(g);const p=new T.Mesh(g,material);p.rotation.y=-Math.PI/2;p.position.set(x,y,z);root.add(p);return p}
    box(4.94,2.34,-2.277,.09,.08,1.58)
    if(id==='anti-aging')for(let i=0;i<12;i++)box(4.92,2.23-i*.115,-2.277,.11,.025,1.44)
    if(id==='child'){pane(4.92,1.83,-2.277,1.43,.94,cloth);box(4.92,1.36,-2.277,.045,.04,1.45)}
    if(id==='elder'||id==='pregnancy'){
      for(const side of [-1,1])for(let i=0;i<5;i++)box(4.9+(i%2)*.025,1.58,-2.277+side*(.48+i*.045),.06,1.46,.05)
      if(id==='pregnancy')pane(4.88,1.58,-2.277,1.38,1.43,cloth)
    }
    if(id==='nomad')for(let i=0;i<8;i++)box(4.91,2.2-i*.16,-2.277,.025,.08,1.44)
    pane(4.86,1.58,-2.277,1.42,1.45,light)
    // Window light washes inward across the floor, with slat / zebra banding.
    const floor= new T.PlaneGeometry(2.8,1.8);geometries.push(floor)
    const patch=new T.Mesh(floor,light);patch.rotation.x=-Math.PI/2;patch.position.set(3.45,.023,-2.4);root.add(patch)
    // Soft translucent shaft from the actual left-hand window towards the living space.
    const beam=new T.BufferGeometry();beam.setAttribute('position',new T.Float32BufferAttribute([4.84,2.2,-2.95,4.84,2.2,-1.6,2.05,.04,-1.5,4.84,2.2,-2.95,2.05,.04,-1.5,2.05,.04,-3.2],3));beam.setAttribute('uv',new T.Float32BufferAttribute([0,1,1,1,1,0,0,1,1,0,0,0],2));geometries.push(beam);root.add(new T.Mesh(beam,light))
    sets.push({id,root,uniforms,cloth,ink,weight:0})
  }
  let time=0
  return {tick(dt,id,state,paused=false){if(!paused)time+=dt;for(const s of sets){s.weight=T.MathUtils.lerp(s.weight,s.id===id?1:0,1-Math.exp(-dt*2.5));s.root.visible=s.weight>.002;s.cloth.opacity=s.weight*(s.id==='pregnancy'?.13:.3);s.ink.opacity=s.weight*.55;s.uniforms.amount.value=s.weight*state.windowLight*.22;s.uniforms.phase.value=Math.sin(time*.18)*.15}},dispose(){sets.forEach(s=>scene.remove(s.root));geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose())}}
}
