@echo off
chcp 65001 > nul
cd /d %~dp0

echo ==========================================
echo   AI 栄養＆レシピ提案アプリを起動しています...
echo ==========================================

:: 1. ブラウザを先に開くコマンド（3秒待ってから開く設定）
::    サーバーが立ち上がる時間を考慮して timeout を入れています
start /min cmd /c "timeout /t 3 >nul && start http://127.0.0.1:5000"

:: 2. Flaskサーバーを起動
python app.py

pause