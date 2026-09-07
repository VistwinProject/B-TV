// ── B 區 5 個情境角色(與 B-Table / NFC daemon 凍結對齊)──────────────────────
// keyed by `id` — 與 VistwinProject/B-Table 的 src/personas.js、server/uid-map.json
// 及 NFC daemon 的 tag-present `data.id` 必須完全一致。
// name / title 沿用 OTA120 v6 情境卡;accent 改用情境卡 CI 五色(視覺提供):
//   居家抗老 #7394a5 · 兒童免疫 #8ba78d · 在宅樂齡 #c47f75 · 孕婦照護 #c5b192 · 數位遊牧 #3a446f
// 豐富的環境資料集(光/空氣/溫濕度/
// 聲音 setpoint)放在 scenes.js,由 TV 端負責展演。
//
// 痛點三層次(與 zone md「五情境 痛點 × 解方對照表」同源):
//   painShort  L1 極短(TV 右上 eyebrow)
//   painMedium L2 一句話(TV 右上主標)
//   painLong   L3 詳細長句(桌面端顯示;TV 不用,放這供對齊)
export const PERSONAS = {
  'anti-aging': {
    id: 'anti-aging',
    label: '居家抗老',      // 情境卡正式名稱(情境牆右上顯示)
    labelEn: 'Anti-aging prevention',
    name: '生理逆齡',
    title: '成年人 — 抗衰老',
    photo: 'scene/anti-aging.jpg',   // 情境牆中欄「你的未來居家」卡的照片(缺省 → 退回導覽影片)
    accent: '#7394a5',
    accent2: '#fa864d',  // 參考配色 A(右欄平塗 + 數據強調)
    accent3: '#17ab54',  // 參考配色 B(左欄其中一張平塗)
    palette: ['#7394a5', '#b6dbe6', '#fa864d', '#02cdab', '#17ab54'],  // 情境卡的參考配色(編輯模式可從這裡挑)
    line: '校正晝夜節律，啟動深層修復',
    prompt: '成年人逆齡衰老？',
    painShort: '成年人逆齡衰老',
    painMedium: '熬夜、壓力與老化，怎麼讓身體回到修復狀態？',
    painLong: '長期晚睡與壓力讓晝夜節律紊亂、氧化壓力升高，睡眠品質變差、修復不足，身體與外貌都加速老化。',
  },
  child: {
    id: 'child',
    label: '兒童免疫',      // 情境卡正式名稱(情境牆右上顯示)
    labelEn: 'Child Safety',
    name: '原生健康',
    title: '兒童 — 提高免疫力',
    photo: 'scene/child.jpg',   // 情境牆中欄「你的未來居家」卡的照片(缺省 → 退回導覽影片)
    accent: '#8ba78d',
    accent2: '#e04b64',  // 參考配色 A(右欄平塗 + 數據強調)
    accent3: '#549a60',  // 參考配色 B(左欄其中一張平塗)
    palette: ['#8ba78d', '#e04b64', '#cfd785', '#549a60', '#4b9af7'],  // 情境卡的參考配色(編輯模式可從這裡挑)
    line: '保護發育中的肺部與視力',
    prompt: '提高兒童免疫力？',
    painShort: '提高兒童免疫力',
    painMedium: '怎麼保護發育中的孩子，少生病、長得好？',
    painLong: '兒童發育中的肺部與視力脆弱，容易受空汙與藍光傷害；抵抗力弱、易過敏生病，睡眠也常被干擾而影響發育。',
  },
  elder: {
    id: 'elder',
    label: '在宅樂齡',      // 情境卡正式名稱(情境牆右上顯示)
    labelEn: 'Aging Well at Home',
    name: '安全守護',
    title: '老人 — 在宅終老',
    photo: 'scene/elder.jpg',   // 情境牆中欄「你的未來居家」卡的照片(缺省 → 退回導覽影片)
    accent: '#c47f75',
    accent2: '#bfd71b',  // 參考配色 A(右欄平塗 + 數據強調)
    accent3: '#f96224',  // 參考配色 B(左欄其中一張平塗)
    palette: ['#c47f75', '#f96224', '#bfd71b', '#1a4527', '#eff7d6'],  // 情境卡的參考配色(編輯模式可從這裡挑)
    line: '補償視覺退化，預防意外與跌倒',
    prompt: '老年的安全守護？',
    painShort: '老年安全守護',
    painMedium: '怎麼讓長輩在家安全、安心地終老？',
    painLong: '長者視覺退化、夜間容易跌倒；慢性病讓血壓波動與失溫風險升高，緊急狀況也常無人即時察覺。',
  },
  pregnancy: {
    id: 'pregnancy',
    label: '孕婦照護',      // 情境卡正式名稱(情境牆右上顯示)
    labelEn: 'Maternity Care',
    name: '極致純淨',
    title: '孕婦 — 在家休養',
    accent: '#c5b192',
    accent2: '#628e6b',  // 參考配色 A(右欄平塗 + 數據強調)
    accent3: '#5040ee',  // 參考配色 B(左欄其中一張平塗)
    palette: ['#c3b192', '#628e6b', '#c0e797', '#5040ee', '#5f0004'],  // 情境卡的參考配色(編輯模式可從這裡挑)
    line: '零毒害微環境，緩解身心壓力',
    prompt: '孕婦的安心休養？',
    painShort: '孕婦安心休養',
    painMedium: '怎麼給孕媽咪一個零毒害、能好好休養的家？',
    painLong: '孕期對甲醛等毒害極度敏感、擔心影響胎兒；身心壓力大、睡眠不安，體感也容易不適。',
  },
  nomad: {
    id: 'nomad',
    label: '數位遊牧',      // 情境卡正式名稱(情境牆右上顯示)
    labelEn: 'Digital Nomad',
    name: '數位遊牧',
    title: '高效 — 在家辦公',
    photo: 'scene/nomad.jpg',   // 情境牆中欄「你的未來居家」卡的照片(缺省 → 退回導覽影片)
    accent: '#3a446f',
    accent2: '#7cc8f0',  // 參考配色 A(右欄平塗 + 數據強調)
    accent3: '#3cb3a7',  // 參考配色 B(左欄其中一張平塗)
    palette: ['#3a446f', '#d5bead', '#b19857', '#3cb3a7', '#7cc8f0'],  // 情境卡的參考配色(編輯模式可從這裡挑)
    line: '啟動認知潛能，維持深層專注',
    prompt: '高效的在宅工作？',
    painShort: '高效在家工作',
    painMedium: '在家怎麼維持專注，不被環境拖累效率？',
    painLong: '在家工作容易分心、午後倦怠；CO₂ 累積讓頭腦昏沉、決策力下降，環境噪音也干擾深度工作。',
  },
}

export const PERSONA_ORDER = ['anti-aging', 'child', 'elder', 'pregnancy', 'nomad']
