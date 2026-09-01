#!/bin/bash
cd "$(dirname "$0")"
PORT=8899
if ! curl -s -o /dev/null --max-time 2 "http://127.0.0.1:$PORT/"; then
  python3 -m http.server $PORT >/dev/null 2>&1 &
  sleep 1
fi
open "http://localhost:$PORT/"
echo "小飞机识字已启动：http://localhost:$PORT/"
echo "这个窗口关掉，网页就打不开了。要一直用就别关。"
