// Approximate black-body RGB for illustration; never changes exhibition targets.
export function kelvinColor(kelvin) {
  const t = Math.max(1000, Math.min(40000, Number(kelvin))) / 100
  const channel = n => Math.round(Math.max(0, Math.min(255, n)))
  const r = t <= 66 ? 255 : 329.6987 * (t - 60) ** -.1332
  const g = t <= 66 ? 99.4708 * Math.log(t) - 161.1196 : 288.1222 * (t - 60) ** -.0755
  const b = t >= 66 ? 255 : t <= 19 ? 0 : 138.5177 * Math.log(t - 10) - 305.0448
  return `rgb(${channel(r)}, ${channel(g)}, ${channel(b)})`
}

export function lightingStyle({ kelvin, lightMode = 'neutral' } = {}) {
  const tones = { warm: ['#ffb352','#ffda90'], cool: ['#d2e9ff','#f6fbff'], day: ['#d5eaff','#fff'], cycle: ['#ffb352','#e3f1ff'], neutral: ['#f4f4df','#fff'] }
  const [start, end] = kelvin ? kelvin.map(kelvinColor) : (tones[lightMode] || tones.neutral)
  return { '--lamp-from': start, '--lamp-to': end, '--lamp-min': lightMode === 'warm' ? .25 : .45 }
}
