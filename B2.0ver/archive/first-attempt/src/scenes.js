// ── B 區 TV 端 · 5 情境 × 4 維度解方資料集 ───────────────────────────────────
// 官方分鏡:卡片刷完顯示房屋即時資訊 → 選角色鑰匙圈 → 電視「依序」展演解方動畫
//   ① 光照 ② 空氣 ③ 溫濕度 ④ 聲音
// 每個維度的目標 setpoint 參考 OTA120 v6「五大感測維度」與 WELL Building Standard,
// 數值為展演用的代表值(實際 setpoint 以寶舖數據表為準,見 zone md §未決點)。
//
// 維度順序固定 DIMENSION_ORDER;每個情境針對該族群調整 headline / detail / 數值。

export const DIMENSION_ORDER = ['light', 'air', 'temp', 'sound']

// 維度共通中繼資料(標籤 / 維度主色 / 單位語意)。各情境只覆寫文案與數值。
export const DIMENSION_META = {
  light: { key: 'light', label: '光照', en: 'LIGHT',  index: '①', tint: '#f5c451' },
  air:   { key: 'air',   label: '空氣', en: 'AIR',    index: '②', tint: '#5ec4b6' },
  temp:  { key: 'temp',  label: '溫濕度', en: 'THERMAL', index: '③', tint: '#5a9bd8' },
  sound: { key: 'sound', label: '聲音', en: 'SOUND',  index: '④', tint: '#b48fd8' },
}

