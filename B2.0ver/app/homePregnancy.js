import * as T from 'three'

// Shared 25-second clock for the opening, camera and small caregiving gestures.
export function pregnancyFrame(seconds=0){
  const t=((seconds%25)+25)%25,s=(a,b)=>T.MathUtils.smoothstep(t,a,b)
  const light=s(0,3)*(1-s(24,25))
  return {light,curtain:1-light,feed:s(11,12)*(1-s(13,14.5)),baby:Math.sin((t-15)*4)*s(15,15.5)*(1-s(17,18)),stroke:Math.sin((t-19)*2.8)*s(19,19.5)*(1-s(21.5,22.5))}
}
