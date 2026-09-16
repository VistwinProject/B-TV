import * as T from 'three'

// Exhibition art direction. Lux / EML are not interchangeable with screen intensity.
export const LIGHT_PROFILES={
  'anti-aging':{kelvin:5000,nightKelvin:2700,brightness:.85,label:'日間喚醒 → 晚間休息',basis:'文案指定日夜 EML，5000K / 2700K 為展示設定'},
  child:{kelvin:4000,brightness:.75,label:'中性白光 · 學習照明',basis:'文案指定 ≥500 Lux；4000K 為展示設定'},
  elder:{kelvin:5000,brightness:1,label:'明亮冷白光 · 視覺補償',basis:'文案指定 ≥800 Lux 與高色溫；5000K 為展示設定'},
  pregnancy:{kelvin:2200,brightness:.3,label:'柔和暖黃光 · 間接照明',basis:'取文案 1800–2700K 範圍內的 2200K'},
  nomad:{kelvin:5750,brightness:.9,label:'冷白光 · 專注辦公',basis:'取文案 5000–6500K 範圍中值；桌面 500–1000 Lux'},
}
export const LIGHT_CYCLE_SECONDS=20
const smooth=(a,b,t)=>{const x=T.MathUtils.clamp((t-a)/(b-a),0,1);return x*x*(3-2*x)}
export function lightingFrame(id,seconds){
  const profile=LIGHT_PROFILES[id]||LIGHT_PROFILES['anti-aging'],t=((seconds%20)+20)%20
  const night=id==='anti-aging'?smooth(3,9,t):0
  const kelvin=T.MathUtils.lerp(profile.kelvin,profile.nightKelvin||profile.kelvin,night)
  const brightness=id==='anti-aging'?profile.brightness*(1-smooth(13,18,t)):profile.brightness*smooth(0,3,t)*(1-smooth(18,20,t))
  const daylight=id==='anti-aging'?1-night:0
  const windowLight=id==='anti-aging'?daylight:(.45+.45*(.5+.5*Math.sin(t/20*Math.PI*2)))*(id==='pregnancy'?.35:1)
  return {kelvin,brightness,daylight,windowLight,label:id==='anti-aging'?`${t>=18?'夜間休息 · 燈光關閉':t>=13?'夜間燈光漸暗':night>=1?'夜幕降臨 · 保留室內照明':night>0?'日暮漸暗':'日間情境光'}${t>=18?'':` · ${Math.round(kelvin/50)*50}K`}`:`${profile.label} · ${profile.kelvin}K`}
}
export function kelvinColor(k){
  const warm=new T.Color('#ffb45e'),neutral=new T.Color('#fff0d8'),cool=new T.Color('#e0ecff')
  return k<4000?warm.lerp(neutral,T.MathUtils.clamp((k-1800)/2200,0,1)):neutral.lerp(cool,T.MathUtils.clamp((k-4000)/2500,0,1))
}
export function createHomeLighting(scene,metadata,positions){
  const root=new T.Group();root.name='scenario-downlights';scene.add(root)
  const geometries=[],materials=[],uniforms={tint:{value:new T.Color('#ffffff')},strength:{value:0}}
  function shader(pool=false){
    const m=new T.ShaderMaterial({uniforms,transparent:true,depthWrite:false,side:T.DoubleSide,blending:T.AdditiveBlending,
      vertexShader:'varying vec2 tex; void main(){tex=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
      fragmentShader:pool?'uniform vec3 tint;uniform float strength;varying vec2 tex;void main(){float r=length(tex-.5)*2.;float a=pow(max(0.,1.-r),2.)*.4*strength;gl_FragColor=vec4(tint,a);}':'uniform vec3 tint;uniform float strength;varying vec2 tex;void main(){float a=(.035+.13*tex.y)*sin(tex.y*3.14159)*strength;gl_FragColor=vec4(tint,a);}'})
    materials.push(m);return m
  }
  const beamMaterial=shader(),poolMaterial=shader(true)
  for(const name of metadata.spotlights){
    const source=metadata.spotlightObjects.find(o=>o.name===name);if(!source)continue
    const b=new T.Box3(),p=new T.Vector3()
    for(let i=source.firstSegment*2;i<(source.firstSegment+source.segments)*2;i++)b.expandByPoint(p.fromBufferAttribute(positions,i))
    const origin=b.getCenter(new T.Vector3());origin.y=b.min.y
    const height=origin.y-metadata.shellAlignment.floorY-.02
    const geometry=new T.CylinderGeometry(.025,.62,height,32,1,true);geometries.push(geometry)
    const beam=new T.Mesh(geometry,beamMaterial);beam.position.set(origin.x,origin.y-height/2,origin.z);root.add(beam)
    const disk=new T.PlaneGeometry(1.8,1.8);geometries.push(disk)
    const pool=new T.Mesh(disk,poolMaterial);pool.rotation.x=-Math.PI/2;pool.position.set(origin.x,.018,origin.z);root.add(pool)
  }
  let active='anti-aging',time=0,intensity=.85,daylight=1
  return {
    select(id){if(id!==active){active=id;time=0}},
    tick(dt,paused=false){
      if(!paused)time+=dt
      const frame=lightingFrame(active,time),blend=1-Math.exp(-dt*3)
      intensity=T.MathUtils.lerp(intensity,frame.brightness,blend)
      daylight=T.MathUtils.lerp(daylight,frame.daylight,blend)
      uniforms.strength.value=intensity;uniforms.tint.value.lerp(kelvinColor(frame.kelvin),blend)
      // Indirect warm illumination: subdued shafts and a soft floor wash.
      root.visible=intensity>.001
      return {...frame,brightness:intensity,daylight,color:uniforms.tint.value}
    },
    dispose(){scene.remove(root);geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose())}
  }
}
