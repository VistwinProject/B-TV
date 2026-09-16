// NFC 感應目標環。所有恆動(pulse / sweep)用純 CSS,不走 framer-motion ——
// 避免 AnimatePresence 在 exit 時因無限動畫未 settle 而殘留鬼影畫面。
export default function SensorRing({ accent = 'var(--accent)', pulse = true, children }) {
  return (
    <div className="sensor" style={{ '--ring-accent': accent }}>
      {pulse && [0, 1, 2].map((i) => <span key={i} className="sensor__pulse" />)}
      <span className="sensor__ring sensor__ring--outer" />
      <span className="sensor__sweep" />
      <span className="sensor__ring sensor__ring--inner" />
      <span className="sensor__core" />
      <div className="sensor__icon">{children}</div>
    </div>
  )
}
