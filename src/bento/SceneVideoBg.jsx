import { useEffect, useRef, useState } from 'react'

// ── 情境牆背景 —— 樣品屋影片鋪滿整面牆 ────────────────────────────────────────
// 原本影片是中欄的一格(VideoTile),改成整面牆的底,六張資訊卡以淺色玻璃浮在上面。
// 刻意「不」帶 persona key:換情境時這個元件不重掛載 → 影片連續播放,不會每次跳回第 0 秒。
// kiosk 用途:muted + playsInline 才能自動播放(瀏覽器政策);頁面切回前景時補一次 play()。
// 影片載不到時只留下面的淺色柔光層,版面不會破。
const VIDEO_URL = `${import.meta.env.BASE_URL}video/house-tour.mp4`

export default function SceneVideoBg() {
  const ref = useRef(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    const v = ref.current
    if (!v) return
    const play = () => { v.play().catch(() => {}) }
    play()
    // 掛載當下若分頁在背景,autoplay 會被延後/擋掉 → 影片可解碼時與切回前景時各補一次,
    // 否則整面牆的底會停在第 0 影格(背景不動,看起來像壞掉)。
    v.addEventListener('canplay', play)
    document.addEventListener('visibilitychange', play)
    return () => {
      v.removeEventListener('canplay', play)
      document.removeEventListener('visibilitychange', play)
    }
  }, [])

  return (
    <div className="scene-bg" aria-hidden="true">
      {!failed && (
        <video
          ref={ref}
          className="scene-bg__v"
          src={VIDEO_URL}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          disablePictureInPicture
          onError={() => setFailed(true)}
        />
      )}
      {/* 淺色柔光:壓住影片對比,讓玻璃卡片浮得出來(濃度見 --scene-bg-wash)*/}
      <span className="scene-bg__wash" />
    </div>
  )
}
