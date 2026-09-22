// Phrase boundaries follow pauses in the supplied 12.57-second information-wall recording.
export const OVERVIEW_CAPTIONS=[
  {start:0,end:5.22,text:'目前室溫26.2度，\n相對濕度58%，'},
  {start:5.22,end:9.62,text:'正在透過12合1感測器偵測空間的數據，'},
  {start:9.62,end:12.57,text:'以下是空間的詳細資訊。'},
]
export function overviewCaptionAt(time){return OVERVIEW_CAPTIONS.find(c=>time>=c.start&&time<c.end)?.text||OVERVIEW_CAPTIONS.at(-1).text}
