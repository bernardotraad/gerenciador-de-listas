// Generate a secure random string for NEXTAUTH_SECRET
const crypto = require("crypto")

function generateSecret() {
  return crypto.randomBytes(32).toString("base64")
}

console.log("Generated NEXTAUTH_SECRET:")
console.log(generateSecret())
console.log("\nCopy this value and use it as your NEXTAUTH_SECRET environment variable.")
