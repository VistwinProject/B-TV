import { useEffect, useRef, useState } from 'react'
import BentoTile from './BentoTile.jsx'
import { asset } from '../assetUrl.js'

// 影片格 — 房屋資訊牆右上那格,循環播放樣品屋影片(無聲、貼齊滿格)。
// kiosk 用途:muted + playsInline 才能自動播放(瀏覽器政策);頁面切回前景時補一次 play()。
// 影片載不到時只留標題不留黑塊,版面不會破。
const VIDEO_URL = asset('video/house-tour.mp4')

export default function VideoTile({ style, delay = 0, className = '', title = '你的未來居家', sub = 'Walkthrough', photo = null }) {
  const ref = useRef(null)
  const [failed, setFailed] = useState(false)

  // 自動播放被擋 / 分頁切回來暫停時,重新催一次播放。
  useEffect(() => {
    if (photo) return
    const v = ref.current
    if (!v) return
    const play = () => { v.play().catch(() => {}) }
    play()
    // 掛載當下若分頁在背景,autoplay 會被延後/擋掉 → 影片可解碼時再補一次,
    // 否則這格會停在第 0 影格(靜止畫面,看起來像圖片而不是導覽影片)。
    v.addEventListener('canplay', play)
    document.addEventListener('visibilitychange', play)
    return () => {
      v.removeEventListener('canplay', play)
      document.removeEventListener('visibilitychange', play)
    }
  }, [photo])

  return (
    <BentoTile color="ink" flush className={`video-tile ${className}`} style={style} delay={delay}>
      {!failed && (photo ? (
        <img
          className="video-tile__v"
          src={asset(photo)}
          alt=""
          onError={() => setFailed(true)}
        />
      ) : (
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
      ))}
      <span className="video-tile__scrim" />
      <span className="house-tile__cap">
        <b>{title}</b>
        <span>{sub}</span>
      </span>
    </BentoTile>
  )
}
