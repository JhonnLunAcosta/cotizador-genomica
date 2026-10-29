@echo off
setlocal
cd /d "%~dp0"

rem Carga variables locales (clave del asistente, credenciales de base de datos).
if exist "%~dp0.env.local" (
    for /f "usebackq tokens=1,* delims==" %%a in ("%~dp0.env.local") do (
        if not "%%a"=="" if not "%%b"=="" set "%%a=%%b"
    )
)

cd /d "%~dp0api"
echo Iniciando API del cotizador en http://localhost:8080
if not defined FREELMAPI_KEY echo Aviso: FREELMAPI_KEY no esta definida; el asistente de IA quedara desactivado.
call mvn spring-boot:run
endlocal
