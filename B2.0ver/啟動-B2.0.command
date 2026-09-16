#!/bin/zsh -l
cd "${0:A:h}" || exit 1
if ! command -v npm >/dev/null 2>&1; then
  print '找不到 npm，請先安裝 Node.js。'
  read '?按 Enter 關閉'
  exit 1
fi
if [[ ! -d node_modules ]]; then
  npm ci || exit 1
fi
print '感應光寓 2.0 · http://127.0.0.1:5284/'
npm run dev -- --open
