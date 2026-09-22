import {pregnancyFrame} from './homePregnancy.js'
import {elderFrame,ELDER_POSITION} from './homeElder.js'
import {nomadFrame} from './homeNomad.js'
import * as T from 'three'

// Exhibition art direction. Lux / EML are not interchangeable with screen intensity.
export const LIGHT_PROFILES={
  'anti-aging':{kelvin:5000,nightKelvin:2700,brightness:.85,label:'日間喚醒 → 晚間休息',basis:'文案指定日夜 EML，5000K / 2700K 為展示設定'},
  child:{kelvin:4000,brightness:.75,label:'中性白光 · 學習照明',basis:'文案指定 ≥500 Lux；4000K 為展示設定'},
  elder:{kelvin:5000,brightness:1,label:'明亮冷白光 · 視覺補償',basis:'文案指定 ≥800 Lux 與高色溫；5000K 為展示設定'},
  pregnancy:{kelvin:2200,brightness:.3,label:'柔和暖黃光 · 間接照明',basis:'取文案 1800–2700K 範圍內的 2200K'},
  nomad:{kelvin:5750,brightness:1.035,label:'冷白光 · 專注辦公',basis:'取文案 5000–6500K 範圍中值；桌面 500–1000 Lux'},
}
export const LIGHT_CYCLE_SECONDS=25
const smooth=(a,b,t)=>{const x=T.MathUtils.clamp((t-a)/(b-a),0,1);return x*x*(3-2*x)}
export function lightingFrame(id,seconds){
  const profile=LIGHT_PROFILES[id]||LIGHT_PROFILES['anti-aging'],t=((seconds%LIGHT_CYCLE_SECONDS)+LIGHT_CYCLE_SECONDS)%LIGHT_CYCLE_SECONDS
  const dawn=smooth(24,25,t)
  const night=id==='anti-aging'?smooth(3,9,t)*(1-dawn):0
  const kelvin=T.MathUtils.lerp(profile.kelvin,profile.nightKelvin||profile.kelvin,night)
  const brightness=id==='pregnancy'?profile.brightness*pregnancyFrame(t).light:id==='nomad'?profile.brightness*nomadFrame(t).all:id==='anti-aging'?profile.brightness*Math.max(1-smooth(17.5,20,t),dawn):profile.brightness*smooth(0,3,t)*(1-smooth(23,25,t))
  const daylight=id==='anti-aging'?1-night:0
  const windowLight=id==='anti-aging'?daylight:(.45+.45*(.5+.5*Math.sin(t/LIGHT_CYCLE_SECONDS*Math.PI*2)))*(id==='pregnancy'?.35:1)
  return {kelvin,brightness,daylight,windowLight,label:id==='anti-aging'?`${t>=24?'日間緩亮':t>=20?'夜間休息 · 燈光關閉':t>=17.5?'夜間燈光漸暗':night>=1?'夜幕降臨 · 保留室內照明':night>0?'日暮漸暗':'日間情境光'}${t>=20&&t<24?'':` · ${Math.round(kelvin/50)*50}K`}`:`${profile.label} · ${profile.kelvin}K`}
}
export function kelvinColor(k){
  const warm=new T.Color('#ffb45e'),neutral=new T.Color('#fff0d8'),cool=new T.Color('#e0ecff')
  return k<4000?warm.lerp(neutral,T.MathUtils.clamp((k-1800)/2200,0,1)):neutral.lerp(cool,T.MathUtils.clamp((k-4000)/2500,0,1))
}
export function createHomeLighting(scene,metadata,positions){
  const root=new T.Group();root.name='scenario-downlights';scene.add(root)
  const geometries=[],materials=[],uniforms={tint:{value:new T.Color('#ffffff')},strength:{value:0}}
  const downlights=[]
  function shader(pool=false,lightUniforms=uniforms){
    const m=new T.ShaderMaterial({uniforms:lightUniforms,transparent:true,depthWrite:false,side:T.DoubleSide,blending:T.AdditiveBlending,
      vertexShader:'varying vec2 tex; void main(){tex=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
      fragmentShader:pool?'uniform vec3 tint;uniform float strength;varying vec2 tex;void main(){float r=length(tex-.5)*2.;float a=pow(max(0.,1.-r),2.)*.4*strength;gl_FragColor=vec4(tint,a);}':'uniform vec3 tint;uniform float strength;varying vec2 tex;void main(){float a=(.035+.13*tex.y)*sin(tex.y*3.14159)*strength;gl_FragColor=vec4(tint,a);}'})
    materials.push(m);return m
  }
  for(const name of metadata.spotlights){
    const source=metadata.spotlightObjects.find(o=>o.name===name);if(!source)continue
    const b=new T.Box3(),p=new T.Vector3()
    for(let i=source.firstSegment*2;i<(source.firstSegment+source.segments)*2;i++)b.expandByPoint(p.fromBufferAttribute(positions,i))
    const origin=b.getCenter(new T.Vector3());origin.y=b.min.y
    const beamUniforms={tint:uniforms.tint,strength:{value:0}},poolUniforms={tint:uniforms.tint,strength:{value:0}}
    const beamMaterial=shader(false,beamUniforms),poolMaterial=shader(true,poolUniforms)
    const height=origin.y-metadata.shellAlignment.floorY-.02
    const geometry=new T.CylinderGeometry(.025,.62,height,32,1,true);geometries.push(geometry)
    const beam=new T.Mesh(geometry,beamMaterial);beam.position.set(origin.x,origin.y-height/2,origin.z);root.add(beam)
    const disk=new T.PlaneGeometry(1.8,1.8);geometries.push(disk)
    const pool=new T.Mesh(disk,poolMaterial);pool.rotation.x=-Math.PI/2;pool.position.set(origin.x,.018,origin.z);root.add(pool)
    beam.name=`downlight-beam-${name}`;pool.name=`downlight-pool-${name}`
    downlights.push({beam, pool,origin,height,beamUniforms,poolUniforms,distance:Math.hypot(origin.x-ELDER_POSITION[0],origin.z-ELDER_POSITION[2])})
  }
  // Source-model counter (Group296) and overhead cabinet underside (Group684).
  // Only light is drawn: a soft downward sheet and a rectangular countertop wash.
  const counterLight=new T.Group();counterLight.name='under-cabinet-area-light';root.add(counterLight)
  const areaMaterial=new T.ShaderMaterial({uniforms,transparent:true,depthWrite:false,side:T.DoubleSide,blending:T.AdditiveBlending,
    vertexShader:'varying vec2 tex;void main(){tex=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader:'uniform vec3 tint;uniform float strength;varying vec2 tex;void main(){float edge=smoothstep(0.,.13,tex.x)*smoothstep(0.,.13,1.-tex.x);float vertical=sin(tex.y*3.14159);float a=edge*vertical*(.06+.13*tex.y)*strength*.5;gl_FragColor=vec4(tint,a);}'})
  const washMaterial=new T.ShaderMaterial({uniforms,transparent:true,depthWrite:false,side:T.DoubleSide,blending:T.AdditiveBlending,
    vertexShader:'varying vec2 tex;void main(){tex=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader:'uniform vec3 tint;uniform float strength;varying vec2 tex;void main(){vec2 edge=smoothstep(vec2(0.),vec2(.12,.22),tex)*smoothstep(vec2(0.),vec2(.12,.22),1.-tex);gl_FragColor=vec4(tint,edge.x*edge.y*.25*strength);}'})
  materials.push(areaMaterial,washMaterial)
  const top=[[2.78,2.185,-1.12],[4.81,2.185,-1.12],[4.81,2.185,-1.38],[2.78,2.185,-1.38]]
  const bottom=[[2.73,.835,-1.015],[4.86,.835,-1.015],[4.86,.835,-1.595],[2.73,.835,-1.595]]
  const vertices=[],uv=[]
  for(let i=0;i<4;i++){
    const j=(i+1)%4
    vertices.push(...bottom[i],...bottom[j],...top[j],...bottom[i],...top[j],...top[i])
    uv.push(0,0,1,0,1,1,0,0,1,1,0,1)
  }
  const areaGeometry=new T.BufferGeometry();areaGeometry.setAttribute('position',new T.Float32BufferAttribute(vertices,3));areaGeometry.setAttribute('uv',new T.Float32BufferAttribute(uv,2))
  const shaft=new T.Mesh(areaGeometry,areaMaterial);shaft.name='counter-downward-light';counterLight.add(shaft)
  const washGeometry=new T.PlaneGeometry(2.13,.58),wash=new T.Mesh(washGeometry,washMaterial)
  wash.name='rectangular-counter-light';wash.rotation.x=-Math.PI/2;wash.position.set(3.795,.836,-1.305);counterLight.add(wash)
  geometries.push(areaGeometry,washGeometry)
  const nearby=new Set([...downlights].sort((a,b)=>a.distance-b.distance).slice(0,3))
  let active='anti-aging',time=0,intensity=.85,daylight=1
  return {
    select(id){if(id!==active){active=id;time=0;if(id==='nomad'||id==='pregnancy'){intensity=0;daylight=0}}},
    tick(dt,paused=false,override=null){
      if(!paused)time+=dt
      // The anti-aging timeline already eases every transition; do not delay its
      // final one-second dawn with a second low-pass filter.
      const frame=override?{...lightingFrame(active,time),...override}:lightingFrame(active,time),blend=active==='anti-aging'||active==='nomad'||active==='pregnancy'?1:1-Math.exp(-dt*3)
      intensity=T.MathUtils.lerp(intensity,frame.brightness,blend)
      daylight=T.MathUtils.lerp(daylight,frame.daylight,blend)
      const boost=active==='elder'?elderFrame(time).floorBoost:0
      for(const lamp of downlights){
        const localBoost=nearby.has(lamp)?boost:0
        lamp.beamUniforms.strength.value=intensity*(1+localBoost*.3)
        lamp.poolUniforms.strength.value=intensity*(1+localBoost*.85)

      }
      uniforms.strength.value=intensity;uniforms.tint.value.lerp(kelvinColor(frame.kelvin),blend)
      // Indirect warm illumination: subdued shafts and a soft floor wash.
      root.visible=intensity>.001
      return {...frame,cycleSeconds:time%LIGHT_CYCLE_SECONDS,brightness:intensity,daylight,color:uniforms.tint.value}
    },
    dispose(){scene.remove(root);geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose())}
  }
}
