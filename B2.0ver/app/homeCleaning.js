import * as T from 'three'

const ease=(a,b,t)=>T.MathUtils.smoothstep(t,a,b)
// The child camera sees +X on the left. Scan the physical counter in that direction.
export function cleaningFrame(seconds,position=0){
  const t=((seconds%25)+25)%25,progress=ease(4,12,t)
  const arrival=4+position*8,clean=ease(arrival,arrival+1.6,t)
  return {progress,germs:ease(0,.8,t)*(1-clean),stars:ease(arrival+.7,arrival+2.7,t)*(1-ease(22,25,t)),scan:ease(3.5,4.2,t)*(1-ease(12,13,t))}
}
export function createHomeCleaning(scene,scenario='child'){
  const pregnancy=scenario==='pregnancy'
  const scanStart=pregnancy?3.23:4.86,scanEnd=pregnancy?2.78:2.73
  const clock=t=>pregnancy?T.MathUtils.clamp(4+(t-5)*8/3,0,20):t
  const root=new T.Group();root.name=`${scenario}-counter-cleaning`;root.visible=false;scene.add(root)
  const geometries=[],materials=[],icons=[]
  const plane=new T.PlaneGeometry(1,1);geometries.push(plane)
  const vertexShader='varying vec2 tex;void main(){tex=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}'
  for(let i=0;i<(pregnancy?6:12);i++){
    const fraction=pregnancy?(i%3)/2:(i%6)/5,z=pregnancy?-1.39:-1.14-Math.floor(i/6)*.29
    const material=new T.ShaderMaterial({transparent:true,depthWrite:false,side:T.DoubleSide,uniforms:{germs:{value:0},stars:{value:0},pulse:{value:1},saturation:{value:pregnancy?.65:1},starColor:{value:new T.Color(.55,.76,.64)}},vertexShader,
      fragmentShader:`varying vec2 tex;uniform float germs;uniform float stars;uniform float pulse;uniform float saturation;uniform vec3 starColor;
      void main(){vec2 p=(tex-.5)*2.;float r=length(p),angle=atan(p.y,p.x);
        float border=.52+.17*pow(.5+.5*cos(angle*8.),10.);
        float germ=1.-smoothstep(border-.035,border+.035,r);
        float holes=(1.-smoothstep(.07,.105,length(p-vec2(-.17,.1))))+(1.-smoothstep(.055,.085,length(p-vec2(.17,-.13))));
        vec3 purple=mix(vec3(.62,.50,.74),vec3(.35,.29,.42),clamp(holes,0.,1.));
        float star=1.-smoothstep(.88,1.,pow(abs(p.x),.65)+pow(abs(p.y),.65));
        float a=germ*germs,b=star*stars*pulse;
        vec3 color=(purple*a+starColor*b)/max(a+b,.001);
        float gray=dot(color,vec3(.2126,.7152,.0722));
        gl_FragColor=vec4(mix(vec3(gray),color,saturation),clamp(a+b,0.,1.));}`})
    materials.push(material)
    const mesh=new T.Mesh(plane,material);mesh.name=`cleanliness-icon-${i}`;mesh.scale.setScalar(pregnancy?.085:.15);mesh.renderOrder=4;root.add(mesh)
    icons.push({mesh,material,fraction,x:pregnancy?3.16-fraction*.32:4.69-fraction*1.78,z,phase:i*2.4})
  }
  const scanMaterial=new T.ShaderMaterial({transparent:true,depthWrite:false,side:T.DoubleSide,blending:T.AdditiveBlending,
    uniforms:{alpha:{value:0},tint:{value:new T.Color(.5,1,.8)}},vertexShader,fragmentShader:'varying vec2 tex;uniform float alpha;uniform vec3 tint;void main(){float side=pow(max(0.,1.-abs(tex.x-.5)*2.),2.);float edge=sin(tex.y*3.14159);gl_FragColor=vec4(tint,side*edge*alpha);}'})
  materials.push(scanMaterial)
  const scan=new T.Mesh(plane,scanMaterial);scan.name='left-to-right-counter-scan';scan.rotation.x=-Math.PI/2;scan.scale.set(pregnancy?.09:.26,pregnancy?.44:.59,1);scan.position.set(scanStart,pregnancy?.625:.85,pregnancy?-1.31:-1.305);scan.renderOrder=3;root.add(scan)
  // The luminous curtain reaches from the cabinet underside down to the counter.
  const curtainMaterial=scanMaterial.clone();curtainMaterial.uniforms=scanMaterial.uniforms;materials.push(curtainMaterial)
  const curtain=new T.Mesh(plane,curtainMaterial);curtain.rotation.y=Math.PI/2;curtain.scale.set(pregnancy?.44:.57,pregnancy?.36:1.32,1);curtain.position.set(scanStart,pregnancy?.80:1.51,-1.305);root.add(curtain)
  return {
    tick(id,state,camera){
      root.visible=id===scenario;if(!root.visible)return
      const time=state.cycleSeconds,frame=cleaningFrame(clock(time))
      scan.position.x=curtain.position.x=T.MathUtils.lerp(scanStart,scanEnd,frame.progress)
      scanMaterial.uniforms.alpha.value=frame.scan*.45
      if(pregnancy)scanMaterial.uniforms.tint.value.copy(state.color)
      for(const icon of icons){
        // Arrival follows the same eased sweep as the visible scan line.
        const arrival=4+8*inverseEase((scanStart-icon.x)/(scanStart-scanEnd))
        const f=cleaningFrame(clock(time),(arrival-4)/8)
        icon.material.uniforms.germs.value=pregnancy?T.MathUtils.smoothstep(time,2.5,3.5)*(1-T.MathUtils.smoothstep(clock(time),arrival,arrival+1.6)):f.germs
        if(pregnancy){icon.material.uniforms.starColor.value.copy(state.color);f.stars=T.MathUtils.smoothstep(clock(time),arrival+.7,arrival+2.7)*(1-T.MathUtils.smoothstep(time,23,25))}
        icon.material.uniforms.stars.value=f.stars
        icon.material.uniforms.pulse.value=.8+.2*Math.sin(time*2+icon.phase)
        icon.mesh.position.set(icon.x+Math.sin(time*1.1+icon.phase)*.025,(pregnancy?.83+(icons.indexOf(icon)>2?.10:0):1.02)+Math.sin(time*1.7+icon.phase)*.035,icon.z)
        icon.mesh.quaternion.copy(camera.quaternion)
        icon.mesh.rotateZ(Math.sin(time+icon.phase)*.12*f.germs)
      }
    },
    dispose(){scene.remove(root);geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose())}
  }
}
function inverseEase(value){let lo=0,hi=1;for(let i=0;i<16;i++){const mid=(lo+hi)/2;if(mid*mid*(3-2*mid)<value)lo=mid;else hi=mid}return (lo+hi)/2}
