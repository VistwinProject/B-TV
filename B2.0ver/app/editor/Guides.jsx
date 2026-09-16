import { useEffect, useRef } from 'react'
import { useDesign } from './DesignContext.jsx'
import { resizeTracks } from './model.js'

function Divider({ tracks, index, axis, percent, ...props }) {
  const element = useRef(null)
  useEffect(() => {
    const button = element.current, parent = button.parentElement
    const update = () => {
      const style = getComputedStyle(parent)
      const extent = axis === 'x' ? parent.clientWidth : parent.clientHeight
      const gap = parseFloat(axis === 'x' ? style.columnGap : style.rowGap) || 0
      const padding = parseFloat(axis === 'x' ? style.paddingLeft : style.paddingTop) || 0
      const lengths = (axis === 'x' ? style.gridTemplateColumns : style.gridTemplateRows).split(' ').map(Number.parseFloat)
      const offset = percent ? extent * tracks[0]/100 + gap/2
        : lengths.length === tracks.length && lengths.every(Number.isFinite)
          ? padding + lengths.slice(0,index+1).reduce((sum,v)=>sum+v,0) + gap*(index+.5)
          : extent * tracks.slice(0,index+1).reduce((sum,v)=>sum+v,0)/tracks.reduce((sum,v)=>sum+v,0)
      button.style[axis === 'x' ? 'left' : 'top'] = `${offset}px`
    }
    update()
    const observer = new ResizeObserver(update); observer.observe(parent)
    return () => observer.disconnect()
  }, [tracks, index, axis, percent])
  return <button {...props} ref={element}><i /></button>
}

export default function Guides({ tracks, path, axis = 'x', percent = false }) {
  const { editing, patch } = useDesign()
  if (!editing) return null
  const total = tracks.reduce((sum,v) => sum + v, 0)
  return <>{tracks.slice(0,-1).map((_,index) => {
    const fraction = tracks.slice(0,index+1).reduce((sum,v)=>sum+v,0)/total
    function start(e) {
      e.preventDefault(); e.currentTarget.setPointerCapture(e.pointerId)
      const parent = e.currentTarget.parentElement, rect = parent.getBoundingClientRect()
      const origin = axis === 'x' ? e.clientX : e.clientY, length = axis === 'x' ? rect.width : rect.height
      e.currentTarget.onpointermove = event => {
        const delta = ((axis === 'x' ? event.clientX : event.clientY)-origin)/length*total
        if (percent) patch(path, Math.max(15,Math.min(70,tracks[0]+delta)))
        else patch(path,resizeTracks(tracks,index,delta))
      }
      e.currentTarget.onpointerup = e.currentTarget.onpointercancel = event => { event.currentTarget.onpointermove = null }
    }
    return <Divider tracks={tracks} index={index} axis={axis} percent={percent} key={index} className={`edit-guide edit-guide--${axis}`} style={{ [axis === 'x' ? 'left' : 'top']: `${fraction*100}%` }} aria-label={`調整第 ${index+1} 條${axis === 'x' ? '欄' : '列'}分隔線`} title="拖曳調整比例；方向鍵微調" onPointerDown={start} onKeyDown={e => { const down=['ArrowLeft','ArrowUp'].includes(e.key), up=['ArrowRight','ArrowDown'].includes(e.key); if(!down&&!up)return; e.preventDefault(); e.stopPropagation(); const delta= (down?-1:1)*(percent?1:.03); patch(path,percent?Math.max(15,Math.min(70,tracks[0]+delta)):resizeTracks(tracks,index,delta)) }} />
  })}</>
}
