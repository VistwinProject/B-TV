// Phrase changes follow the pauses in the supplied 25.11-second recording.
export const CHOOSE_CAPTIONS = [
  { start: 0, end: 5.6, text: '同一間房子，面對不同的人，照顧方式也應該不同。' },
  { start: 5.6, end: 13.1, text: '孩子、孕婦、長輩，或正在工作與休息的人，也都會有不同需求。' },
  { start: 13.1, end: 16.74, text: '請在「感光公寓」中選擇一種生活情境，' },
  { start: 16.74, end: 25.11, text: '觀察房子如何主動調整光線、空氣、溫度與聲音，讓空間真正回應你。' },
]

export function chooseCaptionAt(time) {
  return CHOOSE_CAPTIONS.find(caption => time >= caption.start && time < caption.end)?.text
    || (time < 0 ? CHOOSE_CAPTIONS[0].text : CHOOSE_CAPTIONS.at(-1).text)
}
