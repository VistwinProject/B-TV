#!/bin/zsh
cd "${0:A:h}" || exit 1
if [[ "$(uname -m)" != "arm64" ]]; then
  print '此包適用 Apple 晶片 Mac，不能在 Intel Mac 執行。'
  read '?按 Enter 關閉'; exit 1
fi
./runtime/node launcher.cjs start
result=$?
if (( result != 0 )); then read '?按 Enter 關閉'; fi
exit $result
