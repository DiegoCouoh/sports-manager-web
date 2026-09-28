@echo off
cd /d "%~dp0"
title Sports Manager

echo Abriendo Sports Manager en el navegador...
echo.
echo No necesitas Node.js ni Electron.
echo Los datos se guardan automaticamente en el navegador.
echo.

start "" "index.html"

timeout /t 2 >nul
exit
