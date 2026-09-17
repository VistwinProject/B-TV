import { createOrbAudioDriver } from './orbAudio.js'
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'

const OrbContext=createContext(null)
export function VoiceOrbProvider({children,analyser,active,paused}){
  const destination=useRef(null),host=useRef(null),orb=useRef(null),parking=useRef(null)
  const current=useRef({active,paused});current.current={active,paused}
  const [error,setError]=useState('')
  const attach=useCallback(node=>{
    destination.current=node
    if(host.current){
      if(node)node.appendChild(host.current)
      else parking.current?.appendChild(host.current)
    }
  },[])
  useEffect(()=>{
    let cancelled=false,frame
    const parked=document.createElement('div');parked.style.cssText='position:fixed;left:-10000px;top:0;width:520px;height:520px;pointer-events:none;opacity:0';parked.setAttribute('aria-hidden','true');document.body.appendChild(parked);parking.current=parked
    const element=document.createElement('div');element.className='anlb-orb-renderer';host.current=element;parked.appendChild(element)
    if(destination.current)destination.current.appendChild(element)
    import(/* @vite-ignore */ `${import.meta.env.BASE_URL}anlb-orb/orb.js`).then(({mountOrb})=>{
      if(cancelled)return
      const instance=mountOrb(element);orb.current=instance
      instance.ready.then(()=>{
        if(cancelled)return
        const drive=createOrbAudioDriver(instance)
        const tick=()=>{
          const state=current.current
          const level=drive({running:state.active,paused:state.paused,analyser:analyser.current})
          element.dataset.mode=state.active?'thinking':'idle'
          element.dataset.level=level.toFixed(3)
          frame=requestAnimationFrame(tick)
        };tick()
      }).catch(e=>{if(!cancelled)setError(`語音球無法啟動：${e.message}`)})
    }).catch(e=>{if(!cancelled)setError(`語音球無法載入：${e.message}`)})
    return()=>{cancelled=true;cancelAnimationFrame(frame);orb.current?.dispose();orb.current=null;element.remove();parked.remove();parking.current=null;host.current=null}
  },[analyser])
  return <OrbContext.Provider value={{attach,error}}>{children}</OrbContext.Provider>
}
export function VoiceOrb(){
  const context=useContext(OrbContext)
  return <div className="anlb-orb" aria-label="ANLB 語音球"><div className="anlb-orb-slot" ref={context?.attach}/>{context?.error && <p role="status">{context.error}</p>}</div>
}
