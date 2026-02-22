/**
 * Seed admin user. Run: npx ts-node --compiler-options '{"module":"CommonJS"}' src/scripts/seed-admin.ts
 * Or: npm run seed:admin
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from '../models';
import { hashPassword } from '../lib/auth-utils';

dotenv.config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error('MONGODB_URI required');
  process.exit(1);
}

const ADMIN_EMAIL = 'zeebuddy@zeebuddy.com';
const ADMIN_PASSWORD = '12345678';
const ADMIN_NAME = 'ZeeBuddy Admin';

async function seed() {
  await mongoose.connect(MONGODB_URI!);

  const existing = await User.findOne({ email: ADMIN_EMAIL });
  if (existing) {
    console.log('Admin already exists:', ADMIN_EMAIL);
    await mongoose.disconnect();
    return;
  }

  const passwordHash = await hashPassword(ADMIN_PASSWORD);
  await User.create({
    email: ADMIN_EMAIL,
    name: ADMIN_NAME,
    role: 'admin',
    passwordHash,
  });

  console.log('Admin user created:', ADMIN_EMAIL, '/', ADMIN_PASSWORD);
  await mongoose.disconnect();
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
