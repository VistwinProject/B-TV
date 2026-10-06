// Cues lead measured pause endings by 200 ms to allow reading before speech.
export const OUTRO_CAPTIONS = [
  {
    "start": 0,
    "end": 2.86,
    "text": "依照您與家人不同的生活型態，"
  },
  {
    "start": 2.86,
    "end": 4.52,
    "text": "感知空間的變化，"
  },
  {
    "start": 4.52,
    "end": 6.94,
    "text": "做出即時回應調整，"
  },
  {
    "start": 6.94,
    "end": 10.459,
    "text": "房屋的健康，就是您與家人的健康。"
  }
]
export function outroCaptionAt(time){return OUTRO_CAPTIONS.find(c=>time>=c.start&&time<c.end)?.text|| (time>=OUTRO_CAPTIONS.at(-1).end ? OUTRO_CAPTIONS.at(-1).text : '')}
