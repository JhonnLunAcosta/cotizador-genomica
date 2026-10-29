@echo off
echo Abriendo API y frontend del Cotizador Genomica...
start "API cotizador" cmd /k "%~dp0iniciar-api.cmd"
timeout /t 3 /nobreak >nul
start "Web cotizador" cmd /k "%~dp0iniciar-web.cmd"
echo Espera a que ambos terminen de arrancar y abre http://localhost:5173
