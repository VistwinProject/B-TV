// ── 交錯光束背景(情境頁按 V)──────────────────────────────────────────────────
// 依主視覺:深藍底 + 幾道交錯的光。每道光三層 —— 外暈(寬、很模糊、低不透明)、
// 內暈、白色亮核(細、銳利),與待機頁光束同一套疊法,但這裡是多道直線/弧線交會。
// viewBox 用 preserveAspectRatio="none" 撐滿,線寬走 non-scaling-stroke 不隨拉伸變粗。
const BEAMS = [
  { d: 'M 372 -60 L 138 640', w: 7 },            // 左斜長線
  { d: 'M 455 -60 L 742 640', w: 6 },            // 右斜長線(與左線在上方交會成 Λ)
  { d: 'M 40 660 Q 560 470 1060 60', w: 13 },    // 橫過的大弧(交叉點成 A 的橫槓)
]

export default function SceneBeams() {
  return (
    <svg className="scene-vlines" viewBox="0 0 1000 560" preserveAspectRatio="none" aria-hidden="true">
      {/* 外暈 */}
      {BEAMS.map((b, i) => (
        <path key={`g${i}`} className="scene-vlines__glow" d={b.d} fill="none"
          stroke="var(--vline-glow)" strokeWidth={b.w * 5} vectorEffect="non-scaling-stroke" />
      ))}
      {/* 內暈 */}
      {BEAMS.map((b, i) => (
        <path key={`m${i}`} className="scene-vlines__mid" d={b.d} fill="none"
          stroke="var(--vline-mid)" strokeWidth={b.w * 2} vectorEffect="non-scaling-stroke" />
      ))}
      {/* 亮核 */}
      {BEAMS.map((b, i) => (
        <path key={`c${i}`} className="scene-vlines__core" d={b.d} fill="none"
          stroke="var(--vline-core)" strokeWidth="1.4" vectorEffect="non-scaling-stroke" />
      ))}
    </svg>
  )
}
