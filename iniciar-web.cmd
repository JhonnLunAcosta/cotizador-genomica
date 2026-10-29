@echo off
setlocal
cd /d "%~dp0web"
if not exist node_modules (
    echo Instalando dependencias del frontend...
    call npm install
)
echo Iniciando frontend en http://localhost:5173
call npm run dev
endlocal
