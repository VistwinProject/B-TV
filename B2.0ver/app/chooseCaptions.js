// Final sentence starts at 14.2 s, one second earlier per exhibition review.
export const CHOOSE_CAPTIONS = [
  {
    "start": 0,
    "end": 5.14,
    "text": "同一間房子，面對不同的人，照顧方式也應該不同。"
  },
  {
    "start": 5.14,
    "end": 11.14,
    "text": "孩子、孕婦、長輩，正在工作或休息的人，都會有不同需求。"
  },
  {
    "start": 11.14,
    "end": 14.2,
    "text": "請在「感應光寓」中選擇一種生活情境，"
  },
  {
    "start": 14.2,
    "end": 23.759,
    "text": "觀察房子如何主動調整光線、空氣、溫度與聲音，讓空間真正回應你。"
  }
]
export function chooseCaptionAt(time) {return CHOOSE_CAPTIONS.find(c=>time>=c.start&&time<c.end)?.text || (time<0?CHOOSE_CAPTIONS[0].text:CHOOSE_CAPTIONS.at(-1).text)}
