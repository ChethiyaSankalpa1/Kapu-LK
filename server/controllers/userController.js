const mongoose = require('mongoose');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { logAuditEvent } = require('../middleware/auditLogger');

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

    const users = await User.find(query)
      .select(req.user.role === 'admin' ? '-password' : USER_LIST_SELECT)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
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
    const user = await User.findById(req.params.id).select(
      '-password -twoFactorSecret -twoFactorRecoveryCodes -passwordResetToken -passwordResetExpires'
    );

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isSelfOrAdmin = user._id.equals(req.user._id) || req.user.role === 'admin';

    if (!isSelfOrAdmin) {
      await Notification.create({
        user: user._id,
        type: 'profile_view',
        message: `${req.user.name} viewed your profile`,
        relatedUser: req.user._id,
      });
    }

    const userObj = user.toObject();

    // Privacy protection: Mask confidential contact & security fields for other users
    if (!isSelfOrAdmin) {
      delete userObj.phoneNumber;
      delete userObj.email;
      delete userObj.complaints;
      delete userObj.loginAttempts;
      delete userObj.lockUntil;
      delete userObj.blockedUsers;
      delete userObj.tokenVersion;
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

    const users = await User.find(query)
      .select(USER_LIST_SELECT)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean();
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

// @desc    Acknowledge updated Privacy Policy and 10-day retention terms
// @route   POST /api/users/acknowledge-privacy-policy
// @access  Private
exports.acknowledgePrivacyPolicy = async (req, res) => {
  try {
    const version = req.body.version || '2026.09';
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      {
        $set: {
          acknowledgedPrivacyPolicyAt: new Date(),
          acknowledgedPrivacyPolicyVersion: version,
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
      details: { version },
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

