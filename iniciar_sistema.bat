@echo off
title FlowPDF - Iniciando Sistema
echo ==========================================
echo       FlowPDF - Instalação e Início
echo ==========================================
echo.
echo Verificando dependências...
if not exist node_modules (
    echo Instalando bibliotecas (isso pode levar um minuto)...
    call npm install
)

echo.
echo Iniciando o servidor de desenvolvimento...
echo Assim que o sistema carregar, abra http://localhost:3000 no seu navegador.
echo.
start http://localhost:3000
call npm run dev
pause
