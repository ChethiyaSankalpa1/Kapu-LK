const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a name'],
    trim: true,
  },
  username: {
    type: String,
    unique: true,
    sparse: true,
    trim: true,
    minlength: 3,
  },
  profileName: {
    type: String,
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Please add an email'],
    unique: true,
    lowercase: true,
    trim: true,
    validate: {
      validator: function(v) {
        if (!v) return false;
        // If email is verified, it MUST strictly be a valid email format
        if (this && this.emailVerified) {
          return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(v);
        }
        // If unverified, allow existing legacy email formats (e.g. chethiya//56//)
        return typeof v === 'string' && v.trim().length > 0;
      },
      message: 'Please add a valid email',
    },
  },
  pendingEmail: {
    type: String,
    lowercase: true,
    trim: true,
    sparse: true,
    validate: {
      validator: function(v) {
        if (!v) return true;
        return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(v);
      },
      message: 'Please add a valid pending email',
    },
  },
  emailVerifiedAt: {
    type: Date,
    default: null,
  },
  password: {
    type: String,
    required: [true, 'Please add a password'],
    minlength: 6,
    select: false,
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user',
  },
  profileImageUrl: {
    type: String,
    default: '',
  },
  phoneNumber: {
    type: String,
    default: null,
    validate: {
      validator: (value) => !value || /^[0-9]+$/.test(value),
      message: 'Phone number must contain only numbers',
    },
  },
  age: {
    type: Number,
    min: 18,
    max: 100,
  },
  birthDate: {
    type: Date,
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other'],
  },
  bio: {
    type: String,
    maxlength: 500,
  },
  interests: {
    type: String,
    default: '',
  },
  hobbies: {
    type: String,
    default: '',
  },
  location: {
    type: String,
  },
  education: {
    type: String,
  },
  occupation: {
    type: String,
  },
  workplace: {
    type: String,
  },
  religion: {
    type: String,
  },
  maritalStatus: {
    type: String,
    enum: ['single', 'divorced', 'widowed'],
  },
  height: {
    type: String,
  },
  weight: {
    type: String,
  },
  figure: {
    type: String,
  },
  bodyType: {
    type: String,
  },
  appearance: {
    type: String,
  },
  complexion: {
    type: String,
  },
  status: {
    type: String,
  },
  ethnicity: {
    type: String,
  },
  caste: {
    type: String,
  },
  socialClass: {
    type: String,
  },
  residency: {
    type: String,
  },
  district: {
    type: String,
  },
  family: {
    type: String,
  },
  smoking: {
    type: String,
  },
  drinking: {
    type: String,
  },
  children: {
    type: String,
  },
  personality: {
    type: String,
  },
  firstDatePreference: {
    type: String,
  },
  livingArrangements: {
    type: String,
  },
  partnerPreferences: {
    minAge: { type: Number },
    maxAge: { type: Number },
    religion: { type: String },
    caste: { type: String },
    district: { type: String },
    maritalStatus: { type: String },
    smoking: { type: String },
    drinking: { type: String },
    education: { type: String },
    bodyType: { type: String },
  },
  isApproved: {
    type: Boolean,
    default: false,
  },
  isVerified: {
    type: Boolean,
    default: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  isPremium: {
    type: Boolean,
    default: false,
  },
  premiumPlan: {
    type: String,
    enum: ['bronze', 'silver', 'gold', null],
    default: null,
  },
  premiumSince: {
    type: Date,
  },
  premiumExpiresAt: {
    type: Date,
  },
  premiumExpirySentNotification: {
    type: Boolean,
    default: false,
  },
  messagesSent: {
    type: Number,
    default: 0,
  },
  giftingOptIn: {
    type: Boolean,
    default: true,
  },
  premiumRequested: {
    type: Boolean,
    default: false,
  },
  pendingPremiumRequest: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PremiumPaymentRequest',
  },
  complaints: {
    type: Number,
    default: 0,
  },
  agreedToTerms: {
    type: Boolean,
    default: false,
  },
  lastLogin: {
    type: Date,
  },
  isOnline: {
    type: Boolean,
    default: false,
  },
  language: {
    type: String,
    enum: ['en', 'si', 'ta'],
    default: 'en',
  },
  passwordResetToken: {
    type: String,
    select: false,
  },
  passwordResetExpires: {
    type: Date,
    select: false,
  },
  passwordResetCode: {
    type: String,
    select: false,
  },
  passwordResetCodeExpires: {
    type: Date,
    select: false,
  },
  passwordResetCodeAttempts: {
    type: Number,
    default: 0,
    select: false,
  },
  lastMessageSentAt: {
    type: Date,
  },
  // Security & Account Protection
  loginAttempts: {
    type: Number,
    default: 0,
  },
  lockUntil: {
    type: Date,
  },
  passwordChangedAt: {
    type: Date,
  },
  tokenVersion: {
    type: Number,
    default: 0,
  },
  welcomeEmailSentAt: {
    type: Date,
    default: null,
  },
  twoFactorEnabled: {
    type: Boolean,
    default: false,
  },
  twoFactorSecret: {
    type: String,
    select: false,
  },
  twoFactorRecoveryCodes: [{
    type: String,
    select: false,
  }],
  blockedUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  emailVerified: {
    type: Boolean,
    default: false,
    index: true,
  },
  isEmailVerified: {
    type: Boolean,
    default: false,
  },
  emailVerificationCode: {
    type: String,
    select: false,
  },
  emailVerificationToken: {
    type: String,
    select: false,
  },
  emailVerificationExpires: {
    type: Date,
    select: false,
  },
  emailVerificationAttempts: {
    type: Number,
    default: 0,
    select: false,
  },
  emailVerificationCooldown: {
    type: Date,
    select: false,
  },
  // Inactivity & Account Lifecycle
  lastActiveAt: {
    type: Date,
    default: Date.now,
    index: true,
  },
  inactivityReminderSentAt: {
    type: Date,
    default: null,
  },
  accountStatus: {
    type: String,
    enum: ['active', 'deactivated', 'suspended'],
    default: 'active',
    index: true,
  },
  deactivatedAt: {
    type: Date,
    default: null,
  },
  deactivationReason: {
    type: String,
    default: null,
  },
  inactivityWarningsSent: {
    d5: { type: Boolean, default: false },
    d2: { type: Boolean, default: false },
    d1: { type: Boolean, default: false },
  },
  // Privacy Policy Acknowledgment
  acknowledgedPrivacyPolicyAt: {
    type: Date,
  },
  acknowledgedPrivacyPolicyVersion: {
    type: String,
    default: '2.0',
  },
}, {
  timestamps: true,
});

