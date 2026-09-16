// 註冊 tag 感應成功的瞬間閃光 — 亮環外擴 + 打勾。CSS 動畫(見 style.css);
// App 以計時器於 CONFIRM_MS 後移除,不依賴動畫回呼。
export default function ConfirmRipple({ accent }) {
  const color = accent || 'var(--accent-2)'
  return (
    <div className="confirm" style={{ '--confirm-accent': color }}>
      <span className="confirm__ring" />
      <span className="confirm__ring confirm__ring--2" />
      <span className="confirm__check">
        <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="3"
             strokeLinecap="round" strokeLinejoin="round">
          <path d="M8 17 l5 5 L24 10" />
        </svg>
      </span>
    </div>
  )
}
