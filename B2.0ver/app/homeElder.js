import * as T from 'three'

export const ELDER_POSITION=[2.62,0,-2.05]
export function elderFrame(seconds=0){
  const t=((seconds%25)+25)%25,ease=T.MathUtils.smoothstep
  return {
    floorBoost:ease(t,6,10)*(1-ease(t,14,17)),
    curtain:ease(t,17,20)*(1-ease(t,24,25)),
    lamps:1-ease(t,20,22)+ease(t,24,25),
  }
}
