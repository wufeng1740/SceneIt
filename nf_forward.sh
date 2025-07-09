#!/bin/bash

# forward the Northflank DB addon, so that we can connect to it locally
# 设置你的项目 ID 和数据库插件 ID
PROJECT_ID="sceneit"
ADDON_ID="sceneitdb"

echo "🚀 启动自动 Northflank 转发守护脚本"
echo "📌 项目: $PROJECT_ID | 插件: $ADDON_ID"
echo "🕓 时间: $(date)"
echo "-----------------------------------"

while true; do
  echo "⏳ 正在尝试启动转发... ($(date))"
  
  # 执行转发
  northflank forward addon --projectId "$PROJECT_ID" --addonId "$ADDON_ID"
  
  # 如果命令失败或意外中断，输出提示并重新尝试
  echo "⚠️ 转发已断开或出错，将在 5 秒后重试..."
  sleep 5
done