@echo off
rem Lance Menage PC : un petit serveur local + une fenetre d'application Edge.
rem La console se reduit dans la barre des taches ; la fermer arrete le programme.
if not "%~1"=="min" (
  start "Menage PC" /min "%~f0" min
  exit /b
)
title Menage PC
cd /d "%~dp0app"
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js est introuvable. Installe-le depuis https://nodejs.org puis relance.
  pause
  exit /b 1
)
set UV_THREADPOOL_SIZE=16
node server.js
if errorlevel 1 pause
