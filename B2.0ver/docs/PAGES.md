# GitHub Pages

公開網址：https://vistwinproject.github.io/B-TV/

發布來源：VistwinProject/B-TV 的 main 分支，B2.0ver/ 目錄。
GitHub Actions 工作流程：.github/workflows/pages.yml。
先執行 npm ci、npm test，再以 npm run build -- --base=/B-TV/ 建置發布。
本機專案沒有 .git；推送用工作目錄為 /private/tmp/b-tv-publish-20260923。

## 雙分頁預覽

B-TV 與 B-Table 的 GitHub Pages 同源，HTTPS 預設以 BroadcastChannel 同步按鍵操作及 TV 播放完成的頁面訊號。同一瀏覽器設定檔開啟兩個頁面即可使用，無需讀卡機。C 邀請、1–5 角色、O 結尾、R 重置；若語音被自動播放政策攔截，先點 TV 的播放按鈕。localStorage 保留最近流程供刷新或稍後開啟分頁恢復；語音會重新開始。HTTP 本機維持 NFC WebSocket；?hardware=1 可明確選擇硬體模式。
