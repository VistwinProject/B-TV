import * as T from 'three'

// One clock drives camera, task lights and the subtle mouse gesture.
export function nomadFrame(seconds=0){
  const t=((seconds%25)+25)%25,s=(a,b)=>T.MathUtils.smoothstep(t,a,b)
  return {sofa:s(18.5,20.5),desk:s(11,14),all:s(.5,4)*(1-s(24,25)),blinds:1-s(4.5,8.5)*(1-s(24,25)),reset:1-s(24,25),mouse:Math.sin((t-12)*2.2)*.022*s(12,13)*(1-s(14.5,15.5))}
}
