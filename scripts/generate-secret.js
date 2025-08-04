// Script para gerar NEXTAUTH_SECRET
const crypto = require("crypto")

function generateSecret() {
  const secret = crypto.randomBytes(32).toString("base64")
  console.log("🔑 NEXTAUTH_SECRET gerado:")
  console.log(secret)
  console.log("\n📋 Copie este valor e use como NEXTAUTH_SECRET:")
  console.log("   • Local: .env.local")
  console.log("   • Vercel: Environment Variables")
  console.log("   • Netlify: Environment Variables")
  console.log("\n💡 Exemplo de uso:")
  console.log(`   NEXTAUTH_SECRET=${secret}`)
  return secret
}

generateSecret()
