// Cues lead measured pause endings by 200 ms to allow reading before speech.
export const OVERVIEW_CAPTIONS = [
  {
    "start": 0,
    "end": 4.91,
    "text": "目前室溫26.2度，\n相對濕度58%，"
  },
  {
    "start": 4.91,
    "end": 9.41,
    "text": "正在透過環境感測器偵測空間的數據，"
  },
  {
    "start": 9.41,
    "end": 12.619,
    "text": "以下是空間的詳細資訊。"
  }
]
export function overviewCaptionAt(time){return OVERVIEW_CAPTIONS.find(c=>time>=c.start&&time<c.end)?.text||OVERVIEW_CAPTIONS.at(-1).text}
