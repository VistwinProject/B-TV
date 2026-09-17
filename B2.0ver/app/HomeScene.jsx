import {LIGHT_CYCLE_SECONDS} from './homeLighting.js'
import { useDesign } from './editor/DesignContext.jsx'
import { useEffect, useRef, useState } from 'react'

export default function HomeScene({ person }) {
  const {design,editing}=useDesign()
  const view=design.scenes[person.id].homeView
  const engineRef=useRef(null), latest=useRef(null)
  latest.current={...view,color:person.color,personId:person.id,paused:editing}
  const host = useRef(null)
  const [beat,setBeat]=useState('情境準備中')
  const [status, setStatus] = useState('loading')
  useEffect(() => {
    const controller = new AbortController()
    let engine
    import('./homeScene.js').then(({ createHomeScene }) => createHomeScene(host.current, { signal: controller.signal, onBeat:setBeat }))
      .then(result => {
        if (controller.signal.aborted) { result.dispose(); return }
        engine=result; engineRef.current=result; result.update(latest.current); setStatus('ready')
      }).catch(error => { if (error.name !== 'AbortError' && !controller.signal.aborted) setStatus('error') })
    return () => { controller.abort(); engineRef.current=null; engine?.dispose() }
  }, [])
  useEffect(()=>{engineRef.current?.update(latest.current)},[view,person.color,person.id,editing])
  return <div className="film home-scene" data-person={person.id}>
    <div className="home-scene-canvas" ref={host} role="img" aria-label={`${person.title}的 3D 客廳：實際模型黑底白線與情境燈光，情境正交運鏡`} />
    {status !== 'ready' && <div className="home-scene-status" role="status">{status === 'error' ? '空間線框無法載入，請重新整理畫面' : '正在載入空間線框…'}</div>}
    <div className="film-caption"><b>你的未來居家</b><span>{beat} · {LIGHT_CYCLE_SECONDS} 秒循環</span></div>
    <span className="home-scene-tag">3D 空間線框</span>
  </div>
}
