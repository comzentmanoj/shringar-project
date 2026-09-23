/**
 * Run this once to create your first admin login:
 *   npm run seed:admin
 *
 * It reads ADMIN_EMAIL and ADMIN_PASSWORD from your .env file.
 * Safe to run again later - it will just tell you the admin already exists.
 */
require('dotenv').config();
const bcrypt = require('bcryptjs');
const connectDB = require('../config/db');
const Admin = require('../models/Admin');
const mongoose = require('mongoose');

async function seed() {
  await connectDB();

  const email = (process.env.ADMIN_EMAIL || '').toLowerCase().trim();
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    console.error('❌ Set ADMIN_EMAIL and ADMIN_PASSWORD in your .env file first.');
    process.exit(1);
  }

  const existing = await Admin.findOne({ email });
  if (existing) {
    console.log(`ℹ️  Admin "${email}" already exists. Nothing to do.`);
    await mongoose.disconnect();
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await Admin.create({ email, passwordHash, name: 'Admin' });

  console.log(`✅ Admin account created: ${email}`);
  console.log('   You can now log in from the Angular admin login page.');
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});