// Boundaries follow the pauses in the supplied 9.89-second outro.wav.
export const OUTRO_CAPTIONS=[
  {start:0,end:2.48,text:'依照您不同的生活型態，'},
  {start:2.48,end:4.28,text:'感知空間的變化，'},
  {start:4.28,end:6.76,text:'做出即時的系統回應，'},
  {start:6.76,end:8.3,text:'房屋的健康，'},
  {start:8.3,end:9.89,text:'就是您的健康。'},
]
export function outroCaptionAt(time){return OUTRO_CAPTIONS.find(c=>time>=c.start&&time<c.end)?.text||''}
