import {useEffect,useRef,useState} from 'react'
import {DURATION} from './playback.js'
import {useDesign} from './editor/DesignContext.jsx'
export default function OverviewHome({onTourStart,onTourComplete}){
 const {editing}=useDesign(),host=useRef(null),engine=useRef(null),paused=useRef(editing)
 paused.current=editing
 const [status,setStatus]=useState('loading')
 useEffect(()=>{
  const controller=new AbortController();let instance,complete=false
  onTourStart?.()
  import('./homeScene.js').then(({createHomeScene})=>createHomeScene(host.current,{signal:controller.signal,overview:true,onTour:frame=>{if(frame.time>=DURATION.overview/1000&&!complete){complete=true;onTourComplete?.()}}})).then(result=>{
   if(controller.signal.aborted){result.dispose();return}instance=result;engine.current=result;result.update({personId:'nomad',color:'#7ba9df',zoom:1,x:0,y:0,paused:paused.current});setStatus('ready')
  }).catch(error=>{if(!controller.signal.aborted){setStatus('error');onTourComplete?.()}})
  return()=>{controller.abort();engine.current=null;instance?.dispose()}
 },[])
 useEffect(()=>{engine.current?.update({personId:'nomad',color:'#7ba9df',zoom:1,x:0,y:0,paused:editing})},[editing])
 return <div className="overview-home home-scene" aria-label="未來居家空間線稿掃描">
  <div className="home-scene-canvas" ref={host}/>
  {status!=='ready'&&<div className="home-scene-status">{status==='error'?'空間線稿無法載入，請重新整理':'正在載入空間線稿…'}</div>}

 </div>
}
