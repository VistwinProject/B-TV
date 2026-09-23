# B2 NFC 配對與測試

ACR122U（位於 table 投影桌面下）→ 本機 WebSocket `ws://127.0.0.1:8788` → table `http://127.0.0.1:5273/` + tv `http://127.0.0.1:5284/`。TV 現在預設連線，不需要 hardware=1。

此服務只讀 UID，配對寫入本資料夾 `uid-map.json`，不寫入實體卡片。與 F 區的卡片設定分開。

安裝：在此資料夾執行 `npm install`；啟動：`npm start`。
本機測試也可使用已安裝的依賴：在專案根目錄執行 `NFC_MODULE_ROOT=/Users/chunming/F/F-table/server node server/index.cjs`。

終端指令：`pair anti-aging`（居家抗老）、`pair child`（兒童免疫）、`pair elder`（在宅樂齡）、`pair pregnancy`（孕婦照護）、`pair nomad`（數位遊牧）。
每次先移除卡片，再輸入配對指令，最後放上該張卡片。成功顯示 `[PAIRED]`。已有其他情境的卡片不會被覆寫。
`status` 顯示讀卡機、待配對情境與已存對照；`cancel` 取消等待配對。
配對完成後，每次感應已配對卡片即廣播對應情境；移除卡片廣播 `tag-remove`。

啟動時也讀取 `../B-Table/server/uid-map.json`，接受 table 既有邀請卡與五種角色卡；若 UID 重複，以本資料夾既有配對為準，不覆寫原本的 table 配對檔。兩種來源的實體卡與 table 鍵盤模擬使用同一廣播路徑。

`NFC_SIM_ONLY=1 node server/index.cjs` 可在無 PC/SC 的環境只開同步服務（仍需 ws 套件）。一般啟動會正常偵測實體 reader；未接 reader 時，table 顯示「等待讀卡機」，但鍵盤模擬仍會同步。連線中的顯示端重新整理後可恢復目前卡片。

邀請卡配對：先拿起讀卡機上的卡，再輸入 `pair invite`，最後放上欲登錄的邀請卡。允許新增多張邀請卡並保留既有對照；已配對成角色的卡不會被覆寫。邀請卡事件使用 `kind: card`。
