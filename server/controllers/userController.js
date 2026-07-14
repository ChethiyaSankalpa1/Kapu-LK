const User = require('../models/User');
const Notification = require('../models/Notification');

const isValidPhoneNumber = (value) => !value || /^[0-9]+$/.test(value);

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
    const query = req.user.role === 'admin'
      ? {}
      : { isApproved: true, isActive: true, _id: { $ne: req.user._id } };

    const users = await User.find(query).select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Private
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user._id.equals(req.user._id)) {
      await Notification.create({
        user: user._id,
        type: 'profile_view',
        message: `${req.user.name} viewed your profile`,
        relatedUser: req.user._id,
      });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Search users
// @route   GET /api/users/search
// @access  Private
exports.searchUsers = async (req, res) => {
  try {
    const { gender, minAge, maxAge, location, religion, maritalStatus, interests } = req.query;

    let query = { isApproved: true, isActive: true };

    if (gender) query.gender = gender;
    if (location) query.location = { $regex: location, $options: 'i' };
    if (religion) query.religion = { $regex: religion, $options: 'i' };
    if (maritalStatus) query.maritalStatus = maritalStatus;
    if (interests) query.interests = { $regex: interests, $options: 'i' };
    if (minAge || maxAge) {
      query.age = {};
      if (minAge) query.age.$gte = parseInt(minAge);
      if (maxAge) query.age.$lte = parseInt(maxAge);
    }

    const users = await User.find(query).select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get suggested matches with compatibility score
// @route   GET /api/users/matches
// @access  Private
exports.getMatches = async (req, res) => {
  try {
    const currentUser = await User.findById(req.user._id);

    if (!currentUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    const baseQuery = {
      _id: { $ne: currentUser._id },
      isApproved: true,
      isActive: true,
    };

    if (currentUser.gender === 'male') {
      baseQuery.gender = 'female';
    } else if (currentUser.gender === 'female') {
      baseQuery.gender = 'male';
    }

    const candidates = await User.find(baseQuery).select('-password');

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

      return {
        ...user.toObject(),
        compatibilityScore: score,
      };
    });

    matches.sort((a, b) => b.compatibilityScore - a.compatibilityScore);

    res.json(matches);
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
