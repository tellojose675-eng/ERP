@echo off
:: ============================================================================
:: start_dev.bat - Script de arranque local para ERP EnterpriseCloud
:: Inicia Backend (FastAPI) y Frontend (Vite) en modo de desarrollo
:: ============================================================================

SETLOCAL ENABLEDELAYEDEXPANSION
SET BASE=%~dp0
TITLE ERP EnterpriseCloud - Servidor de Desarrollo

ECHO.
ECHO ============================================================
ECHO   ERP EnterpriseCloud - Iniciando en modo DESARROLLO
ECHO   Backend  → http://localhost:8000
ECHO   Frontend → http://localhost:3000
ECHO   API Docs → http://localhost:8000/docs
ECHO ============================================================
ECHO.

:: ---- Backend FastAPI ----
ECHO [1/2] Iniciando Backend FastAPI (puerto 8000)...
START "ERP - Backend FastAPI" cmd /k "cd /d %BASE%03_BACKEND && venv\Scripts\activate && uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"

:: Esperar 3 segundos a que el backend arranque
timeout /t 3 /nobreak > nul

:: ---- Frontend Vite React ----
ECHO [2/2] Iniciando Frontend React (puerto 3000)...
START "ERP - Frontend React" cmd /k "cd /d %BASE%02_FRONTEND && npm.cmd run dev"

:: Esperar y abrir el navegador
timeout /t 4 /nobreak > nul
ECHO.
ECHO Abriendo ERP en el navegador...
start http://localhost:3000

ECHO.
ECHO ✔ ERP EnterpriseCloud ONLINE
ECHO   Cerrar las ventanas de terminal para detener los servidores.
ECHO.
ENDLOCAL
