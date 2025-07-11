const crypto = require("crypto")

// Generate a secure random secret for NEXTAUTH_SECRET
const secret = crypto.randomBytes(32).toString("base64")

console.log("🔑 NEXTAUTH_SECRET gerado:")
console.log(secret)
console.log("\n📋 Copie este valor e use como NEXTAUTH_SECRET nas variáveis de ambiente do Netlify")
