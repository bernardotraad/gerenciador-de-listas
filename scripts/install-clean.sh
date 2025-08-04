#!/bin/bash

# Script para instalação limpa das dependências
# Resolve problemas de cache e dependências conflitantes

echo "🧹 Limpando cache e arquivos de dependências..."

# Remover node_modules e arquivos de lock
rm -rf node_modules
rm -f package-lock.json
rm -f pnpm-lock.yaml
rm -f yarn.lock

# Limpar cache do npm
npm cache clean --force

# Limpar cache do pnpm (se estiver usando)
if command -v pnpm &> /dev/null; then
    pnpm store prune
fi

# Limpar cache do yarn (se estiver usando)
if command -v yarn &> /dev/null; then
    yarn cache clean
fi

echo "📦 Instalando dependências..."

# Tentar instalar com npm primeiro
if npm install; then
    echo "✅ Instalação com npm concluída com sucesso!"
elif command -v pnpm &> /dev/null && pnpm install; then
    echo "✅ Instalação com pnpm concluída com sucesso!"
elif command -v yarn &> /dev/null && yarn install; then
    echo "✅ Instalação com yarn concluída com sucesso!"
else
    echo "❌ Falha na instalação. Tente manualmente:"
    echo "   npm install"
    echo "   ou"
    echo "   pnpm install"
    echo "   ou"
    echo "   yarn install"
    exit 1
fi

echo "🎉 Instalação concluída! Execute 'npm run dev' para iniciar o projeto." 