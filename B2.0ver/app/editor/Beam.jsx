import { useDesign } from './DesignContext.jsx'

export default function Beam() {
  const { design, editing, patch } = useDesign()
  const { beam, theme } = design
  const points = beam.points.map(([x,y]) => [x*19.2,y*10.8])
  points[1] = points[1].map((v, i) => 2*v - (points[0][i]+points[2][i])/2)
  function ribbon(scale) {
    const sides=[[],[]]
    for(let i=0;i<=60;i++){
      const t=i/60, u=1-t
      const x=u*u*points[0][0]+2*u*t*points[1][0]+t*t*points[2][0]
      const y=u*u*points[0][1]+2*u*t*points[1][1]+t*t*points[2][1]
      const dx=2*u*(points[1][0]-points[0][0])+2*t*(points[2][0]-points[1][0])
      const dy=2*u*(points[1][1]-points[0][1])+2*t*(points[2][1]-points[1][1])
      const width=(u*u*beam.widths[0]+2*u*t*beam.widths[1]+t*t*beam.widths[2])*scale/2
      const length=Math.hypot(dx,dy)||1
      sides[0].push(`${x-dy/length*width},${y+dx/length*width}`)
      sides[1].push(`${x+dy/length*width},${y-dx/length*width}`)
    }
    return `M${sides[0].join('L')}L${sides[1].reverse().join('L')}Z`
  }
  return <><svg className="light-ribbon" viewBox="0 0 1920 1080" preserveAspectRatio="none" aria-hidden="true"><defs><filter id="beam-soft"><feGaussianBlur stdDeviation="26" /></filter><filter id="beam-near"><feGaussianBlur stdDeviation="8" /></filter></defs><path d={ribbon(7*beam.glow)} fill={theme.glow} opacity={Math.min(1,beam.glow*.65)} filter="url(#beam-soft)" /><path d={ribbon(2.4)} fill={theme.inner} opacity=".9" filter="url(#beam-near)" /><path d={ribbon(.7*beam.edge)} fill={theme.core} opacity={Math.min(1,beam.edge)} /></svg>
    {editing && beam.points.map(([x,y],i)=><button key={i} className="beam-handle" style={{left:`${Math.max(2,Math.min(98,x))}%`,top:`${Math.max(3,Math.min(97,y))}%`}} aria-label={`光束${['尾端','中段','前端'][i]}控制點`} onPointerDown={e=>{e.preventDefault();e.currentTarget.setPointerCapture(e.pointerId);const rect=e.currentTarget.parentElement.getBoundingClientRect();e.currentTarget.onpointermove=event=>patch(['beam','points',i],[Math.max(-40,Math.min(140,(event.clientX-rect.left)/rect.width*100)),Math.max(-40,Math.min(140,(event.clientY-rect.top)/rect.height*100))]);e.currentTarget.onpointerup=e.currentTarget.onpointercancel=event=>{event.currentTarget.onpointermove=null}}} onKeyDown={e=>{const delta={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]}[e.key];if(!delta)return;e.preventDefault();e.stopPropagation();patch(['beam','points',i],[x+delta[0],y+delta[1]])}}>{['尾端','中段','前端'][i]}</button>)}
  </>
}
