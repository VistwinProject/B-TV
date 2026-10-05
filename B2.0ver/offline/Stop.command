#!/bin/zsh
cd "${0:A:h}" || exit 1
./runtime/node launcher.cjs stop
result=$?
if (( result != 0 )); then read '?按 Enter 關閉'; fi
exit $result
