# 獨立重寫紀錄

2026-09-08：依使用者澄清，停止使用「複製初代後修改」的版本；首次嘗試封存至 archive/first-attempt。

新入口 app/main.jsx 只引用 app/ 下的新程式及 React。畫面配置以七張參照與本機初代規格為依據。app/exhibition.json 只保存展示文案、數字、色碼與版面比例；public/ 只提供影片、照片、字體和品牌圖像。

- 原來分散於元件內的流程定時器，改為單一純函式時間軸控制器。
- 不使用初代 framer-motion／three 元件；新動畫以 CSS keyframes 與 requestAnimationFrame 實作。
- 主畫面為 welcome、overview、choose、experience、narration、farewell 六類；情境內以 dimension 與 loop 表示播放位置。
- NFC 與鍵盤先轉換成獨立的語意事件，再交給播放控制器。
- 13 項測試覆蓋流程、渲染、匯入界線；不將伺服端渲染檢查宣稱為瀏覽器視覺驗收。

舊版輔助編輯工具沒有搬入新介面。正式配音、真實感測器、桌面投影及需要登入的 Claude 規劃仍待補齊核對。
