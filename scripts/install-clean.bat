@echo off
REM Script para instalação limpa das dependências no Windows
REM Resolve problemas de cache e dependências conflitantes

echo 🧹 Limpando cache e arquivos de dependências...

REM Remover node_modules e arquivos de lock
if exist node_modules rmdir /s /q node_modules
if exist package-lock.json del package-lock.json
if exist pnpm-lock.yaml del pnpm-lock.yaml
if exist yarn.lock del yarn.lock

REM Limpar cache do npm
npm cache clean --force

REM Limpar cache do pnpm (se estiver usando)
where pnpm >nul 2>&1
if %errorlevel% equ 0 (
    pnpm store prune
)

REM Limpar cache do yarn (se estiver usando)
where yarn >nul 2>&1
if %errorlevel% equ 0 (
    yarn cache clean
)

echo 📦 Instalando dependências...

REM Tentar instalar com npm primeiro
npm install
if %errorlevel% equ 0 (
    echo ✅ Instalação com npm concluída com sucesso!
    goto :success
)

REM Tentar com pnpm
where pnpm >nul 2>&1
if %errorlevel% equ 0 (
    pnpm install
    if %errorlevel% equ 0 (
        echo ✅ Instalação com pnpm concluída com sucesso!
        goto :success
    )
)

REM Tentar com yarn
where yarn >nul 2>&1
if %errorlevel% equ 0 (
    yarn install
    if %errorlevel% equ 0 (
        echo ✅ Instalação com yarn concluída com sucesso!
        goto :success
    )
)

echo ❌ Falha na instalação. Tente manualmente:
echo    npm install
echo    ou
echo    pnpm install
echo    ou
echo    yarn install
pause
exit /b 1

:success
echo 🎉 Instalação concluída! Execute 'npm run dev' para iniciar o projeto.
pause 