// 每個 persona → 各維度的 { headline, detail, metrics[], sound? }
// metrics: 1–2 筆 { value, unit, note } — 展演時數字會 count-up / highlight。
export const SCENES = {
  'anti-aging': {
    light: {
      headline: '晝夜節律照明',
      detail: '模擬日光週期，白天冷白喚醒、入夜暖光助眠，校正生理時鐘',
      metrics: [
        { value: '2200–6500', unit: 'K', note: '動態色溫' },
        { value: '800', unit: 'lux', note: '日間照度' },
      ],
    },
    air: {
      headline: '抗氧化純淨空氣',
      detail: '負離子淨化 + 高效過濾，降低氧化壓力，延緩細胞老化',
      metrics: [
        { value: '5', unit: 'µg/m³', note: 'PM2.5' },
        { value: '580', unit: 'ppm', note: 'CO₂' },
      ],
    },
    temp: {
      headline: '深層修復溫區',
      detail: '微涼恆溫促進夜間修復與生長激素分泌',
      metrics: [
        { value: '24.0', unit: '°C', note: '室溫' },
        { value: '50', unit: '%', note: '相對濕度' },
      ],
    },
    sound: {
      headline: '深層修復聲景',
      detail: '低頻 Delta 波背景音，引導深睡與細胞再生',
      sound: 'Delta Wave',
      metrics: [
        { value: '35', unit: 'dBA', note: '背景噪音' },
      ],
    },
  },

  child: {
    light: {
      headline: '護眼全光譜',
      detail: '高顯色全光譜 + 無藍光危害，保護發育中的視力',
      metrics: [
        { value: '500', unit: 'lux', note: '學習照度' },
        { value: '4000', unit: 'K', note: '中性白' },
      ],
    },
    air: {
      headline: '醫療級潔淨肺保護',
      detail: 'HEPA 三重過濾，守護發育中的肺部與免疫系統',
      metrics: [
        { value: '3', unit: 'µg/m³', note: 'PM2.5' },
        { value: '0.05', unit: 'mg/m³', note: 'TVOC' },
      ],
    },
    temp: {
      headline: '舒適防敏溫濕',
      detail: '溫和恆濕抑制塵蟎與過敏原，呵護敏感體質',
      metrics: [
        { value: '25.0', unit: '°C', note: '室溫' },
        { value: '55', unit: '%', note: '相對濕度' },
      ],
    },
    sound: {
      headline: '低噪安睡環境',
      detail: '柔和自然白噪音遮蔽干擾，穩定睡眠週期',
      sound: 'White Noise',
      metrics: [
        { value: '32', unit: 'dBA', note: '背景噪音' },
      ],
    },
  },

  elder: {
    light: {
      headline: '高照度視覺補償',
      detail: '提高照度補償視覺退化，夜間動作感應地燈預防跌倒',
      metrics: [
        { value: '750', unit: 'lux', note: '活動照度' },
        { value: '3000', unit: 'K', note: '暖白光' },
      ],
    },
    air: {
      headline: '安全守護監測',
      detail: '持續監測空氣與燃氣，異常即時警示守護長者',
      metrics: [
        { value: '8', unit: 'µg/m³', note: 'PM2.5' },
        { value: '650', unit: 'ppm', note: 'CO₂' },
      ],
    },
    temp: {
      headline: '防失溫恆溫區',
      detail: '偏暖恆溫避免血壓波動與失溫風險',
      metrics: [
        { value: '26.0', unit: '°C', note: '室溫' },
        { value: '50', unit: '%', note: '相對濕度' },
      ],
    },
    sound: {
      headline: '清晰安靜聲學',
      detail: '提升語音清晰度，緊急警報音可被即時辨識',
      sound: 'Clear Speech',
      metrics: [
        { value: '40', unit: 'dBA', note: '背景噪音' },
      ],
    },
  },

  pregnancy: {
    light: {
      headline: '柔和無頻閃照明',
      detail: '無頻閃柔光降低眼壓與焦慮，營造安心休養氛圍',
      metrics: [
        { value: '300', unit: 'lux', note: '休養照度' },
        { value: '2700', unit: 'K', note: '暖光' },
      ],
    },
    air: {
      headline: '零毒害微環境',
      detail: '醫療級過濾 + 零甲醛，為母嬰打造純淨呼吸',
      metrics: [
        { value: '3', unit: 'µg/m³', note: 'PM2.5' },
        { value: '0.03', unit: 'mg/m³', note: '甲醛' },
      ],
    },
    temp: {
      headline: '舒適安養溫濕',
      detail: '恆溫恆濕緩解孕期不適，維持體感舒適',
      metrics: [
        { value: '25.0', unit: '°C', note: '室溫' },
        { value: '55', unit: '%', note: '相對濕度' },
      ],
    },
    sound: {
      headline: '極靜療癒聲景',
      detail: '近乎無聲的環境輔以海浪胎教音，緩解身心壓力',
      sound: 'Ocean Calm',
      metrics: [
        { value: '30', unit: 'dBA', note: '背景噪音' },
      ],
    },
  },

  nomad: {
    light: {
      headline: '專注抗疲勞照明',
      detail: '高照度中性白提升警覺與專注，抑制午後倦怠',
      metrics: [
        { value: '750', unit: 'lux', note: '工作照度' },
        { value: '4500', unit: 'K', note: '日光白' },
      ],
    },
    air: {
      headline: '清醒新風換氣',
      detail: '持續新風維持低 CO₂，保持頭腦清醒與決策力',
      metrics: [
        { value: '6', unit: 'µg/m³', note: 'PM2.5' },
        { value: '700', unit: 'ppm', note: 'CO₂' },
      ],
    },
    temp: {
      headline: '提神工作溫區',
      detail: '微涼乾爽抑制睏意，維持長時間高效專注',
      metrics: [
        { value: '23.0', unit: '°C', note: '室溫' },
        { value: '45', unit: '%', note: '相對濕度' },
      ],
    },
    sound: {
      headline: '專注遮蔽聲場',
      detail: 'Pink Noise 遮蔽環境干擾，鞏固深層工作狀態',
      sound: 'Pink Noise',
      metrics: [
        { value: '45', unit: 'dBA', note: '背景噪音' },
      ],
    },
  },
}
