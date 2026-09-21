import {pregnancyFrame} from './homePregnancy.js'
import {elderFrame} from './homeElder.js'
import {nomadFrame} from './homeNomad.js'
import * as T from 'three'
export const SCENE_VIEWS={
  'anti-aging':[-1,.62,-1.35],
  child:[-.25,2.3,-1.4],
  elder:[-1.4,1.15,1.65],
  pregnancy:[1.05,.95,-1.7],
  nomad:[-.4,1.2,-1.8],
}
// Rounded tower loop: straight sides joined by semicircular top and bottom.
function purifierOutletPoint(phase,radius=.12){
  const p=((phase%1)+1)%1*4
  if(p<1){const a=p*Math.PI;return [Math.cos(a)*radius,1.30+Math.sin(a)*radius]}
  if(p<2)return [-radius,1.30-(p-1)*.64]
  if(p<3){const a=(p-1)*Math.PI;return [Math.cos(a)*radius,.66+Math.sin(a)*radius]}
  return [radius,.66+(p-3)*.64]
}
// Grayscale fixture bodies; only diffusers and light washes carry scenario color.
export function createHomeFixtures(scene){
  const geometries=[],materials=[],sets=[]
  const geo=g=>(geometries.push(g),g)
  for(const id of Object.keys(SCENE_VIEWS)){
    const bulbs=[];let sofaGlow=null,sofaFill=null,portraitInk=null,mobile=null,purifierAir=null
    const group=new T.Group();group.name=`fixtures-${id}`;scene.add(group)
    const ink=new T.LineBasicMaterial({color:'#dddddd',transparent:true,depthWrite:false})
    const fill=new T.MeshBasicMaterial({color:'#ffffff',transparent:true,side:T.DoubleSide,depthWrite:false})
    const glow=new T.ShaderMaterial({transparent:true,depthWrite:false,side:T.DoubleSide,blending:T.AdditiveBlending,uniforms:{tint:{value:new T.Color()},strength:{value:0}},vertexShader:'varying vec2 tex;void main(){tex=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'varying vec2 tex;uniform vec3 tint;uniform float strength;void main(){float r=length((tex-.5)*2.);gl_FragColor=vec4(tint,pow(max(0.,1.-r),2.)*strength);}'})
    materials.push(ink,fill,glow)
    const body=new T.MeshBasicMaterial({color:'#aaaaaa',transparent:true,opacity:.22,depthWrite:false})
    materials.push(body)
    function shape(g,p,lit=false,parent=group,rotation=null,name=''){
      geo(g);const mesh=new T.Mesh(g,lit?fill:body);mesh.position.set(...p);if(rotation)mesh.rotation.set(...rotation);mesh.name=name;parent.add(mesh)
      const edges=new T.LineSegments(geo(new T.EdgesGeometry(g,35)),ink);edges.name=name?`${name}-outline`:'';edges.position.copy(mesh.position);edges.rotation.copy(mesh.rotation);parent.add(edges);return mesh
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
      // Three upright bottles sit on the actual sink basin floor (Mesh159).
      for(const x of [2.84,3.00,3.16]){
        const bottle=new T.Group();bottle.name='sink-baby-bottle';bottle.position.set(x,.625,-1.40);group.add(bottle)
        shape(new T.CylinderGeometry(.043,.047,.17,10),[0,.085,0],false,bottle)
        shape(new T.CylinderGeometry(.045,.045,.025,10),[0,.1825,0],false,bottle)
        shape(new T.ConeGeometry(.022,.055,10),[0,.2225,0],false,bottle)
        for(let i=0;i<3;i++)rod([-.018,.06+i*.032,-.045],[.018,.06+i*.032,-.045],.002,bottle)
      }
      const cradle=new T.Group();cradle.name='baby-cradle';cradle.position.set(.55,0,-2.5);group.add(cradle)
      cube([0,.35,0],[.95,.08,.55],false,cradle)
      cube([0,.41,0],[.85,.07,.46],false,cradle,'mattress')
      for(const z of [-.28,.28]){
        rod([-.48,.76,z],[.48,.76,z],.025,cradle)
        for(let x=-.46;x<=.47;x+=.115)rod([x,.38,z],[x,.75,z],.013,cradle)
      }
      for(const x of [-.48,.48]){rod([x,.76,-.28],[x,.76,.28],.025,cradle);for(const z of [-.25,.25])rod([x,.13,z],[x,.75,z],.02,cradle)}
      for(const x of [-.48,.48])curve([[x,.24,-.4],[x,.13,-.25],[x,.045,0],[x,.13,.25],[x,.24,.4]],.028,cradle)
      const clamp=new T.Group();clamp.name='cradle-mobile-clamp';cradle.add(clamp)
      cube([-.25,.76,.28],[.09,.075,.09],false,clamp)
      rod([-.25,.76,.28],[-.25,1.16,.28],.013,clamp)
      curve([[-.25,1.16,.28],[-.25,1.27,.24],[-.10,1.27,0],[0,1.22,0]],.013,clamp)
      mobile=new T.Group();mobile.name='cradle-rotating-mobile';mobile.position.set(0,1.19,0);cradle.add(mobile)
      for(let i=0;i<3;i++){
        const a=i*Math.PI*2/3,x=Math.cos(a)*.19,z=Math.sin(a)*.19
        rod([0,0,0],[x,-.025,z],.008,mobile);rod([x,-.025,z],[x,-.15,z],.004,mobile)
        shape(i===0?new T.OctahedronGeometry(.043):i===1?new T.SphereGeometry(.04,8,6):new T.TorusGeometry(.034,.009,5,10),[x,-.19,z],false,mobile,null,'mobile-toy')
      }
      // Reference tower: filter drum, tapered control neck and tall hollow loop.
      const purifier=new T.Group();purifier.name='pregnancy-air-purifier';purifier.position.set(-3.42,0,-1.25);group.add(purifier)
      shape(new T.CylinderGeometry(.165,.165,.32,24),[0,.21,0],false,purifier,null,'purifier-intake')
      shape(new T.CylinderGeometry(.17,.17,.055,24),[0,.0275,0],false,purifier,null,'purifier-base')
      shape(new T.CylinderGeometry(.13,.165,.15,24),[0,.445,0],false,purifier,null,'purifier-control-neck')
      shape(new T.CylinderGeometry(.029,.029,.008,16),[0,.44,-.154],false,purifier,[Math.PI/2,0,0],'purifier-display')
      for(let row=0;row<12;row++)for(let i=0;i<24;i++){
        const a=(i+(row%2)*.5)*Math.PI/12;shape(new T.SphereGeometry(.0035,4,3),[Math.cos(a)*.166,.075+row*.025,Math.sin(a)*.166],false,purifier,null,'intake-perforation')
      }
      const ringVertices=[],ringIndices=[],segments=80
      for(let i=0;i<=segments;i++){
        for(const [radius,z] of [[.165,-.055],[.115,-.061],[.115,.045],[.165,.045]]){
          const [x,y]=purifierOutletPoint(i/segments,radius);ringVertices.push(x,y,z)
        }
        if(i<segments)for(let side=0;side<4;side++){
          const a=i*4+side,b=i*4+(side+1)%4;ringIndices.push(a,a+4,b,b,a+4,b+4)
        }
      }
      const ring=new T.BufferGeometry();ring.setAttribute('position',new T.Float32BufferAttribute(ringVertices,3));ring.setIndex(ringIndices);ring.computeVertexNormals()
      shape(ring,[0,0,0],false,purifier,null,'purifier-tower-loop')
      const outlet=[];for(let i=0;i<=segments;i++){const [x,y]=purifierOutletPoint(i/segments,.12);outlet.push(new T.Vector3(x,y,-.063))}
      const outletLine=new T.Line(geo(new T.BufferGeometry().setFromPoints(outlet)),ink);outletLine.name='purifier-ring-outlet';purifier.add(outletLine)
      const count=150,positions=new Float32Array(count*3),alphas=new Float32Array(count)
      const g=geo(new T.BufferGeometry());g.setAttribute('position',new T.BufferAttribute(positions,3));g.setAttribute('alpha',new T.BufferAttribute(alphas,1))
      const m=new T.ShaderMaterial({transparent:true,depthWrite:false,blending:T.AdditiveBlending,uniforms:{strength:{value:0}},vertexShader:'attribute float alpha;varying float opacity;void main(){opacity=alpha;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);gl_PointSize=2.7;}',fragmentShader:'uniform float strength;varying float opacity;void main(){float soft=1.-smoothstep(.1,.5,length(gl_PointCoord-.5));gl_FragColor=vec4(.88,.95,1.,soft*opacity*strength);}'})
      materials.push(m);purifierAir=new T.Points(g,m);purifierAir.name='purifier-intake-outlet-particles';purifierAir.frustumCulled=false;purifier.add(purifierAir)
    }
    if(id==='nomad'){
      sofaGlow=glow.clone();sofaFill=fill.clone();materials.push(sofaGlow,sofaFill)
      const foliage=new T.Group();foliage.name='nomad-counter-side-foliage';foliage.position.set(2.37,0,-1.38);group.add(foliage)
      shape(new T.CylinderGeometry(.21,.155,.38,12),[0,.19,0],false,foliage,null,'foliage-planter')
      shape(new T.TorusGeometry(.202,.014,6,16),[0,.38,0],false,foliage,[Math.PI/2,0,0],'foliage-planter-rim')
      shape(new T.CylinderGeometry(.192,.192,.012,12),[0,.369,0],false,foliage,null,'foliage-soil')
      curve([[0,.37,0],[.025,.85,-.015],[-.015,1.32,0],[.015,1.66,-.02]],.013,foliage)
      for(let i=0;i<11;i++){
        const angle=i*2.4,height=.64+i*.086,reach=.25+(i%3)*.045
        const base=new T.Vector3(.015,height,0),start=base.clone().add(new T.Vector3(Math.cos(angle)*.085,.08,Math.sin(angle)*.085))
        rod(base.toArray(),start.toArray(),.007,foliage)
        const side=new T.Vector3(-Math.sin(angle),0,Math.cos(angle)),vertices=[],indices=[],midrib=[]
        for(let j=0;j<=8;j++){
          const t=j/8,width=Math.sin(Math.PI*t)*.105
          const center=start.clone().add(new T.Vector3(Math.cos(angle)*reach*t,Math.sin(t*Math.PI*.85)*.18-.04*t,Math.sin(angle)*reach*t))
          midrib.push(center)
          for(const sign of [-1,0,1]){const point=center.clone().addScaledVector(side,sign*width);point.y-=Math.abs(sign)*Math.sin(Math.PI*t)*.03;vertices.push(...point.toArray())}
          if(j<8)for(let k=0;k<2;k++){const n=j*3+k;indices.push(n,n+3,n+1,n+1,n+3,n+4)}
        }
        const leaf=new T.BufferGeometry();leaf.setAttribute('position',new T.Float32BufferAttribute(vertices,3));leaf.setIndex(indices);leaf.computeVertexNormals()
        shape(leaf,[0,0,0],false,foliage,null,'broad-foliage-leaf')
        const vein=new T.Line(geo(new T.BufferGeometry().setFromPoints(midrib)),ink);vein.name='leaf-midrib';foliage.add(vein)
      }
      // Countertop accessories stay on the two dry ends, leaving the sink clear.
      const counterProps=new T.Group();counterProps.name='nomad-counter-accessories';counterProps.position.y=.835;group.add(counterProps)
      function vessel(name,x,z,profile,y=0){
        return shape(new T.LatheGeometry(profile.map(p=>new T.Vector2(...p)),16),[x,y,z],false,counterProps,null,name)
      }
      function counterCup(x,z,y=0){
        vessel('counter-cup',x,z,[[0,0],[.039,0],[.048,.10],[.041,.103],[.032,.012],[0,.012]],y)
        shape(new T.TorusGeometry(.029,.007,6,12),[x+.061,y+.059,z],false,counterProps,null,'counter-cup-handle')
      }
      counterCup(4.19,-1.43);counterCup(4.19,-1.18)
      const machine=new T.Group();machine.name='counter-coffee-machine';machine.position.set(4.57,0,-1.31);counterProps.add(machine)
      cube([0,.022,0],[.34,.044,.39],false,machine,'coffee-machine-base')
      cube([0,.22,.075],[.32,.36,.20],false,machine,'coffee-machine-body')
      cube([0,.36,-.06],[.32,.11,.20],false,machine,'coffee-machine-head')
      cube([0,.075,-.105],[.27,.025,.15],false,machine,'coffee-drip-tray')
      for(let i=0;i<5;i++)rod([-.105+i*.052,.091,-.16],[-.105+i*.052,.091,-.055],.004,machine)
      for(const x of [-.045,.045])rod([x,.305,-.11],[x,.267,-.11],.012,machine)
      cube([-.055,.365,-.166],[.105,.043,.008],false,machine,'coffee-machine-display')
      shape(new T.CylinderGeometry(.017,.017,.012,12),[.084,.365,-.17],false,machine,[Math.PI/2,0,0],'coffee-machine-button')
      counterCup(4.57,-1.415,.09)

      function taskBeam(name,origin,target,radius,material){
        const a=new T.Vector3(...origin),b=new T.Vector3(...target),delta=a.clone().sub(b)
        const shader=new T.ShaderMaterial({uniforms:material.uniforms,transparent:true,depthWrite:false,side:T.DoubleSide,blending:T.AdditiveBlending,
          vertexShader:'varying vec2 tex;void main(){tex=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
          fragmentShader:'varying vec2 tex;uniform vec3 tint;uniform float strength;void main(){gl_FragColor=vec4(tint,sin(tex.y*3.14159)*.28*strength);}'})
        materials.push(shader)
        const beam=new T.Mesh(geo(new T.CylinderGeometry(.025,radius,delta.length(),24,1,true)),shader);beam.name=name;beam.position.copy(a).add(b).multiplyScalar(.5);beam.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),delta.normalize());group.add(beam)
        const patch=new T.Mesh(geo(new T.PlaneGeometry(radius*2.8,radius*2.3)),material);patch.position.copy(b);patch.position.y+=.01;patch.rotation.x=-Math.PI/2;group.add(patch)
      }
      const laptop=new T.Group();laptop.name='nomad-laptop';laptop.position.set(-.25,.68,-1.94);group.add(laptop)
      cube([0,0,0],[.48,.024,.31],false,laptop,'laptop-keyboard')
      shape(new T.BoxGeometry(.48,.30,.022),[0,.15,-.145],false,laptop,[-.18,0,0],'laptop-screen')
      for(let row=0;row<3;row++)for(let col=0;col<8;col++)cube([-.19+col*.054,.016,-.05+row*.056],[.036,.006,.036],false,laptop)
      // Coffee rests on the sofa side platform, next to the laptop user.
      shape(new T.CylinderGeometry(.082,.082,.012,20),[.65,.1944,-1.64],false,group,null,'coffee-saucer')
      shape(new T.CylinderGeometry(.057,.046,.105,16,1,true),[.65,.2524,-1.64],false,group,null,'coffee-cup')
      shape(new T.CylinderGeometry(.050,.050,.005,16),[.65,.2894,-1.64],false,group,null,'coffee-surface')
      shape(new T.TorusGeometry(.034,.009,6,12),[.716,.2554,-1.64],false,group,null,'coffee-handle')
      cube([-1.18,2.04,-.97],[.14,.07,.16],false,group,'nomad-wall-clamp')
      rod([-1.18,2.075,-.97],[-1.18,2.30,-1.12]);rod([-1.18,2.30,-1.12],[-1.03,2.20,-1.62])
      const lampOrigin=new T.Vector3(-1.03,2.17,-1.62),lampTarget=new T.Vector3(-.25,.71,-1.94)
      const headGeometry=new T.CylinderGeometry(.055,.105,.13,12,1,true)
      headGeometry.applyQuaternion(new T.Quaternion().setFromUnitVectors(new T.Vector3(0,1,0),lampOrigin.clone().sub(lampTarget).normalize()))
      const head=shape(headGeometry,lampOrigin.toArray(),true,group,null,'nomad-clamp-head');head.material=sofaFill
      taskBeam('nomad-laptop-beam',lampOrigin.toArray(),lampTarget.toArray(),.32,sofaGlow)
      taskBeam('nomad-desk-lamp-beam',[3.25,1.52,-3.29],[3.18,.83,-3.47],.34,glow)
      // A full-width downward sheet replaces the central cone under the monitor bar.
      const barLight=new T.BufferGeometry()
      barLight.setAttribute('position',new T.Float32BufferAttribute([
        2.52,1.53,-3.13,3.18,1.53,-3.13,3.24,.83,-3.48,
        2.52,1.53,-3.13,3.24,.83,-3.48,2.46,.83,-3.48,
      ],3))
      barLight.setAttribute('uv',new T.Float32BufferAttribute([0,1,1,1,1,0,0,1,1,0,0,0],2))
      const barMaterial=new T.ShaderMaterial({uniforms:glow.uniforms,transparent:true,depthWrite:false,side:T.DoubleSide,blending:T.AdditiveBlending,
        vertexShader:'varying vec2 tex;void main(){tex=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
        fragmentShader:'varying vec2 tex;uniform vec3 tint;uniform float strength;void main(){float edge=smoothstep(0.,.045,tex.x)*smoothstep(0.,.045,1.-tex.x);gl_FragColor=vec4(tint,edge*(.13+.12*tex.y)*strength);}'})
      materials.push(barMaterial)
      const barBeam=new T.Mesh(geo(barLight),barMaterial);barBeam.name='nomad-monitor-bar-beam';group.add(barBeam)

      const briefcase=new T.Group();briefcase.name='nomad-chair-briefcase';briefcase.position.set(2.336,.48,-3.62);group.add(briefcase)
      cube([0,.18,0],[.34,.36,.13],false,briefcase,'briefcase-body')
      cube([0,.27,-.069],[.31,.012,.008],false,briefcase,'briefcase-seam')
      for(const x of [-.095,.095])cube([x,.29,-.075],[.038,.052,.015],false,briefcase,'briefcase-latch')
      curve([[-.067,.36,0],[-.067,.42,0],[.067,.42,0],[.067,.36,0]],.012,briefcase)

      cube([2.85,.8,-3.07],[.36,.045,.24]);rod([2.85,.82,-3.07],[2.85,1.06,-3.07],.028)
      cube([2.85,1.29,-3.07],[.86,.49,.055],false,group,'monitor').visible=false
      cube([2.85,1.29,-3.105],[.79,.42,.015],false,group,'monitor-uniform-screen').visible=false
      portraitInk=new T.LineBasicMaterial({color:'#f4f7ff',transparent:true,opacity:1,depthWrite:false,depthTest:false});materials.push(portraitInk)
      function portraitPath(name,x,points){
        const geometry=geo(new T.BufferGeometry().setFromPoints(points.map(([dx,y])=>new T.Vector3(x+dx,y,-3.141))))
        const line=new T.Line(geometry,portraitInk);line.name=name;line.renderOrder=4;group.add(line)
      }
      for(const x of [2.64,3.04]){
        cube([x,1.31,-3.119],[.35,.34,.006],false,group,'conference-tile').visible=false
        portraitPath('conference-head-outline',x,Array.from({length:33},(_,i)=>{const a=i/32*Math.PI*2;return [Math.cos(a)*.057,1.365+Math.sin(a)*.068]}))
        portraitPath('conference-shoulders-outline',x,[[-.025,1.308],[-.027,1.285],[-.095,1.264],[-.124,1.229],[-.13,1.183],[.13,1.183],[.124,1.229],[.095,1.264],[.027,1.285],[.025,1.308]])
        portraitPath('conference-collar',x,[[-.062,1.275],[0,1.235],[.062,1.275]])
        portraitPath('conference-hair',x,[[-.055,1.381],[-.026,1.407],[.008,1.389],[.052,1.382]])
        for(const dx of [-.023,.023])portraitPath('conference-eye',x,[[dx-.007,1.369],[dx+.007,1.369]])
        portraitPath('conference-smile',x,[[-.019,1.339],[0,1.332],[.019,1.339]])
      }
      cube([3.15,.79,-3.48],[.62,.035,.23],false,group,'keyboard')
      for(let row=0;row<3;row++)for(let col=0;col<10;col++)cube([2.89+col*.057,.813,-3.55+row*.065],[.044,.009,.04])
      shape(new T.SphereGeometry(.065,12,8).scale(.8,.4,1.5),[2.60,.81,-3.46],false,group,null,'mouse')
      cube([3.55,.76,-3.05],[.12,.13,.13],false,group,'clamp-work-lamp')
      rod([3.55,.83,-3.05],[3.55,1.42,-3.05],.018);rod([3.55,1.42,-3.05],[3.29,1.57,-3.24],.018)
      cube([3.25,1.55,-3.29],[.35,.045,.12],true);wash([3.15,.82,-3.42],1.3,.95)
      cube([2.85,1.55,-3.13],[.66,.035,.07],true,group,'monitor-light-bar')
      wash([2.8,.82,-3.42],1.15,.8)
    }
    sets.push({id,group,ink,fill,body,glow,bulbs,sofaGlow,sofaFill,portraitInk,mobile,purifierAir,weight:0})
  }
  return {
    tick(dt,id,state){
      for(const s of sets){
        s.weight=T.MathUtils.lerp(s.weight,id===s.id?1:0,1-Math.exp(-dt*2.5))
        // Match the figures' visibility envelope, including all prop outlines.
        const visibility=s.id==='nomad'?T.MathUtils.clamp(state.brightness/.85,0,1):1,w=s.weight*visibility
        s.group.visible=w>.002
        s.ink.opacity=w*.85;s.ink.color.set(state.daylight>.5?'#555555':'#dddddd');s.body.opacity=w*.23
        if(s.mobile){
          const t=state.cycleSeconds||0,turn=T.MathUtils.smoothstep(t,15,18)
          s.mobile.rotation.y=turn*.9*(1-T.MathUtils.smoothstep(t,23,25))
          const {position,alpha}=s.purifierAir.geometry.attributes
          for(let i=0;i<position.count;i++){
            const u=((t*.28+i*.618)%1),a=i*2.4
            if(i<40){const r=.17+(1-u)*.57;position.setXYZ(i,Math.cos(a)*r,.16+(i%5)*.047,Math.sin(a)*r)}
            else {const [x,y]=purifierOutletPoint((i-40)/110,.12);position.setXYZ(i,x*(1+u*.35),y+Math.sin(a)*u*.025,-.063-u*.95)}
            alpha.setX(i,Math.sin(u*Math.PI)*.65)
          }
          position.needsUpdate=true;alpha.needsUpdate=true;s.purifierAir.material.uniforms.strength.value=w*pregnancyFrame(t).light
        }
        const n=nomadFrame(state.cycleSeconds)
        const lampFactor=s.id==='elder'?elderFrame(state.cycleSeconds).lamps:s.id==='nomad'?n.desk*n.reset*.65:1
        s.fill.opacity=w*(.07+state.brightness*.48*lampFactor);s.fill.color.copy(state.color)
        s.glow.uniforms.tint.value.copy(state.color);s.glow.uniforms.strength.value=w*state.brightness*.5*lampFactor
        if(s.sofaGlow){
          const factor=n.sofa*n.reset
          s.sofaGlow.uniforms.tint.value.copy(state.color);s.sofaGlow.uniforms.strength.value=w*state.brightness*.65*factor
          s.sofaFill.opacity=w*(.07+.48*factor);s.sofaFill.color.copy(state.color)
          s.portraitInk.opacity=w*.98
          s.group.getObjectByName('mouse').position.x=2.60+n.mouse
          s.group.getObjectByName('mouse-outline').position.x=2.60+n.mouse
        }
        for(const bulb of s.bulbs){bulb.opacity=w*state.brightness*lampFactor;bulb.color.copy(state.color)}
      }
    },
    dispose(){sets.forEach(s=>scene.remove(s.group));geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose())}
  }
}
