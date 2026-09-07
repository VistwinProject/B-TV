// ── 執行期素材路徑 ────────────────────────────────────────────────────────────
// 為什麼不直接用 `${import.meta.env.BASE_URL}foo.png`:
//   子路徑部署(--base=./)時 BASE_URL 是相對路徑 "./"。放在 HTML 屬性(src)裡沒問題,
//   但如果是包進 CSS 的 url() —— 尤其是先塞進自訂屬性(--logo-src / --bg-src)再給
//   mask / background 用 —— 瀏覽器會拿「樣式表所在位置」當基準,也就是 /assets/,
//   於是 ./icons/anlb.png 被解成 /assets/icons/anlb.png → 404。
//   遮罩圖載不到的元素會整個不顯示,所以待機頁商標與情境頁背景光在 Pages 上就消失了。
// 這裡在執行期用 document.baseURI 解成絕對 URL,任何部署路徑都不會歪。
export const asset = (p) => {
  try { return new URL(`${import.meta.env.BASE_URL}${p}`, document.baseURI).href }
  catch { return `${import.meta.env.BASE_URL}${p}` }
}
