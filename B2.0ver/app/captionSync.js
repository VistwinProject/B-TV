// Only poll while narration is active; ended/error/cleanup stop the pending frame.
export function createCaptionSync(player,onTime,{request=globalThis.requestAnimationFrame,cancel=globalThis.cancelAnimationFrame}={}){
 let frame=null,running=false,lastTime=-1
 const sync=()=>{
  const time=player.currentTime
  if(Math.abs(time-lastTime)>=1/30){lastTime=time;onTime(time)}
 }
 const tick=()=>{
  frame=null
  if(!running)return
  sync()
  frame=request(tick)
 }
 const stop=()=>{running=false;if(frame!=null)cancel(frame);frame=null}
 return {sync,stop,start(){stop();lastTime=-1;running=true;frame=request(tick)}}
}
