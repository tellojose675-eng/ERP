@echo off
:: ============================================================================
:: run_tests.bat - Ejecutar suite completa de pruebas automatizadas
:: ============================================================================
SETLOCAL
SET BASE=%~dp0
TITLE ERP EnterpriseCloud - Test Suite

ECHO.
ECHO ============================================================
ECHO  ERP EnterpriseCloud - Suite de Pruebas Automatizadas
ECHO  33 tests cubriendo RF-01 a RF-08
ECHO ============================================================
ECHO.

cd /d %BASE%03_BACKEND
.\venv\Scripts\python.exe -m pytest ..\06_TESTING\test_api.py -v --tb=short

ECHO.
ECHO ============================================================
ECHO  Tests completados. Presiona cualquier tecla para salir.
ECHO ============================================================
PAUSE
ENDLOCAL
