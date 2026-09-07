import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// ── B 區 TV display 固定埠口(展覽同網域,務必避開 F 區與 B 桌面投影)──────────────
// F 區占用:web 5173 / 5174 / 5175、ws 8787。
// B 桌面投影 (B-Table) 占用:web 5273。
// B 區 TV display(本 repo)→ web 5274、WS 連 8788(B 區 NFC server)。
// strictPort: true → 埠口被占就直接報錯,絕不自動漂移撞別區。
export default defineConfig({
  // GitHub Pages 的專案站台掛在 /B-TV/ 子路徑下,但現場 kiosk 是 npm run build +
  // npm run preview 後開「根路徑」http://localhost:5274/(見 啟動-機位設定工具.bat)。
  // 所以 base 預設必須留 '/' —— 寫死成 '/B-TV/' 會讓展場畫面直接 404。
  // 只有 .github/workflows/pages.yml 會設 PAGES_BASE=/B-TV/。
  base: process.env.PAGES_BASE || '/',
  plugins: [react()],
  // 多頁:主 kiosk(index.html)+ 機位編輯工具(camera-tool.html)
  build: {
    rollupOptions: {
      input: { main: 'index.html', tool: 'camera-tool.html' },
    },
  },
  server: {
    host: true,
    port: 5274,
    strictPort: true,
  },
  preview: {
    host: true,
    port: 5274,
    strictPort: true,
  },
})