// Indexes for common list/search queries (improves scalability)
userSchema.index({ role: 1, isApproved: 1, isActive: 1 });
userSchema.index({ gender: 1, age: 1 });
userSchema.index({ district: 1 });
userSchema.index({ location: 1 });
userSchema.index({ religion: 1 });
userSchema.index({ maritalStatus: 1 });
userSchema.index({ isApproved: 1, isActive: 1, createdAt: -1 });
userSchema.index({ isPremium: 1 });
userSchema.index({ createdAt: -1 });
userSchema.index({ lastLogin: -1 });
userSchema.index({ pendingEmail: 1 }, { sparse: true });

// Check if account is currently locked
userSchema.methods.isAccountLocked = function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
};

// Increment login attempts & lock if >= 5 attempts
userSchema.methods.incLoginAttempts = async function() {
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return await this.updateOne({
      $set: { loginAttempts: 1 },
      $unset: { lockUntil: 1 },
    });
  }
  const updates = { $inc: { loginAttempts: 1 } };
  if ((this.loginAttempts || 0) + 1 >= 5 && (!this.lockUntil || this.lockUntil <= Date.now())) {
    updates.$set = { lockUntil: new Date(Date.now() + 20 * 60 * 1000) }; // 20 minutes lockout
  }
  return await this.updateOne(updates);
};

// Reset login attempts after successful authentication
userSchema.methods.resetLoginAttempts = async function() {
  return await this.updateOne({
    $set: { loginAttempts: 0 },
    $unset: { lockUntil: 1 },
  });
};

// Sync emailVerified and isEmailVerified flags
userSchema.pre('save', function(next) {
  if (this.isModified('emailVerified')) {
    this.isEmailVerified = !!this.emailVerified;
  } else if (this.isModified('isEmailVerified')) {
    this.emailVerified = !!this.isEmailVerified;
  }
  next();
});

// Hash password before saving
userSchema.pre('save', async function() {
  if (!this.isModified('password')) {
    return;
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  if (!this.isNew) {
    this.passwordChangedAt = new Date(Date.now() - 1000); // 1 sec in past ensures token issued after
  }
});

// Match password
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
