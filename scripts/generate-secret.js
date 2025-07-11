// Script para gerar NEXTAUTH_SECRET
const crypto = require("crypto")

function generateSecret() {
  const secret = crypto.randomBytes(32).toString("base64")
  console.log("🔑 NEXTAUTH_SECRET gerado:")
  console.log(secret)
  console.log("\n📋 Copie este valor para suas variáveis de ambiente")
  return secret
}

generateSecret()
