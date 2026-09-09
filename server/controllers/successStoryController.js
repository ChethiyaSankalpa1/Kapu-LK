const SuccessStory = require('../models/SuccessStory');
const User = require('../models/User');

// @desc    Get all success stories
// @route   GET /api/success-stories
// @access  Public
exports.getSuccessStories = async (req, res) => {
  try {
    const { featured = false } = req.query;
    
    const query = { isApproved: true };
    if (featured === 'true') {
      query.isFeatured = true;
    }

    const stories = await SuccessStory.find(query)
      .populate('user1', 'name profileImageUrl')
      .populate('user2', 'name profileImageUrl')
      .populate('submittedBy', 'name profileImageUrl')
      .sort({ isFeatured: -1, createdAt: -1 })
      .limit(20);

    res.json(stories);
  } catch (error) {
    console.error('Error fetching success stories:', error);
    res.status(500).json({ message: 'Failed to fetch success stories' });
  }
};

// @desc    Get single success story
// @route   GET /api/success-stories/:id
// @access  Public
exports.getSuccessStory = async (req, res) => {
  try {
    const story = await SuccessStory.findById(req.params.id)
      .populate('user1', 'name profileImageUrl age location')
      .populate('user2', 'name profileImageUrl age location')
      .populate('submittedBy', 'name profileImageUrl')
      .populate('likes', 'name profileImageUrl');

    if (!story) {
      return res.status(404).json({ message: 'Success story not found' });
    }

    // Increment view count
    story.views = (story.views || 0) + 1;
    await story.save();

    res.json(story);
  } catch (error) {
    console.error('Error fetching success story:', error);
    res.status(500).json({ message: 'Failed to fetch success story' });
  }
};

// @desc    Create success story
// @route   POST /api/success-stories
// @access  Private
exports.createSuccessStory = async (req, res) => {
  try {
    const {
      coupleName,
      user1Id,
      user2Id,
      story,
      photos,
      weddingDate,
      howWeMet,
      advice
    } = req.body;

    // Verify both users exist
    const user1 = await User.findById(user1Id);
    const user2 = await User.findById(user2Id);

    if (!user1 || !user2) {
      return res.status(404).json({ message: 'One or both users not found' });
    }

    const successStory = await SuccessStory.create({
      coupleName,
      user1: user1Id,
      user2: user2Id,
      story,
      photos: photos || [],
      weddingDate,
      howWeMet,
      advice,
      submittedBy: req.user._id,
      isApproved: false // Requires admin approval
    });

    const populatedStory = await SuccessStory.findById(successStory._id)
      .populate('user1', 'name profileImageUrl')
      .populate('user2', 'name profileImageUrl')
      .populate('submittedBy', 'name profileImageUrl');

    res.status(201).json(populatedStory);
  } catch (error) {
    console.error('Error creating success story:', error);
    res.status(500).json({ message: 'Failed to create success story' });
  }
};

// @desc    Like success story
// @route   POST /api/success-stories/:id/like
// @access  Private
exports.likeSuccessStory = async (req, res) => {
  try {
    const story = await SuccessStory.findById(req.params.id);
    if (!story) {
      return res.status(404).json({ message: 'Success story not found' });
    }

    const userId = req.user._id;
    const alreadyLiked = story.likes.includes(userId);

    if (alreadyLiked) {
      story.likes = story.likes.filter(id => id.toString() !== userId.toString());
      story.likeCount = Math.max(0, story.likeCount - 1);
    } else {
      story.likes.push(userId);
      story.likeCount += 1;
    }

    await story.save();

    res.json({
      liked: !alreadyLiked,
      likeCount: story.likeCount
    });
  } catch (error) {
    console.error('Error liking success story:', error);
    res.status(500).json({ message: 'Failed to like success story' });
  }
};

// @desc    Approve success story (admin only)
// @route   PUT /api/success-stories/:id/approve
// @access  Private/Admin
exports.approveSuccessStory = async (req, res) => {
  try {
    const story = await SuccessStory.findByIdAndUpdate(
      req.params.id,
      { isApproved: true },
      { new: true }
    );

    if (!story) {
      return res.status(404).json({ message: 'Success story not found' });
    }

    res.json(story);
  } catch (error) {
    console.error('Error approving success story:', error);
    res.status(500).json({ message: 'Failed to approve success story' });
  }
};

// @desc    Feature success story (admin only)
// @route   PUT /api/success-stories/:id/feature
// @access  Private/Admin
exports.featureSuccessStory = async (req, res) => {
  try {
    const { isFeatured } = req.body;
    
    const story = await SuccessStory.findByIdAndUpdate(
      req.params.id,
      { isFeatured },
      { new: true }
    );

    if (!story) {
      return res.status(404).json({ message: 'Success story not found' });
    }

    res.json(story);
  } catch (error) {
    console.error('Error featuring success story:', error);
    res.status(500).json({ message: 'Failed to feature success story' });
  }
};

// @desc    Delete success story (admin only)
// @route   DELETE /api/success-stories/:id
// @access  Private/Admin
exports.deleteSuccessStory = async (req, res) => {
  try {
    const story = await SuccessStory.findByIdAndDelete(req.params.id);
    if (!story) {
      return res.status(404).json({ message: 'Success story not found' });
    }
    res.json({ message: 'Success story deleted successfully' });
  } catch (error) {
    console.error('Error deleting success story:', error);
    res.status(500).json({ message: 'Failed to delete success story' });
  }
};

// @desc    Update success story
// @route   PUT /api/success-stories/:id
// @access  Private/Admin
exports.updateSuccessStory = async (req, res) => {
  try {
    const story = await SuccessStory.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!story) {
      return res.status(404).json({ message: 'Success story not found' });
    }
    res.json(story);
  } catch (error) {
    console.error('Error updating success story:', error);
    res.status(500).json({ message: error.message || 'Failed to update success story' });
  }
};
