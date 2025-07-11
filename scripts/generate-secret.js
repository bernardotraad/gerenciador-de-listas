// Script para gerar NEXTAUTH_SECRET
const crypto = require("crypto")

function generateSecret() {
  const secret = crypto.randomBytes(32).toString("base64")
  console.log("🔑 NEXTAUTH_SECRET gerado:")
  console.log(secret)
  console.log("\n📋 Copie este valor e use como NEXTAUTH_SECRET no Netlify")
  return secret
}

generateSecret()
