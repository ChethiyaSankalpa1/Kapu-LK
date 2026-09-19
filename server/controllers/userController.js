const mongoose = require('mongoose');
const User = require('../models/User');
const PrivacyConsent = require('../models/PrivacyConsent');
const Notification = require('../models/Notification');
const Message = require('../models/Message');
const { Wallet } = require('../models/Wallet');
const { UserStats } = require('../models/Achievement');
const cloudinary = require('../config/cloudinary');
const { purgeUserPermanently } = require('../services/inactivityCleanupService');
const { checkAndSendWelcomeEmail } = require('../services/welcomeEmailService');
const { logAuditEvent } = require('../middleware/auditLogger');
const { hasPremiumFeature } = require('../utils/entitlements');

const extractCloudinaryPublicId = (url) => {
  if (!url || typeof url !== 'string' || !url.includes('cloudinary.com')) return null;
  try {
    const parts = url.split('/');
    const uploadIndex = parts.indexOf('upload');
    if (uploadIndex === -1) return null;
    const pathAfterUpload = parts.slice(uploadIndex + 2).join('/');
    return pathAfterUpload.replace(/\.[^/.]+$/, '');
  } catch (err) {
    return null;
  }
};

const isValidPhoneNumber = (value) => !value || /^[0-9]+$/.test(value);

const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Keep list payload small for performance (browse/search pages)
const USER_LIST_SELECT = [
  'name',
  'age',
  'gender',
  'district',
  'location',
  'occupation',
  'education',
  'maritalStatus',
  'profileImageUrl',
  'isPremium',
  'premiumPlan',
  'isApproved',
  'isActive',
  'role',
  'createdAt',
].join(' ');

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
exports.updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (Object.prototype.hasOwnProperty.call(req.body, 'phoneNumber') && !isValidPhoneNumber(req.body.phoneNumber)) {
      return res.status(400).json({ message: 'Phone number must contain only numbers' });
    }

    const assignIfDefined = (field) => {
      if (Object.prototype.hasOwnProperty.call(req.body, field)) {
        user[field] = req.body[field];
      }
    };

    [
      'name',
      'profileName',
      'phoneNumber',
      'age',
      'gender',
      'bio',
      'interests',
      'hobbies',
      'location',
      'education',
      'occupation',
      'workplace',
      'religion',
      'maritalStatus',
      'height',
      'weight',
      'figure',
      'bodyType',
      'appearance',
      'complexion',
      'status',
      'ethnicity',
      'caste',
      'socialClass',
      'residency',
      'district',
      'family',
      'smoking',
      'drinking',
      'children',
      'personality',
      'firstDatePreference',
      'livingArrangements',
      'giftingOptIn',
      'showPhoneNumber',
      'showEmail',
    ].forEach(assignIfDefined);

    if (
      Object.prototype.hasOwnProperty.call(req.body, 'language') &&
      ['en', 'si', 'ta'].includes(req.body.language)
    ) {
      user.language = req.body.language;
    }

    if (req.body.partnerPreferences) {
      const p = req.body.partnerPreferences || {};
      user.partnerPreferences = {
        minAge: p.minAge ?? user.partnerPreferences?.minAge,
        maxAge: p.maxAge ?? user.partnerPreferences?.maxAge,
        religion: p.religion ?? user.partnerPreferences?.religion,
        caste: p.caste ?? user.partnerPreferences?.caste,
        district: p.district ?? user.partnerPreferences?.district,
        maritalStatus: p.maritalStatus ?? user.partnerPreferences?.maritalStatus,
        smoking: p.smoking ?? user.partnerPreferences?.smoking,
        drinking: p.drinking ?? user.partnerPreferences?.drinking,
        education: p.education ?? user.partnerPreferences?.education,
        bodyType: p.bodyType ?? user.partnerPreferences?.bodyType,
      };
    }

    const updatedUser = await user.save();

    // Check if profile is complete and send welcome email once
    checkAndSendWelcomeEmail(updatedUser._id).catch((err) =>
      console.warn('[WelcomeEmail] Error checking welcome email on updateProfile:', err.message)
    );

    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      username: updatedUser.username,
      profileName: updatedUser.profileName,
      email: updatedUser.email,
      role: updatedUser.role,
      isApproved: updatedUser.isApproved,
      isActive: updatedUser.isActive,
      isPremium: updatedUser.isPremium,
      language: updatedUser.language,
      phoneNumber: updatedUser.phoneNumber,
      showPhoneNumber: updatedUser.showPhoneNumber,
      showEmail: updatedUser.showEmail,
      age: updatedUser.age,
      gender: updatedUser.gender,
      bio: updatedUser.bio,
      interests: updatedUser.interests,
      hobbies: updatedUser.hobbies,
      location: updatedUser.location,
      education: updatedUser.education,
      occupation: updatedUser.occupation,
      religion: updatedUser.religion,
      maritalStatus: updatedUser.maritalStatus,
      height: updatedUser.height,
      weight: updatedUser.weight,
      figure: updatedUser.figure,
      bodyType: updatedUser.bodyType,
      appearance: updatedUser.appearance,
      complexion: updatedUser.complexion,
      status: updatedUser.status,
      ethnicity: updatedUser.ethnicity,
      caste: updatedUser.caste,
      socialClass: updatedUser.socialClass,
      residency: updatedUser.residency,
      district: updatedUser.district,
      family: updatedUser.family,
      smoking: updatedUser.smoking,
      drinking: updatedUser.drinking,
      children: updatedUser.children,
      personality: updatedUser.personality,
      firstDatePreference: updatedUser.firstDatePreference,
      livingArrangements: updatedUser.livingArrangements,
      workplace: updatedUser.workplace,
      partnerPreferences: updatedUser.partnerPreferences,
      profileImageUrl: updatedUser.profileImageUrl,
      giftingOptIn: updatedUser.giftingOptIn,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Helper to query users with tier-based discovery priority:
 * - Gold (Highest Priority Matching: 3)
 * - Silver (Priority Matching: 2)
 * - Bronze (Profile Boost: 1)
 * - Free / Expired (0)
 * Maintains natural discovery of Free users without hiding them.
 */
