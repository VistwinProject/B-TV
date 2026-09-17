import {elderFrame} from './homeElder.js'
import * as T from 'three'
export const SCENE_VIEWS={
  'anti-aging':[-1,.62,-1.35],
  child:[-.25,2.3,-1.4],
  elder:[-1.4,1.15,1.65],
  pregnancy:[1.05,.95,-1.7],
  nomad:[-.4,1.2,-1.8],
}
// Grayscale fixture bodies; only diffusers and light washes carry scenario color.
export function createHomeFixtures(scene){
  const geometries=[],materials=[],sets=[]
  const geo=g=>(geometries.push(g),g)
  for(const id of Object.keys(SCENE_VIEWS)){
    const bulbs=[]
    const group=new T.Group();group.name=`fixtures-${id}`;scene.add(group)
    const ink=new T.LineBasicMaterial({color:'#dddddd',transparent:true,depthWrite:false})
    const fill=new T.MeshBasicMaterial({color:'#ffffff',transparent:true,side:T.DoubleSide,depthWrite:false})
    const glow=new T.ShaderMaterial({transparent:true,depthWrite:false,side:T.DoubleSide,blending:T.AdditiveBlending,uniforms:{tint:{value:new T.Color()},strength:{value:0}},vertexShader:'varying vec2 tex;void main(){tex=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'varying vec2 tex;uniform vec3 tint;uniform float strength;void main(){float r=length((tex-.5)*2.);gl_FragColor=vec4(tint,pow(max(0.,1.-r),2.)*strength);}'})
    materials.push(ink,fill,glow)
    const body=new T.MeshBasicMaterial({color:'#aaaaaa',transparent:true,opacity:.22,depthWrite:false})
    materials.push(body)
    function shape(g,p,lit=false,parent=group,rotation=null,name=''){
      geo(g);const mesh=new T.Mesh(g,lit?fill:body);mesh.position.set(...p);if(rotation)mesh.rotation.set(...rotation);mesh.name=name;parent.add(mesh)
      const edges=new T.LineSegments(geo(new T.EdgesGeometry(g,35)),ink);edges.position.copy(mesh.position);edges.rotation.copy(mesh.rotation);parent.add(edges);return mesh
    }
    const cube=(p,d,lit=false,parent=group,name='')=>shape(new T.BoxGeometry(...d),p,lit,parent,null,name)
    function rod(a,b,r=.015,parent=group){const start=new T.Vector3(...a),end=new T.Vector3(...b),delta=end.clone().sub(start);const g=new T.CylinderGeometry(r,r,delta.length(),8);g.applyQuaternion(new T.Quaternion().setFromUnitVectors(new T.Vector3(0,1,0),delta.normalize()));return shape(g,start.add(end).multiplyScalar(.5).toArray(),false,parent)}
    function curve(points,r=.018,parent=group){return shape(new T.TubeGeometry(new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p))),20,r,6,false),[0,0,0],false,parent)}
    function wash(p,w,h,wall=false){const m=new T.Mesh(geo(new T.PlaneGeometry(w,h)),glow);m.position.set(...p);if(!wall)m.rotation.x=-Math.PI/2;group.add(m)}
    function sconce(x){cube([x,2.05,-1.04],[.18,.3,.12],true);wash([x,2.05,-1.115],1.1,1.5,true)}
    function tableLamp(x,z){
      shape(new T.CylinderGeometry(.12,.14,.035,16),[x,.79,z]);rod([x,.8,z],[x,1.19,z]);shape(new T.CylinderGeometry(.12,.22,.22,20,1,true),[x,1.27,z],true);wash([x,.78,z],1.25,1.1)
    }
    function floorLamp(x,z){
      shape(new T.CylinderGeometry(.17,.19,.04,18),[x,.02,z]);rod([x,.04,z],[x,1.8,z],.022)
      shape(new T.CylinderGeometry(.18,.29,.3,20,1,true),[x,1.92,z],true)
      const bulbMaterial=new T.MeshBasicMaterial({color:'#fff0d8',transparent:true,opacity:0,depthWrite:false})
      materials.push(bulbMaterial)
      const bulb=new T.Mesh(geo(new T.SphereGeometry(.082,12,8)),bulbMaterial);bulb.name='floor-lamp-bulb';bulb.position.set(x,1.88,z);group.add(bulb)
      bulbs.push(bulbMaterial)
      wash([x,.025,z],1.6,1.7)
    }
    if(id==='anti-aging'){
      sconce(-.85);sconce(.55)
      cube([.7,.035,-3.85],[1.55,.035,.68],false,group,'yoga-mat')
      cube([1.6,.11,-3.8],[.23,.18,.14]);cube([1.6,.1,-3.55],[.23,.16,.14])
      shape(new T.CylinderGeometry(.11,.11,.5,16),[1.45,.13,-4.15],false,group,[0,0,Math.PI/2],'foam-roller')
      for(const z of [-3.55,-3.9]){rod([-.35,.12,z],[-.02,.12,z],.028);for(const x of [-.35,-.02])shape(new T.CylinderGeometry(.09,.09,.085,12),[x,.12,z],false,group,[0,0,Math.PI/2],'dumbbell')}
    }
    if(id==='child'){
      // Clamp attaches to the cabinet shelf behind the screen-right sofa seat.
      const reading=new T.Group();reading.name='child-clamp-reading-lamp';group.add(reading)
      cube([-1.97,.705,-.97],[.15,.055,.16],false,reading,'reading-lamp-clamp')
      cube([-1.97,.66,-.91],[.055,.12,.045],false,reading)
      rod([-1.97,.73,-.97],[-1.97,1.38,-1.04],.018,reading)
      rod([-1.97,1.38,-1.04],[-1.70,1.48,-1.50],.016,reading)
      const origin=new T.Vector3(-1.70,1.46,-1.50),target=new T.Vector3(-1.46,.70,-1.95)
      const axis=origin.clone().sub(target),height=axis.length(),rotation=new T.Quaternion().setFromUnitVectors(new T.Vector3(0,1,0),axis.normalize())
      const shade=new T.CylinderGeometry(.055,.105,.13,12,1,true);shade.applyQuaternion(rotation)
      shape(shade,origin.toArray(),false,reading,null,'reading-lamp-head')
      const beamMaterial=new T.ShaderMaterial({transparent:true,depthWrite:false,side:T.DoubleSide,blending:T.AdditiveBlending,
        uniforms:glow.uniforms,
        vertexShader:'varying vec2 tex;void main(){tex=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
        fragmentShader:'varying vec2 tex;uniform vec3 tint;uniform float strength;void main(){float a=sin(tex.y*3.14159)*(.16+.20*tex.y)*strength;gl_FragColor=vec4(tint,a);}'})
      materials.push(beamMaterial)
      const beamGeometry=geo(new T.CylinderGeometry(.035,.23,height,24,1,true));beamGeometry.applyQuaternion(rotation)
      const beam=new T.Mesh(beamGeometry,beamMaterial);beam.name='book-reading-spotlight';beam.position.copy(origin).add(target).multiplyScalar(.5);reading.add(beam)
      const pageGlow=new T.Mesh(geo(new T.PlaneGeometry(.45,.34)),glow);pageGlow.rotation.x=-Math.PI/2;pageGlow.position.copy(target);pageGlow.position.y+=.018;reading.add(pageGlow)

      tableLamp(3.65,-3.25)
      const plant=new T.Group();plant.name='counter-side-foliage-plant';plant.position.set(2.37,0,-1.38);group.add(plant)
      shape(new T.CylinderGeometry(.19,.135,.32,10),[0,.16,0],false,plant,null,'planter')
      shape(new T.CylinderGeometry(.174,.174,.012,10),[0,.326,0],false,plant,null,'soil')
      for(let i=0;i<9;i++){
        const angle=i*2.4,tipHeight=.7+(i%4)*.15,reach=.28+(i%3)*.055
        const start=new T.Vector3(0,.34,0),base=new T.Vector3(Math.cos(angle)*.08,tipHeight-.24,Math.sin(angle)*.08)
        rod(start.toArray(),base.toArray(),.009,plant)
        const vertices=[],indices=[],side=new T.Vector3(-Math.sin(angle),0,Math.cos(angle))
        for(let j=0;j<=6;j++){
          const t=j/6,width=Math.sin(Math.PI*t)*.09
          const center=base.clone().add(new T.Vector3(Math.cos(angle)*reach*t,Math.sin(t*Math.PI*.85)*.19,Math.sin(angle)*reach*t))
          for(const sign of [-1,0,1]){const p=center.clone().addScaledVector(side,sign*width);p.y-=Math.abs(sign)*Math.sin(Math.PI*t)*.025;vertices.push(...p.toArray())}
          if(j<6)for(let k=0;k<2;k++){const a=j*3+k;indices.push(a,a+3,a+1,a+1,a+3,a+4)}
        }
        const leaf=new T.BufferGeometry();leaf.setAttribute('position',new T.Float32BufferAttribute(vertices,3));leaf.setIndex(indices);leaf.computeVertexNormals()
        shape(leaf,[0,0,0],false,plant,null,'foliage-leaf')
      }

      const horse=new T.Group();horse.name='rocking-horse';horse.position.set(.7,0,-3.05);group.add(horse)
      for(const z of [-.19,.19])curve([[-.52,.17,z],[-.3,.055,z],[.25,.055,z],[.52,.17,z]],.024,horse)
      for(const x of [-.25,.25])for(const z of [-.14,.14])rod([x,.13,z],[x*.8,.48,z],.025,horse)
      shape(new T.SphereGeometry(.24,12,8).scale(1.5,.65,.7),[0,.49,0],false,horse)
      cube([0,.59,0],[.38,.05,.25],false,horse)
      rod([.24,.46,0],[.32,.88,0],.075,horse)
      shape(new T.SphereGeometry(.13,12,8).scale(1.4,.85,.65),[.39,.88,0],false,horse)
      for(const z of [-.05,.05])shape(new T.ConeGeometry(.035,.13,6),[.29,1,z],false,horse)
      rod([.3,.77,-.24],[.3,.77,.24],.018,horse)
      curve([[-.3,.5,0],[-.43,.47,0],[-.47,.31,0]],.025,horse)
    }
    if(id==='elder'){
      for(const x of [-2.55,.48]){
        floorLamp(x,-4.7)
        for(let i=0;i<3;i++)cube([x,.34+i*.055,-2],[.28-i*.025,.045,.21],false,group,'book')
      }
      wash([-.9,.42,-1.7],3,1.6)
    }
    if(id==='pregnancy'){
      sconce(-.85)
      const cradle=new T.Group();cradle.name='baby-cradle';cradle.position.set(.55,0,-2.5);group.add(cradle)
      cube([0,.35,0],[.95,.08,.55],false,cradle)
      cube([0,.41,0],[.85,.07,.46],false,cradle,'mattress')
      for(const z of [-.28,.28]){
        rod([-.48,.76,z],[.48,.76,z],.025,cradle)
        for(let x=-.46;x<=.47;x+=.115)rod([x,.38,z],[x,.75,z],.013,cradle)
      }
      for(const x of [-.48,.48]){rod([x,.76,-.28],[x,.76,.28],.025,cradle);for(const z of [-.25,.25])rod([x,.13,z],[x,.75,z],.02,cradle)}
      for(const x of [-.38,.38])curve([[x,.17,-.4],[x,.045,0],[x,.17,.4]],.028,cradle)
    }
    if(id==='nomad'){
      cube([2.85,.8,-3.07],[.36,.045,.24]);rod([2.85,.82,-3.07],[2.85,1.06,-3.07],.028)
      cube([2.85,1.29,-3.07],[.86,.49,.055],false,group,'monitor')
      cube([2.85,1.29,-3.105],[.79,.42,.015],true)
      cube([2.8,.79,-3.48],[.62,.035,.23],false,group,'keyboard')
      for(let row=0;row<3;row++)for(let col=0;col<10;col++)cube([2.54+col*.057,.813,-3.55+row*.065],[.044,.009,.04])
      shape(new T.SphereGeometry(.065,12,8).scale(.8,.4,1.5),[3.27,.81,-3.46],false,group,null,'mouse')
      cube([3.55,.76,-3.05],[.12,.13,.13],false,group,'clamp-work-lamp')
      rod([3.55,.83,-3.05],[3.55,1.42,-3.05],.018);rod([3.55,1.42,-3.05],[3.29,1.57,-3.24],.018)
      cube([3.25,1.55,-3.29],[.35,.045,.12],true);wash([3.15,.82,-3.42],1.3,.95)
      cube([2.85,1.55,-3.13],[.66,.035,.07],true,group,'monitor-light-bar')
      wash([2.85,1.29,-3.115],.85,.52,true);wash([2.8,.82,-3.42],1.15,.8)
    }
    sets.push({id,group,ink,fill,body,glow,bulbs,weight:0})
  }
  return {
    tick(dt,id,state){for(const s of sets){s.weight=T.MathUtils.lerp(s.weight,id===s.id?1:0,1-Math.exp(-dt*2.5));s.group.visible=s.weight>.002;s.ink.opacity=s.weight*.85;s.ink.color.set(state.daylight>.5?'#555555':'#dddddd');s.body.opacity=s.weight*.23;const lampFactor=s.id==='elder'?elderFrame(state.cycleSeconds).lamps:1;s.fill.opacity=s.weight*(.07+state.brightness*.48*lampFactor);s.fill.color.copy(state.color);s.glow.uniforms.tint.value.copy(state.color);s.glow.uniforms.strength.value=s.weight*state.brightness*.5*lampFactor;for(const bulb of s.bulbs){bulb.opacity=s.weight*state.brightness*lampFactor;bulb.color.copy(state.color)}}},
    dispose(){sets.forEach(s=>scene.remove(s.group));geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose())}
  }
}
