const crypto = require("crypto")

// Generate a secure random secret
const secret = crypto.randomBytes(32).toString("base64")

console.log("Generated NEXTAUTH_SECRET:")
console.log(secret)
console.log("\nCopy this value to your .env file and Netlify environment variables")
