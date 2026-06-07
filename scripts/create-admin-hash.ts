import bcrypt from 'bcryptjs'

const password = process.env.PLAIN_PASSWORD
if (!password) {
  console.error('Usage: PLAIN_PASSWORD=yourpassword npx tsx scripts/create-admin-hash.ts')
  process.exit(1)
}

;(async () => {
  const hash = await bcrypt.hash(password as string, 12)
  console.log(`ADMIN_PASSWORD_HASH=${hash}`)
  console.log('\nCopy the above line into your .env.local file.')
})()
