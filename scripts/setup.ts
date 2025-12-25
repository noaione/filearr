import { PrismaLibSql } from '@prisma/adapter-libsql'
import { PrismaClient } from '../generated/prisma'
import bcrypt from 'bcryptjs'
import { createInterface } from 'readline'

const adapter = new PrismaLibSql({
  url: process.env.DATABASE_URL ?? '',
});
const prisma = new PrismaClient({
  adapter,
  log: ['query', 'info', 'warn', 'error'],
})

const rl = createInterface({
  input: process.stdin,
  output: process.stdout
})

const question = (query) => new Promise((resolve) => rl.question(query, resolve))

async function setup() {
  console.log('\n🚀 filearr Setup\n')

  // Check if user already exists
  const existingUser = await prisma.user.findFirst()

  if (existingUser) {
    console.log('⚠️  Admin user already exists!')
    const overwrite = await question('Do you want to create a new admin user? (y/N): ')
    if (overwrite.toLowerCase() !== 'y') {
      console.log('Setup cancelled.')
      rl.close()
      process.exit(0)
    }
    // Delete existing users
    await prisma.user.deleteMany()
  }

  // Get username
  let username = await question('Enter admin username (default: admin): ')
  username = username.trim() || 'admin'

  // Get password
  let password = await question('Enter admin password: ')
  while (!password || password.length < 6) {
    console.log('❌ Password must be at least 6 characters long')
    password = await question('Enter admin password: ')
  }

  // Hash password and create user
  const hashedPassword = await bcrypt.hash(password, 10)
  
  await prisma.user.create({
    data: {
      username,
      password: hashedPassword,
    },
  })

  console.log('\n✅ Admin user created successfully!')
  console.log(`   Username: ${username}`)
  console.log('\n📁 Make sure to create a "files" directory or set FILES_DIRECTORY environment variable')
  console.log('🔐 For production, set a strong SESSION_SECRET environment variable')
  console.log('\nYou can now start the application with: bun run dev\n')

  rl.close()
}

setup()
  .catch((error) => {
    console.error('Error during setup:', error)
    rl.close()
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
