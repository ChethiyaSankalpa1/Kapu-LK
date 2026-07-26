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
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please add a valid email',
    ],
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
    default: '',
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
  lastMessageSentAt: {
    type: Date,
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

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Match password
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
