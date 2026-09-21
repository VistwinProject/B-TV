// Phrase boundaries follow pauses in the supplied 13.42-second information-wall recording.
export const OVERVIEW_CAPTIONS=[
  {start:0,end:5.12,text:'目前室溫26.2度，\n相對濕度58%，'},
  {start:5.12,end:10.98,text:'正在透過12合1感測器感知空間的即時變化，隨時更新，'},
  {start:10.98,end:13.42,text:'以下是空間的詳細資訊。'},
]
export function overviewCaptionAt(time){return OVERVIEW_CAPTIONS.find(c=>time>=c.start&&time<c.end)?.text||OVERVIEW_CAPTIONS.at(-1).text}
