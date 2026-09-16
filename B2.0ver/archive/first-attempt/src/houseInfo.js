// ── 房屋即時資訊(卡片感應後顯示)─────────────────────────────────────────────
// 官方分鏡:卡片放感應區 → 電視顯示房屋即時資訊(小圖標 + 數字):
//   室內外空氣品質、天氣預報、溫濕度、光照、聲音。
// 資料源 = 寶舖 Sensor / 數位孿生平台(見 zone md §未決點:介面待拿到)。
// 目前以 OTA120 v6「五大感測維度」即時值範例為 mock baseline;真值接 WELLTEK
// REST/WS(:3000 / :3001)後替換 readHouseInfo()。展演時數字 count-up 製造「即時」感。
//
// 每筆:{ key, icon, label, value, unit, status }
// status: 'good' | 'warn' | 'info' — 對應狀態色(綠 / 琥珀 / 中性)。

export const HOUSE_INFO = [
  { key: 'pm25',     icon: 'air',     label: '室內 PM2.5',  value: 8,    unit: 'µg/m³', status: 'good' },
  { key: 'pm25_out', icon: 'cloud',   label: '室外 PM2.5',  value: 42,   unit: 'µg/m³', status: 'warn' },
  { key: 'co2',      icon: 'co2',     label: 'CO₂',         value: 620,  unit: 'ppm',   status: 'good' },
  { key: 'temp',     icon: 'temp',    label: '室內溫度',    value: 26.2, unit: '°C',    status: 'good', decimals: 1 },
  { key: 'rh',       icon: 'humid',   label: '相對濕度',    value: 58,   unit: '%',     status: 'good' },
  { key: 'weather',  icon: 'weather', label: '天氣預報',    value: 28,   unit: '°C',    status: 'info', text: '多雲時晴' },
  { key: 'light',    icon: 'light',   label: '照度',        value: 420,  unit: 'lux',   status: 'good' },
  { key: 'sound',    icon: 'sound',   label: '聲學環境',    value: 38,   unit: 'dBA',   status: 'good' },
]

// 提供小幅 jitter 讓數字看起來像即時感測(±範圍以原值百分比計)。
// 接真實 WELLTEK 資料後改為 fetch；此函式簽名保持不變即可無痛切換。
export function jitter(value, pct = 0.04) {
  // 無 Math.random 依賴的展演用偽抖動:用呼叫序號驅動(由呼叫端傳入 phase)。
  return value
}
