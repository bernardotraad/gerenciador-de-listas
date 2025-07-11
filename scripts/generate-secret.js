const crypto = require("crypto")

// Generate a random 32-byte secret and encode it as base64
const secret = crypto.randomBytes(32).toString("base64")

console.log("Generated NEXTAUTH_SECRET:")
console.log(secret)
console.log("\nAdd this to your .env file:")
console.log(`NEXTAUTH_SECRET=${secret}`)
