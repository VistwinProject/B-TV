// 角落 ops 指示燈 — 對訪客近乎隱形,只讓展務員一眼判斷 NFC 連線狀態。
const PHASE_LABEL = {
  idle: '待機', intro: '前言', card: '等待邀請卡', house: '房屋資訊',
  character: '等待角色', scene: '解方展演', loop: '情境體驗', outro: '結語',
}

export default function StatusDot({ wsStatus, connected, phase, demo = false }) {
  const ok    = wsStatus === 'connected'
  const label = demo ? '本機模擬' : !ok ? '連線中' : connected ? '讀卡機就緒' : '等待讀卡機'
  const tone  = !ok ? 'down' : connected ? 'live' : 'idle'
  return (
    <div className={`statusdot statusdot--${tone}`} title={`${wsStatus} · reader:${connected} · ${phase}`}>
      <span className="statusdot__led" />
      <span className="statusdot__label">{label}</span>
      <span className="statusdot__phase">{PHASE_LABEL[phase] || phase}</span>
    </div>
  )
}
