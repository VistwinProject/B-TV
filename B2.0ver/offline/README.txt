B 區 TV + Table 離線展示包 — Apple 晶片 Mac mini

需求：Apple M 系列晶片、macOS 13.5 或以上、一台 PC/SC 相容 NFC reader
（目前程式以 ACR122U 使用情境設計）。全包內含 Node、NFC 模組、Chrome、
TV/Table 靜態畫面與語音素材，不需要網路、不需要 npm install。

【安裝】
1. 解壓整個資料夾到 Mac mini 本機，例如「文件/B-Zone」。不要直接在 ZIP 裡啟動。
2. 將唯一一台 B 區 NFC reader 插到 Mac mini USB。
3. 雙擊 Start.command。同時開啟 Table 與 TV，各為獨立 Chrome 視窗。
   兩個視窗共用本資料夾的專用瀏覽器設定，不會使用個人 Chrome 設定。
4. 將 Table 視窗移到投影機、TV 視窗移到電視；可各按 Control+Command+F 全螢幕。
5. 雙擊 Stop.command，關閉此包的兩個畫面與 NFC 服務。
   其他展區、個人 Chrome 視窗不會被關閉。

Start/Stop 是 macOS 可雙擊執行的快捷檔。請保留它們在本資料夾；需要放桌面時，
在 Finder 用「製作替身」放到桌面。不要只複製兩個檔案到其他位置。
不要同時啟動舊的 B 區開發版或 Python NFC server。

【讀卡實測，依序操作】
1. Start 後查看 logs/session.log：應看到 [WS] Ready、[READER] 讀卡機名稱，
   以及兩個畫面連線。啟動自檢可能短暫多出一次連線/斷線紀錄，屬正常。
2. 邀請卡：放上卡片，Table 顯示已連接智慧系統，TV 進資訊牆並播放語音。
3. 等 TV 語音與資訊牆流程完成，兩邊進角色選擇；Table 為淺藍背景、淺色文字、白色鑰匙圈。
4. 依序測五張角色卡：居家抗老、兒童免疫、在宅樂齡、孕婦照護、數位遊牧。
   每張卡應讓 Table 顯示角色內容、TV 切換對應情境。每次換卡先移開再放新卡。
5. 拿起角色卡：Table 回到鑰匙圈提示；TV 保留目前情境繼續播放。
6. 五種角色都感應過後，最後情境依既有播放流程進結語，Table 同步顯示結束提示。
7. 按 R 重設，再拔插 reader，確認 [READER] 重新出現並可重複讀卡。
8. Stop 後兩個畫面應關閉；再 Start 檢查可重新運作。

未接 reader 時 C / 1–5 / X / R 可測邀請卡、角色卡、移開與重設連動。
鍵盤模擬成功不等於實體 reader 已通過；必須看到 [READER] 與實際 [CARD] 紀錄。
若沒有 [READER]，檢查 USB 線、轉接器及 macOS 是否辨識 reader；特殊型號可能需要
該廠商 macOS 驅動。此包不會安裝來源不明的驅動。

【配對】
已帶入目前所有邀請卡與五種角色卡的 UID 對照。
若 logs/session.log 顯示 [CARD] ... unpaired：先拿起卡片，再雙擊 Pair.command，
輸入 invite / anti-aging / child / elder / pregnancy / nomad，然後放上要登錄的卡。
看到 [PAIRED] 即成功。既有角色不會被覆寫；更換已配對角色卡時，請先備份並編輯
server/uid-map.json，移除該角色的舊對應後再配對（B-Table/server/uid-map.json 也會載入）。
配對只記錄 UID，不會寫入卡片。配對資料永久保存在此包 server/uid-map.json。

【資料與故障排除】
Table http://127.0.0.1:5273/；TV http://127.0.0.1:5284/；唯一 bridge 127.0.0.1:8788。
logs/session.log：啟動、讀卡、連線紀錄。
browser-profile/：此包的畫面編輯設定；不含原電腦個人瀏覽器資料。
正式預設採用 B2.0-design.json；原瀏覽器另存的未匯出微調不會自動搬入。
不要在執行中搬動或刪除整個包；先 Stop。不要同時執行兩份包。
若提示埠口占用，先停止舊版 B 區服務，再 Start。本包不會強制殺掉不屬於自己的服務。
若系統阻擋首次開啟，先確認檔案來源為此交付包，再依 macOS 顯示的手動允許流程處理；
不要關閉整機安全防護。Start 出錯會保留終端訊息；可提供 logs/session.log 排查。
