import {SCENE_VIEWS} from './homeFixtures.js'
import {LIGHT_CYCLE_SECONDS} from './homeLighting.js'

// Shares the light/cleaning clock, so pausing or changing scenes cannot desync the tour.
const overview={focus:[0,0,0],weight:0,zoom:1,direction:SCENE_VIEWS.child}
const counter={focus:[3.79,1.30,-1.31],weight:1,zoom:2.35,direction:[-.32,1.05,-1.6]}
const reading={focus:[-1.05,.95,-1.65],weight:1,zoom:2.4,direction:[-.35,1.2,-1.65]}
const shots=[[0,overview],[2,overview],[4,counter],[14.5,counter],[17,reading],[20.5,reading],[23,overview],[25,overview]]
function cameraFrame(shots,seconds){
  const t=((seconds%LIGHT_CYCLE_SECONDS)+LIGHT_CYCLE_SECONDS)%LIGHT_CYCLE_SECONDS
  let i=0;while(i<shots.length-2&&t>shots[i+1][0])i++
  const [start,a]=shots[i],[end,b]=shots[i+1],u=(t-start)/(end-start),ease=u*u*u*(u*(u*6-15)+10)
  const mix=(x,y)=>x+(y-x)*ease
  // Unused overview focus inherits the adjacent detail focus, avoiding a detour to origin.
  const from=a.weight?a.focus:b.focus,to=b.weight?b.focus:a.focus
  return {focus:from.map((v,j)=>mix(v,to[j])),weight:mix(a.weight,b.weight),zoom:mix(a.zoom,b.zoom),direction:a.direction.map((v,j)=>mix(v,b.direction[j]))}
}

export const childCameraFrame=seconds=>cameraFrame(shots,seconds)
const home={focus:[0,0,0],weight:0,zoom:1,direction:SCENE_VIEWS['anti-aging']}
const sofa={focus:[-1.46,.95,-1.7],weight:1,zoom:2.35,direction:[-.8,.65,-1.65]}
const stretch={focus:[.7,1.1,-3.85],weight:1,zoom:2.05,direction:[-1.4,.62,-1.1]}
const blinds={focus:[4.91,1.6,-2.277],weight:1,zoom:2.65,direction:[-1.8,.24,-.45]}
const homeShots=[[0,home],[3.2,home],[5.3,sofa],[6.5,sofa],[9.4,stretch],[10,stretch],[12,blinds],[15.2,blinds],[17.5,home],[25,home]]
export const antiAgingCameraFrame=seconds=>cameraFrame(homeShots,seconds)

const elderHome={focus:[0,0,0],weight:0,zoom:1,direction:SCENE_VIEWS.elder}
const elderView={focus:[2.62,.85,-2.05],weight:1,zoom:1.08,direction:[-1.6,.38,-1.35]}
const elderClose={...elderView,zoom:1.5,direction:[-1.6,.3,-1.35]}
const elderShots=[[0,elderHome],[3,elderHome],[6,elderView],[11,elderClose],[14,elderClose],[17,elderHome],[25,elderHome]]
export const elderCameraFrame=seconds=>cameraFrame(elderShots,seconds)
