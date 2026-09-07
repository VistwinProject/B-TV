// ── 玻璃折射用的 SVG 濾鏡(情境牆專用)──────────────────────────────────────
// 技術來源:Apple iOS 26「Liquid Glass」的 web 復刻做法 —— 用 feDisplacementMap 當
// backdrop-filter,讓背景在穿過玻璃時產生位移(= 折射)。參考 kube.io / nikdelvin
// (MIT)的公開作法,這裡是依本專案需求自己寫的實作,不是複製他們的程式碼。
//
// 差別:那些範例用「預先算好的徑向位移圖」做圓角邊緣折射,需要每個面板各自產一張
// 對應尺寸的 map。本專案六張面板尺寸各異又會隨版面拖動改變,所以改用 feTurbulence
// 產生尺寸無關的低頻擾動 —— 讀起來像「手工澆鑄的厚玻璃」,不需要 per-panel 貼圖。
//
// ⚠ backdrop-filter: url(#...) 只有 Chromium 支援(Safari 不支援,會自動只剩模糊)。
//   本專案 kiosk 跑 Chrome 全螢幕(見 RUN.md),所以可用;但這是整面牆最貴的一個
//   效果,六張大面板疊在播放中的影片上,低階機器可能掉幀 → 預設關閉,E 面板可開。
export default function GlassFilter() {
  return (
    <svg className="glass-defs" aria-hidden="true" focusable="false" width="0" height="0">
      <defs>
        <filter
          id="glass-refract"
          colorInterpolationFilters="sRGB"
          x="-20%" y="-20%" width="140%" height="140%"
        >
          {/* 低頻雜訊當位移圖:R 控 X、G 控 Y */}
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.006 0.011"
            numOctaves="2"
            seed="7"
            result="noise"
          />
          {/* 先柔化,否則位移會變成細碎顆粒而不是平滑的玻璃扭曲 */}
          <feGaussianBlur in="noise" stdDeviation="1.6" result="softNoise" />
          <feDisplacementMap
            in="SourceGraphic"
            in2="softNoise"
            scale="16"
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>
      </defs>
    </svg>
  )
}
