import { useEffect, useRef, useState } from 'react'
import BentoTile from './BentoTile.jsx'
import { asset } from '../assetUrl.js'

// 影片格 — 房屋資訊牆右上那格,循環播放樣品屋影片(無聲、貼齊滿格)。
// kiosk 用途:muted + playsInline 才能自動播放(瀏覽器政策);頁面切回前景時補一次 play()。
// 影片載不到時只留標題不留黑塊,版面不會破。
const VIDEO_URL = asset('video/house-tour.mp4')

export default function VideoTile({ style, delay = 0, className = '', title = '你的未來居家', sub = 'Walkthrough' }) {
  const ref = useRef(null)
  const [failed, setFailed] = useState(false)

  // 自動播放被擋 / 分頁切回來暫停時,重新催一次播放。
  useEffect(() => {
    const v = ref.current
    if (!v) return
    const play = () => { v.play().catch(() => {}) }
    play()
    document.addEventListener('visibilitychange', play)
    return () => document.removeEventListener('visibilitychange', play)
  }, [])

  return (
    <BentoTile color="ink" flush className={`video-tile ${className}`} style={style} delay={delay}>
      {!failed && (
        <video
          ref={ref}
          className="video-tile__v"
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
      <span className="video-tile__scrim" />
      <span className="house-tile__cap">
        <b>{title}</b>
        <span>{sub}</span>
      </span>
    </BentoTile>
  )
}
