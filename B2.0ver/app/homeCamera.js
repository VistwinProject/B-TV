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

const nomadHome={focus:[0,0,0],weight:0,zoom:1,direction:SCENE_VIEWS.nomad}
const nomadSofa={focus:[-.25,.95,-1.85],weight:1,zoom:1.8,direction:[-.55,.7,-1.65]}
const nomadDesk={focus:[3.025,1.02,-3.52],weight:1,zoom:1.55,direction:[-.95,1.15,-1.8]}
const nomadClose={...nomadDesk,zoom:1.85,direction:[-.95,1.05,-1.8]}
const nomadWindow={focus:[4.91,1.58,-2.277],weight:1,zoom:1.85,direction:[-1.8,.24,-.45]}
export const nomadCameraFrame=seconds=>cameraFrame([[0,nomadHome],[4,nomadHome],[6.5,nomadWindow],[8.5,nomadWindow],[11,nomadDesk],[14,nomadClose],[15.5,nomadClose],[18.5,nomadSofa],[20.5,nomadSofa],[23,nomadHome],[25,nomadHome]],seconds)

const pregnancyHome={focus:[0,0,0],weight:0,zoom:1,direction:SCENE_VIEWS.pregnancy}
const sink={focus:[3.0,.79,-1.34],weight:1,zoom:3.1,direction:[-.35,1.55,-1.1]}
const feeding={focus:[1.05,.96,-2.50],weight:1,zoom:2.15,direction:[-1.3,.65,-1.5]}
const cradle={focus:[.55,.56,-2.50],weight:1,zoom:2.9,direction:[-.5,1.65,-1.3]}
const mother={focus:[-1.05,.93,-1.72],weight:1,zoom:2.3,direction:[-1.4,.55,-1.15]}
export const pregnancyCameraFrame=seconds=>cameraFrame([[0,pregnancyHome],[3,pregnancyHome],[5,sink],[8.7,sink],[11,feeding],[13,feeding],[15,cradle],[17.5,cradle],[19,mother],[22,mother],[24,pregnancyHome],[25,pregnancyHome]],seconds)