const getDiscoveryUsers = async (matchQuery, skip, limit, isAdmin = false) => {
  const now = new Date();
  
  if (isAdmin) {
    return await User.find(matchQuery)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
  }

  const pipeline = [
    { $match: matchQuery },
    {
      $addFields: {
        tierPriority: {
          $cond: {
            if: {
              $and: [
                { $eq: ['$isPremium', true] },
                { $gt: ['$premiumExpiresAt', now] },
              ],
            },
            then: {
              $switch: {
                branches: [
                  { case: { $eq: ['$premiumPlan', 'gold'] }, then: 3 },
                  { case: { $eq: ['$premiumPlan', 'silver'] }, then: 2 },
                  { case: { $eq: ['$premiumPlan', 'bronze'] }, then: 1 },
                ],
                default: 0,
              },
            },
            else: 0,
          },
        },
      },
    },
    { $sort: { tierPriority: -1, createdAt: -1 } },
    { $skip: skip },
    { $limit: limit },
    {
      $project: {
        name: 1,
        age: 1,
        gender: 1,
        district: 1,
        location: 1,
        occupation: 1,
        education: 1,
        maritalStatus: 1,
        profileImageUrl: 1,
        isPremium: 1,
        premiumPlan: 1,
        isApproved: 1,
        isActive: 1,
        role: 1,
        createdAt: 1,
      },
    },
  ];

  return await User.aggregate(pipeline);
};

