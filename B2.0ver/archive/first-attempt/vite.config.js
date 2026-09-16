import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// ── B 區 TV display 固定埠口(展覽同網域,務必避開 F 區與 B 桌面投影)──────────────
// F 區占用:web 5173 / 5174 / 5175、ws 8787。
// B 桌面投影 (B-Table) 占用:web 5273。
// B 區 TV display(本 repo)→ web 5284、WS 連 8788(B 區 NFC server)。
// strictPort: true → 埠口被占就直接報錯,絕不自動漂移撞別區。
export default defineConfig({
  plugins: [react()],
  // 多頁:主 kiosk(index.html)+ 機位編輯工具(camera-tool.html)
  build: {
    rollupOptions: {
      input: { main: 'index.html', tool: 'camera-tool.html' },
    },
  },
  server: {
    host: '127.0.0.1',
    port: 5284,
    strictPort: true,
  },
  preview: {
    host: '127.0.0.1',
    port: 5284,
    strictPort: true,
  },
})
