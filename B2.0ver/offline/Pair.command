#!/bin/zsh
cd "${0:A:h}" || exit 1
print '先雙擊 Start，並拿起讀卡機上的卡片。'
print '請輸入：invite / anti-aging / child / elder / pregnancy / nomad'
read 'role?要配對的卡片：'
./runtime/node launcher.cjs pair "$role"
print '現在放上卡片。看到 [PAIRED] 代表成功；Ctrl+C 關閉紀錄視窗。'
tail -n 15 -f logs/session.log