// @desc    Get all users (approved only for regular users)
// @route   GET /api/users
// @access  Private
exports.getAllUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const skip = (page - 1) * limit;

    const query = req.user.role === 'admin'
      ? {}
      : {
          isApproved: true,
          isActive: true,
          _id: mongoose.trusted({ $ne: req.user._id }),
          role: mongoose.trusted({ $ne: 'admin' }),
        };

    const users = await getDiscoveryUsers(query, skip, limit, req.user.role === 'admin');
    const total = await User.countDocuments(query);

    res.json({
      data: users,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalCount: total,
      hasMore: skip + users.length < total
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Private
exports.getUserById = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }

    const user = await User.findById(req.params.id).select(
      '-password -twoFactorSecret -twoFactorRecoveryCodes -passwordResetToken -passwordResetExpires'
    );

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isSelfOrAdmin = user._id.equals(req.user._id) || req.user.role === 'admin';

    if (!isSelfOrAdmin) {
      try {
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const viewerName = req.user.name || 'A member';

        const existingWindow = await Notification.findOne({
          user: user._id,
          relatedUser: req.user._id,
          type: 'profile_view',
          lastViewedAt: { $gte: twentyFourHoursAgo },
        }).select('_id').lean();

        if (existingWindow) {
          await Notification.updateOne(
            { _id: existingWindow._id },
            {
              $inc: { viewCount: 1 },
              $set: { lastViewedAt: new Date() },
            }
          );
        } else {
          await Notification.create({
            user: user._id,
            relatedUser: req.user._id,
            type: 'profile_view',
            message: `${viewerName} viewed your profile`,
            isRead: false,
            viewCount: 1,
            lastViewedAt: new Date(),
          });
        }
      } catch (notifError) {
        console.error('Profile view notification error (non-fatal):', notifError);
      }
    }

    const userObj = user.toObject();

    // Ensure photo gallery array is present with legacy profileImageUrl fallback
    if (!userObj.photos || userObj.photos.length === 0) {
      if (userObj.profileImageUrl) {
        userObj.photos = [{
          url: userObj.profileImageUrl,
          publicId: '',
          isMain: true,
          order: 0,
        }];
      } else {
        userObj.photos = [];
      }
    } else {
      userObj.photos.sort((a, b) => {
        if (a.isMain && !b.isMain) return -1;
        if (!a.isMain && b.isMain) return 1;
        return (a.order || 0) - (b.order || 0);
      });
    }

    // Check if viewer has already expressed interest in this user
    try {
      const existingInterest = await Message.findOne({
        from: req.user._id,
        to: user._id,
        type: 'like',
      }).select('_id').lean();
      userObj.hasExpressedInterest = !!existingInterest;
    } catch (e) {
      userObj.hasExpressedInterest = false;
    }

    // Check if viewer has blocked target user
    userObj.isBlockedByMe = Array.isArray(req.user.blockedUsers) && req.user.blockedUsers.some(bId => bId.toString() === user._id.toString());

    // Privacy & Direct Contact Info entitlement handling
    const viewerHasDirectContact = isSelfOrAdmin || hasPremiumFeature(req.user, 'direct_contact_info');

    if (isSelfOrAdmin) {
      userObj.phoneVisibility = 'visible';
      userObj.emailVisibility = 'visible';
    } else {
      // Remove confidential security fields unconditionally for other users
      delete userObj.complaints;
      delete userObj.loginAttempts;
      delete userObj.lockUntil;
      delete userObj.blockedUsers;
      delete userObj.tokenVersion;

      // Enforce phone number visibility: owner must enable it AND viewer must have Direct Contact Info
      if (user.showPhoneNumber && viewerHasDirectContact) {
        userObj.phoneVisibility = 'visible';
      } else {
        delete userObj.phoneNumber;
        userObj.phoneVisibility = user.showPhoneNumber ? 'premium_required' : 'hidden_by_user';
      }

      // Enforce email visibility: owner must enable it AND viewer must have Direct Contact Info
      if (user.showEmail && viewerHasDirectContact) {
        userObj.emailVisibility = 'visible';
      } else {
        delete userObj.email;
        userObj.emailVisibility = user.showEmail ? 'premium_required' : 'hidden_by_user';
      }
    }

    res.json(userObj);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Search users
// @route   GET /api/users/search
// @access  Private
exports.searchUsers = async (req, res) => {
  try {
    const { gender, minAge, maxAge, location, religion, maritalStatus, interests, page = 1, limit = 20 } = req.query;
    
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    let query = {
      isApproved: true,
      isActive: true,
      role: mongoose.trusted({ $ne: 'admin' }),
    };

    if (gender) query.gender = gender;
    if (location) query.location = mongoose.trusted({ $regex: escapeRegex(location), $options: 'i' });
    if (religion) query.religion = mongoose.trusted({ $regex: escapeRegex(religion), $options: 'i' });
    if (maritalStatus) query.maritalStatus = maritalStatus;
    if (interests) query.interests = mongoose.trusted({ $regex: escapeRegex(interests), $options: 'i' });
    if (minAge || maxAge) {
      query.age = mongoose.trusted({});
      if (minAge) query.age.$gte = parseInt(minAge);
      if (maxAge) query.age.$lte = parseInt(maxAge);
    }

    const users = await getDiscoveryUsers(query, skip, limitNum, false);
    const total = await User.countDocuments(query);

    res.json({
      data: users,
      currentPage: pageNum,
      totalPages: Math.ceil(total / limitNum),
      totalCount: total,
      hasMore: skip + users.length < total
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get suggested matches with compatibility score
// @route   GET /api/users/matches
// @access  Private
exports.getMatches = async (req, res) => {
  try {
    const pageNum = parseInt(req.query.page, 10) || 1;
    const limitNum = parseInt(req.query.limit, 10) || 20;
    const skip = (pageNum - 1) * limitNum;

    const currentUser = await User.findById(req.user._id);

    if (!currentUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    const baseQuery = {
      _id: mongoose.trusted({ $ne: currentUser._id }),
      isApproved: true,
      isActive: true,
      role: mongoose.trusted({ $ne: 'admin' }),
    };

    if (currentUser.gender === 'male') {
      baseQuery.gender = 'female';
    } else if (currentUser.gender === 'female') {
      baseQuery.gender = 'male';
    }

    // Apply partner preferences (if provided) as soft filters - only use basic filters
    const prefs = currentUser.partnerPreferences || {};
    const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    
    // Only apply age range as a basic filter (optional)
    if (prefs.minAge || prefs.maxAge) {
      baseQuery.age = mongoose.trusted({});
      if (typeof prefs.minAge === 'number') baseQuery.age.$gte = prefs.minAge;
      if (typeof prefs.maxAge === 'number') baseQuery.age.$lte = prefs.maxAge;
    }
    
    // Don't apply strict filters for religion, caste, district, etc. - use them for scoring instead

    // IMPORTANT: in large databases, fetching ALL candidates will not scale.
    // Use a capped candidate pool to prevent memory/CPU spikes.
    const candidatePoolLimit = Math.max(100, parseInt(process.env.MATCH_CANDIDATE_POOL_LIMIT || '1500', 10));
    const candidates = await User.find(baseQuery)
      .select(`${USER_LIST_SELECT} religion interests`)
      .limit(candidatePoolLimit)
      .lean();

    const matches = candidates.map((user) => {
      let score = 0;

      if (user.religion && currentUser.religion && user.religion === currentUser.religion) {
        score += 30;
      }

      if (user.location && currentUser.location && user.location === currentUser.location) {
        score += 20;
      }

      if (typeof user.age === 'number' && typeof currentUser.age === 'number') {
        const diff = Math.abs(user.age - currentUser.age);
        if (diff <= 2) score += 20;
        else if (diff <= 5) score += 10;
      }

      if (user.interests && currentUser.interests) {
        const userInterests = user.interests.toLowerCase().split(',').map((s) => s.trim()).filter(Boolean);
        const myInterests = currentUser.interests.toLowerCase().split(',').map((s) => s.trim()).filter(Boolean);
        const common = userInterests.filter((i) => myInterests.includes(i));
        if (common.length > 0) {
          score += Math.min(30, common.length * 10);
        }
      }

      // Preference alignment bonus (helps ranking even if prefs are not strict)
      if (prefs.religion && user.religion && user.religion.toLowerCase() === prefs.religion.toLowerCase()) score += 10;
      if (prefs.district && user.district && user.district.toLowerCase() === prefs.district.toLowerCase()) score += 10;
      if (prefs.maritalStatus && user.maritalStatus === prefs.maritalStatus) score += 10;

      // Premium priority matching boost (Gold highest priority, Silver priority matching, Bronze boost)
      const isPlanActive = user.isPremium && user.premiumExpiresAt && new Date(user.premiumExpiresAt) > new Date();
      if (isPlanActive) {
        if (user.premiumPlan === 'gold') score += 15;
        else if (user.premiumPlan === 'silver') score += 10;
        else if (user.premiumPlan === 'bronze') score += 5;
      }

      score = Math.min(100, score);

      return {
        ...user,
        compatibilityScore: score,
      };
    });

    matches.sort((a, b) => b.compatibilityScore - a.compatibilityScore);
    
    const paginatedMatches = matches.slice(skip, skip + limitNum);

    res.json({
      data: paginatedMatches,
      currentPage: pageNum,
      totalPages: Math.ceil(matches.length / limitNum),
      totalCount: matches.length,
      hasMore: skip + paginatedMatches.length < matches.length
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get admin user
// @route   GET /api/users/admin
// @access  Private
exports.getAdminUser = async (req, res) => {
  try {
    const admin = await User.findOne({ role: 'admin' }).select('-password');
    res.json(admin);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Block a user
// @route   POST /api/users/:id/block
// @access  Private
exports.blockUser = async (req, res) => {
  try {
    const targetUserId = req.params.id;
    if (!mongoose.isValidObjectId(targetUserId)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }
    if (req.user._id.toString() === targetUserId) {
      return res.status(400).json({ message: 'Cannot block yourself' });
    }

    await User.findByIdAndUpdate(req.user._id, {
      $addToSet: { blockedUsers: targetUserId },
    });

    logAuditEvent({
      userId: req.user._id,
      action: 'USER_BLOCKED',
      targetId: targetUserId,
      targetType: 'User',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.json({ success: true, message: 'User blocked successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Unblock a user
// @route   POST /api/users/:id/unblock
// @access  Private
exports.unblockUser = async (req, res) => {
  try {
    const targetUserId = req.params.id;
    if (!mongoose.isValidObjectId(targetUserId)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }

    await User.findByIdAndUpdate(req.user._id, {
      $pull: { blockedUsers: targetUserId },
    });

    logAuditEvent({
      userId: req.user._id,
      action: 'USER_UNBLOCKED',
      targetId: targetUserId,
      targetType: 'User',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.json({ success: true, message: 'User unblocked successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get list of blocked users for the logged-in user
// @route   GET /api/users/blocked
// @access  Private
exports.getBlockedUsers = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate({
      path: 'blockedUsers',
      select: USER_LIST_SELECT,
    });
    res.json(user.blockedUsers || []);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to fetch blocked users' });
  }
};

// @desc    Acknowledge updated Privacy Policy and 10-day retention terms
// @route   POST /api/users/acknowledge-privacy-policy
// @access  Private
exports.acknowledgePrivacyPolicy = async (req, res) => {
  try {
    const {
      is18OrOlder,
      isAccurateInfo,
      acceptedTermsAndPrivacy,
      acceptedInactivityDeletion,
      consentAgreements,
      language,
      consentSource,
    } = req.body;

    const consent18 = is18OrOlder === true || consentAgreements?.is18OrOlder === true;
    const consentAccurate = isAccurateInfo === true || consentAgreements?.isAccurateInfo === true;
    const consentTerms = (
      acceptedTermsAndPrivacy === true ||
      req.body.agreedToTerms === true ||
      consentAgreements?.acceptedTermsAndPrivacy === true
    );
    const consentInactivity = (
      acceptedInactivityDeletion === true ||
      consentAgreements?.acceptedInactivityDeletion === true
    );

    if (!consent18 || !consentAccurate || !consentTerms || !consentInactivity) {
      return res.status(400).json({
        message: 'All 4 privacy, terms, age, and inactivity consent checkboxes are required and must be accepted.',
        missingConsents: {
          is18OrOlder: !consent18,
          isAccurateInfo: !consentAccurate,
          acceptedTermsAndPrivacy: !consentTerms,
          acceptedInactivityDeletion: !consentInactivity,
        },
      });
    }

    const version = req.body.version || '2.0';

    // Mark previous active consents as superseded
    await PrivacyConsent.updateMany(
      { user: req.user._id, status: 'accepted' },
      { $set: { status: 'superseded', supersededAt: new Date() } }
    );

    const ipAddress = req.headers['x-forwarded-for']
      ? req.headers['x-forwarded-for'].split(',')[0].trim()
      : req.ip || req.socket.remoteAddress || '';
    const userAgent = req.headers['user-agent'] || '';

    // Create fresh audit-grade PrivacyConsent document
    await PrivacyConsent.create({
      user: req.user._id,
      status: 'accepted',
      policyVersions: {
        privacyPolicy: version,
        termsOfService: '2.0',
        communityGuidelines: '1.0',
      },
      language: ['en', 'si', 'ta'].includes(language) ? language : (req.user.language || 'en'),
      consentSource: consentSource || 'policy_update_modal',
      agreements: {
        is18OrOlder: true,
        isAccurateInfo: true,
        acceptedTermsAndPrivacy: true,
        acceptedInactivityDeletion: true,
      },
      acceptedAt: new Date(),
      ipAddress: String(ipAddress).slice(0, 45),
      userAgent: String(userAgent).slice(0, 250),
    });

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      {
        $set: {
          acknowledgedPrivacyPolicyAt: new Date(),
          acknowledgedPrivacyPolicyVersion: version,
          agreedToTerms: true,
          lastActiveAt: new Date(),
        },
      },
      { new: true }
    ).select('-password');

    logAuditEvent({
      userId: req.user._id,
      action: 'PRIVACY_POLICY_ACKNOWLEDGED',
      targetId: req.user._id,
      targetType: 'User',
      details: { version, consentSource: consentSource || 'policy_update_modal' },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.json({
      success: true,
      message: 'Privacy policy acknowledged successfully',
      user: updatedUser,
    });
  } catch (error) {
    console.error('Error acknowledging privacy policy:', error);
    res.status(500).json({ message: error.message || 'Failed to record policy acknowledgment' });
  }
};

// @desc    Get current user's consent history
// @route   GET /api/users/consent-history
// @access  Private
exports.getConsentHistory = async (req, res) => {
  try {
    const consents = await PrivacyConsent.find({ user: req.user._id })
      .sort({ acceptedAt: -1 })
      .lean();

    res.json({
      success: true,
      consents,
    });
  } catch (error) {
    console.error('Error fetching consent history:', error);
    res.status(500).json({ message: 'Failed to fetch consent history' });
  }
};

// @desc    Export personal data in JSON format (GDPR/Privacy Right to Data Portability)
// @route   GET /api/users/export-data
// @access  Private
exports.exportUserData = async (req, res) => {
  try {
    const [userDoc, consents, stats, wallet, notifications] = await Promise.all([
      User.findById(req.user._id)
        .select('-password -twoFactorSecret -twoFactorRecoveryCodes -emailVerificationToken -passwordResetToken')
        .lean(),
      PrivacyConsent.find({ user: req.user._id }).sort({ acceptedAt: -1 }).lean(),
      UserStats.findOne({ user: req.user._id }).lean(),
      Wallet.findOne({ user: req.user._id }).lean(),
      Notification.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(50).lean(),
    ]);

    if (!userDoc) {
      return res.status(404).json({ message: 'User not found' });
    }

    const exportPayload = {
      exportMetadata: {
        exportedAt: new Date().toISOString(),
        platform: 'Kapu-LK Matrimonial & Matchmaking Platform',
        legalNotice: 'This export contains your personal data as recorded on Kapu-LK in accordance with Privacy and Data Portability Rights.',
        inactivityPolicy: 'Accounts with no activity for 10 days are permanently purged following 5-day, 2-day, and 1-day warning notices.',
      },
      profile: userDoc,
      consents: consents,
      statistics: stats || null,
      wallet: wallet ? {
        balance: wallet.balance,
        currency: wallet.currency,
        createdAt: wallet.createdAt,
      } : null,
      recentNotifications: notifications.map(n => ({
        type: n.type,
        message: n.message,
        createdAt: n.createdAt,
        isRead: n.isRead,
      })),
    };

    logAuditEvent({
      userId: req.user._id,
      action: 'USER_DATA_EXPORTED',
      targetId: req.user._id,
      targetType: 'User',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=kapu-lk-user-data-${req.user._id}.json`);
    return res.json(exportPayload);
  } catch (error) {
    console.error('Error exporting user data:', error);
    return res.status(500).json({ message: 'Failed to export personal data' });
  }
};

// @desc    Request immediate user-initiated permanent account deletion
// @route   POST /api/users/request-deletion
// @access  Private
exports.requestAccountDeletion = async (req, res) => {
  try {
    const { confirmation, reason } = req.body;

    if (confirmation !== 'DELETE') {
      return res.status(400).json({ message: 'Please type DELETE to confirm account deletion' });
    }

    const userId = req.user._id;

    logAuditEvent({
      userId,
      action: 'USER_REQUESTED_DELETION',
      targetId: userId,
      targetType: 'User',
      details: { reason: reason || 'User voluntary deletion' },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    // Execute complete permanent cascade purge
    await purgeUserPermanently(userId, 'USER_REQUESTED_DELETION');

    // Clear authentication cookies
    const isProd = process.env.NODE_ENV === 'production';
    const cookieOptions = {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'none' : 'lax',
    };
    res.clearCookie('accessToken', cookieOptions);
    res.clearCookie('refreshToken', { ...cookieOptions, path: '/api/auth' });

    return res.json({
      success: true,
      message: 'Your account and all associated personal data have been permanently deleted.',
    });
  } catch (error) {
    console.error('Error processing account deletion:', error);
    return res.status(500).json({ message: 'Failed to delete account. Please contact support.' });
  }
};

// @desc    Get profile visitor history (Silver and Gold only)
// @route   GET /api/users/visitors
// @access  Private
exports.getProfileVisitors = async (req, res) => {
  try {
    if (!hasPremiumFeature(req.user, 'profile_visitors')) {
      return res.status(403).json({
        success: false,
        code: 'PREMIUM_REQUIRED',
        isPremiumRequired: true,
        requiredPlan: 'silver',
        message: 'Profile Visitors List is a Silver and Gold Premium feature. Upgrade your plan to see who viewed your profile.',
      });
    }

    const visitors = await Notification.find({
      user: req.user._id,
      type: 'profile_view',
    })
      .sort({ lastViewedAt: -1, createdAt: -1 })
      .limit(50)
      .populate('relatedUser', 'name profileImageUrl age gender location district occupation isPremium premiumPlan')
      .lean();

    const visitorList = visitors
      .filter((v) => v.relatedUser)
      .map((v) => ({
        id: v._id,
        user: v.relatedUser,
        viewCount: v.viewCount || 1,
        lastViewedAt: v.lastViewedAt || v.createdAt,
      }));

    res.json({
      success: true,
      visitors: visitorList,
    });
  } catch (error) {
    console.error('Error fetching profile visitors:', error);
    res.status(500).json({ message: 'Failed to fetch profile visitors' });
  }
};

// @desc    Get VIP Spotlight profiles (Gold users only)
// @route   GET /api/users/spotlight
// @access  Private
exports.getSpotlightUsers = async (req, res) => {
  try {
    const now = new Date();
    const query = {
      isApproved: true,
      isActive: true,
      isPremium: true,
      premiumPlan: 'gold',
      premiumExpiresAt: { $gt: now },
      role: { $ne: 'admin' },
      _id: { $ne: req.user._id },
    };

    const spotlightUsers = await User.find(query)
      .select(USER_LIST_SELECT)
      .sort({ updatedAt: -1, createdAt: -1 })
      .limit(10)
      .lean();

    res.json(spotlightUsers);
  } catch (error) {
    console.error('Error fetching spotlight users:', error);
    res.status(500).json({ message: 'Failed to fetch spotlight users' });
  }
};

// @desc    Upload photo to user's gallery (max 4 photos total)
// @route   POST /api/users/photos
// @access  Private
exports.uploadGalleryPhoto = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Please upload an image file.' });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Initialize photos array if empty
    if (!Array.isArray(user.photos)) {
      user.photos = [];
    }

    // Migrate legacy profileImageUrl if photos array was empty
    if (user.photos.length === 0 && user.profileImageUrl) {
      user.photos.push({
        url: user.profileImageUrl,
        publicId: extractCloudinaryPublicId(user.profileImageUrl) || '',
        isMain: true,
        order: 0,
      });
    }

    // Enforce max 4 photos constraint
    if (user.photos.length >= 4) {
      return res.status(400).json({ message: 'You can upload a maximum of 4 profile photos.' });
    }

    // Convert buffer to base64 for Cloudinary upload
    const b64 = Buffer.from(req.file.buffer).toString('base64');
    const dataURI = `data:${req.file.mimetype};base64,${b64}`;

    const result = await cloudinary.uploader.upload(dataURI, {
      folder: 'matrimonial_profiles',
      resource_type: 'image',
      transformation: [
        { width: 1000, height: 1000, crop: 'limit' },
        { quality: 'auto' },
      ],
    });

    const isFirstPhoto = user.photos.length === 0;
    const isMainRequested = req.body.isMain === 'true' || req.body.isMain === true || isFirstPhoto;

    if (isMainRequested) {
      user.photos.forEach(p => { p.isMain = false; });
      user.profileImageUrl = result.secure_url;
    }

    const newPhoto = {
      url: result.secure_url,
      publicId: result.public_id,
      isMain: isMainRequested,
      order: user.photos.length,
    };

    user.photos.push(newPhoto);

    // If main photo wasn't set, ensure first photo is main
    if (!user.photos.some(p => p.isMain)) {
      user.photos[0].isMain = true;
      user.profileImageUrl = user.photos[0].url;
    }

    await user.save();

    res.json({
      success: true,
      message: 'Photo uploaded successfully.',
      photos: user.photos,
      profileImageUrl: user.profileImageUrl,
    });
  } catch (error) {
    console.error('Gallery photo upload error:', error);
    res.status(500).json({ message: error.message || 'Failed to upload photo.' });
  }
};

// @desc    Delete photo from gallery (min 1 photo required)
// @route   DELETE /api/users/photos/:photoId
// @access  Private
exports.deleteGalleryPhoto = async (req, res) => {
  try {
    const { photoId } = req.params;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!Array.isArray(user.photos) || user.photos.length === 0) {
      return res.status(400).json({ message: 'No photos to delete.' });
    }

    // Enforce minimum 1 photo constraint
    if (user.photos.length <= 1) {
      return res.status(400).json({ message: 'You must maintain at least 1 profile photo.' });
    }

    const photoIndex = user.photos.findIndex(p => p._id.toString() === photoId || p.publicId === photoId);
    if (photoIndex === -1) {
      return res.status(404).json({ message: 'Photo not found in your profile.' });
    }

    const [deletedPhoto] = user.photos.splice(photoIndex, 1);

    // Destroy image from Cloudinary
    const pubId = deletedPhoto.publicId || extractCloudinaryPublicId(deletedPhoto.url);
    if (pubId) {
      try {
        await cloudinary.uploader.destroy(pubId);
      } catch (cErr) {
        console.warn('Could not destroy Cloudinary image:', cErr.message);
      }
    }

    // If the deleted photo was the main photo, promote the first remaining photo to main
    if (deletedPhoto.isMain || !user.photos.some(p => p.isMain)) {
      user.photos[0].isMain = true;
      user.profileImageUrl = user.photos[0].url;
    }

    // Re-index photo order
    user.photos.forEach((p, idx) => {
      p.order = idx;
    });

    await user.save();

    res.json({
      success: true,
      message: 'Photo deleted successfully.',
      photos: user.photos,
      profileImageUrl: user.profileImageUrl,
    });
  } catch (error) {
    console.error('Delete photo error:', error);
    res.status(500).json({ message: error.message || 'Failed to delete photo.' });
  }
};

// @desc    Set a photo as the main profile photo
// @route   PUT /api/users/photos/:photoId/main
// @access  Private
exports.setMainGalleryPhoto = async (req, res) => {
  try {
    const { photoId } = req.params;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const targetPhoto = (user.photos || []).find(p => p._id.toString() === photoId || p.publicId === photoId);
    if (!targetPhoto) {
      return res.status(404).json({ message: 'Photo not found.' });
    }

    user.photos.forEach(p => {
      p.isMain = (p._id.toString() === photoId || p.publicId === photoId);
    });

    user.profileImageUrl = targetPhoto.url;
    await user.save();

    res.json({
      success: true,
      message: 'Main profile photo updated.',
      photos: user.photos,
      profileImageUrl: user.profileImageUrl,
    });
  } catch (error) {
    console.error('Set main photo error:', error);
    res.status(500).json({ message: error.message || 'Failed to update main photo.' });
  }
};

// @desc    Reorder photos in gallery
// @route   PUT /api/users/photos/reorder
// @access  Private
exports.reorderGalleryPhotos = async (req, res) => {
  try {
    const { photoIds } = req.body;
    if (!Array.isArray(photoIds) || photoIds.length === 0) {
      return res.status(400).json({ message: 'Please provide an array of photo IDs.' });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const currentPhotos = user.photos || [];
    const reordered = [];

    photoIds.forEach((id, idx) => {
      const match = currentPhotos.find(p => p._id.toString() === id.toString() || p.publicId === id);
      if (match) {
        match.order = idx;
        reordered.push(match);
      }
    });

    // Add any remaining unreferenced photos
    currentPhotos.forEach(p => {
      if (!reordered.some(r => r._id.toString() === p._id.toString())) {
        p.order = reordered.length;
        reordered.push(p);
      }
    });

    user.photos = reordered;

    // Ensure main photo is synchronized with profileImageUrl
    const mainPhoto = user.photos.find(p => p.isMain) || user.photos[0];
    if (mainPhoto) {
      user.profileImageUrl = mainPhoto.url;
    }

    await user.save();

    res.json({
      success: true,
      message: 'Photos reordered successfully.',
      photos: user.photos,
      profileImageUrl: user.profileImageUrl,
    });
  } catch (error) {
    console.error('Reorder photos error:', error);
    res.status(500).json({ message: error.message || 'Failed to reorder photos.' });
  }
};


