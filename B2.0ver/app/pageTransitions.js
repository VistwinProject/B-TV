import {advancePlayback,DURATION} from './playback.js'

// Only the two automatic story transitions fade out before switching pages.
export function advancePresentation(state,event){
 const now=event.now??state.started
 if(event.action==='pause'||event.action==='resume'){
  const next=advancePlayback(state,event)
  if(event.action==='resume'&&!event.restart&&state.pausedAt!=null&&state.transition){
   return {...next,transition:{...state.transition,started:state.transition.started+Math.max(0,now-state.pausedAt)}}
  }
  return next
 }
 if(state.pausedAt!=null)return advancePlayback(state,event)
 if(state.transition&&event.action==='clock'){
  if(now-state.transition.started<DURATION.fade)return state
  const target=state.transition.target,delay=now-target.started
  return {...target,started:now,deadline:target.deadline==null?null:target.deadline+delay,
   confirmation:target.confirmation?{...target.confirmation,at:now}:null,transition:null}
 }
 if(state.transition&&!['person','invite','next','intro','outro','reset','remove'].includes(event.action))return state
 const next=advancePlayback(state,event)
 if(next.revision===state.revision)return next
 // The final scenario has already faded out after its two-second hold.
 if(event.action==='clock'&&state.exitStartedAt!=null&&next.screen==='farewell')return {...next,transition:null,fadeIn:true}
 if(event.action==='clock'&&state.screen==='overview'&&next.screen==='choose'){
  const {transition:ignored,...target}=next
  return {...state,transition:{target:{...target,fadeIn:true},started:now}}
 }
 return {...next,transition:null,fadeIn:false}
}
