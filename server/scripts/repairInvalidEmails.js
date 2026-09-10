const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

/**
 * Migration script to repair invalid email addresses
 * 
 * This script identifies users with invalid email formats and provides
 * safe repair mechanisms for specific cases like the user's account.
 */

// Improved email validation regex
const isValidEmail = (email) => {
  return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email);
};

// Check if email looks like it might be invalid (loose check for reporting)
const looksInvalid = (email) => {
  if (!email || typeof email !== 'string') return true;
  const normalized = email.toLowerCase().trim();
  
  // Check for obvious invalid patterns
  const invalidPatterns = [
    /\/\/+/g,          // Double slashes
    /\\\\+/g,          // Double backslashes
    /^[^@]+$/,         // Missing @
    /@[^@]+$/,         // Only one @
    /\s+/g,            // Contains spaces
    /^[^a-zA-Z0-9]/,   // Starts with special char
  ];
  
  return invalidPatterns.some(pattern => pattern.test(normalized)) || !isValidEmail(normalized);
};

async function generateReport() {
  console.log('🔍 Scanning database for invalid email addresses...\n');
  
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/kapu-lk');
    console.log('✅ Connected to database\n');
    
    const allUsers = await User.find({});
    const invalidEmailUsers = [];
    const duplicateEmails = {};
    
    // Check for invalid emails and duplicates
    for (const user of allUsers) {
      const normalizedEmail = user.email ? user.email.toLowerCase().trim() : '';
      
      if (looksInvalid(normalizedEmail)) {
        invalidEmailUsers.push({
          id: user._id,
          name: user.name,
          email: user.email,
          emailVerified: user.emailVerified,
          role: user.role,
          createdAt: user.createdAt,
        });
      }
      
      // Check for duplicates
      if (normalizedEmail) {
        if (!duplicateEmails[normalizedEmail]) {
          duplicateEmails[normalizedEmail] = [];
        }
        duplicateEmails[normalizedEmail].push(user._id);
      }
    }
    
    // Find actual duplicates
    const actualDuplicates = Object.entries(duplicateEmails)
      .filter(([email, userIds]) => userIds.length > 1)
      .map(([email, userIds]) => ({ email, count: userIds.length, userIds }));
    
    // Generate report
    console.log('📊 EMAIL VALIDATION REPORT\n');
    console.log('='.repeat(50));
    console.log(`Total users scanned: ${allUsers.length}`);
    console.log(`Users with invalid emails: ${invalidEmailUsers.length}`);
    console.log(`Duplicate email addresses found: ${actualDuplicates.length}`);
    console.log('='.repeat(50));
    
    if (invalidEmailUsers.length > 0) {
      console.log('\n🚨 INVALID EMAIL ADDRESSES:\n');
      invalidEmailUsers.forEach((user, index) => {
        console.log(`${index + 1}. ${user.name} (${user.id})`);
        console.log(`   Email: "${user.email}"`);
        console.log(`   Verified: ${user.emailVerified}`);
        console.log(`   Role: ${user.role}`);
        console.log(`   Created: ${user.createdAt}`);
        console.log('');
      });
    }
    
    if (actualDuplicates.length > 0) {
      console.log('\n⚠️  DUPLICATE EMAIL ADDRESSES:\n');
      actualDuplicates.forEach((dup, index) => {
        console.log(`${index + 1}. "${dup.email}" - ${dup.count} users`);
        console.log(`   User IDs: ${dup.userIds.join(', ')}`);
        console.log('');
      });
    }
    
    if (invalidEmailUsers.length === 0 && actualDuplicates.length === 0) {
      console.log('\n✅ No issues found! All email addresses appear valid.');
    }
    
    return { invalidEmailUsers, actualDuplicates, totalUsers: allUsers.length };
    
  } catch (error) {
    console.error('❌ Error generating report:', error.message);
    throw error;
  } finally {
    await mongoose.disconnect();
  }
}

async function repairSpecificAccount(invalidEmail, correctEmail) {
  console.log(`🔧 Attempting to repair account: "${invalidEmail}" → "${correctEmail}"\n`);
  
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/kapu-lk');
    console.log('✅ Connected to database\n');
    
    // Validate emails
    if (!isValidEmail(correctEmail)) {
      throw new Error(`Target email "${correctEmail}" is not a valid email format`);
    }
    
    // Find user with invalid email
    const user = await User.findOne({ email: invalidEmail });
    if (!user) {
      throw new Error(`No user found with email "${invalidEmail}"`);
    }
    
    console.log(`👤 Found user: ${user.name} (${user._id})`);
    console.log(`   Current email: "${user.email}"`);
    console.log(`   Email verified: ${user.emailVerified}`);
    console.log(`   Role: ${user.role}\n`);
    
    // Check if target email is already used
    const existingUser = await User.findOne({ 
      email: correctEmail,
      _id: { $ne: user._id }
    });
    
    if (existingUser) {
      throw new Error(`Target email "${correctEmail}" is already registered to another user (${existingUser.name})`);
    }
    
    // Confirm repair (in production, this should be interactive)
    console.log('⚠️  SAFETY CHECKS PASSED:');
    console.log('   ✅ Source user exists');
    console.log('   ✅ Target email is valid');
    console.log('   ✅ Target email is not already in use');
    console.log('   ✅ No account conflicts detected\n');
    
    // Perform the repair
    const previousEmail = user.email;
    user.email = correctEmail;
    user.emailVerified = true; // Set to true since user confirmed verification
    user.emailVerifiedAt = new Date();
    user.pendingEmail = undefined;
    
    await user.save();
    
    console.log('✅ REPAIR COMPLETED SUCCESSFULLY:\n');
    console.log(`   Previous email: "${previousEmail}"`);
    console.log(`   New email: "${user.email}"`);
    console.log(`   Email verified: ${user.emailVerified}`);
    console.log(`   Verified at: ${user.emailVerifiedAt}\n`);
    
    console.log('📝 User can now:');
    console.log('   • Login with the corrected email');
    console.log('   • Use forgot-password with the corrected email');
    console.log('   • Receive emails at the corrected address\n');
    
    return { success: true, user };
    
  } catch (error) {
    console.error('❌ Repair failed:', error.message);
    throw error;
  } finally {
    await mongoose.disconnect();
  }
}

// Command line interface
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  try {
    if (command === 'report') {
      await generateReport();
    } else if (command === 'repair') {
      const invalidEmail = args[1];
      const correctEmail = args[2];
      
      if (!invalidEmail || !correctEmail) {
        console.error('Usage: node repairInvalidEmails.js repair <invalid-email> <correct-email>');
        console.error('Example: node repairInvalidEmails.js repair "chethiya//56//" "chethiyasankalpa456@gmail.com"');
        process.exit(1);
      }
      
      await repairSpecificAccount(invalidEmail, correctEmail);
    } else {
      console.log('Email Repair Migration Script\n');
      console.log('Usage:');
      console.log('  node repairInvalidEmails.js report              - Generate validation report');
      console.log('  node repairInvalidEmails.js repair <old> <new>   - Repair specific account\n');
      console.log('Examples:');
      console.log('  node repairInvalidEmails.js report');
      console.log('  node repairInvalidEmails.js repair "chethiya//56//" "chethiyasankalpa456@gmail.com"');
    }
  } catch (error) {
    console.error('\n❌ Script failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { generateReport, repairSpecificAccount, isValidEmail, looksInvalid };