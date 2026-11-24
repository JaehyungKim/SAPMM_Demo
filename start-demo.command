#!/bin/bash
# 더블클릭으로 J45 데모 실행 (터미널 창을 닫으면 데모 서버도 종료됩니다)
cd "$(dirname "$0")"
[ -d node_modules ] || npm install
npx vite --port 5173 --open
