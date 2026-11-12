const mongoose = require('mongoose');
const Notification = require('../models/Notification');

// @desc    Merge duplicate profile-view notifications for a given user pair (or all users).
//          Keeps the newest (by max of [createdAt, lastViewedAt]) record, sums viewCount
//          across duplicates, then deletes the rest. Safe & idempotent.
async function mergeProfileViewDuplicates(targetUser = null) {
  const baseMatch = { type: 'profile_view' };
  if (targetUser) baseMatch.user = new mongoose.Types.ObjectId(targetUser);

  const groups = await Notification.aggregate([
    { $match: baseMatch },
    {
      $group: {
        _id: {
          user: '$user',
          relatedUser: '$relatedUser',
        },
        ids: { $addToSet: '$_id' },
        count: { $sum: 1 },
        totalViews: { $sum: { $ifNull: ['$viewCount', 1] } },
        newestTime: {
          $max: {
            $max: ['$createdAt', { $ifNull: ['$lastViewedAt', '$createdAt'] }],
          },
        },
        newestCreated: { $max: '$createdAt' },
      },
    },
    { $match: { count: { $gt: 1 } } },
  ]).allowDiskUse(true);

  let mergedGroups = 0;
  let deletedDocs = 0;

  for (const g of groups) {
    const allIds = g.ids.map((id) => new mongoose.Types.ObjectId(id));

    const keeperSort = {
      lastViewedAt: -1,
      createdAt: -1,
    };
    const keeper = await Notification.findOne({ _id: mongoose.trusted({ $in: allIds }) })
      .sort(keeperSort)
      .select('_id viewCount lastViewedAt createdAt')
      .lean();
    if (!keeper) continue;

    const otherIds = allIds.filter(
      (id) => String(id) !== String(keeper._id)
    );

    const mergedViewCount = Math.max(1, Number(g.totalViews) || 0);
    const mergedLastViewed = new Date(g.newestTime);

    await Notification.updateOne(
      { _id: keeper._id },
      {
        $set: {
          viewCount: mergedViewCount,
          lastViewedAt: mergedLastViewed,
        },
      }
    );

    if (otherIds.length > 0) {
      const dr = await Notification.deleteMany({ _id: mongoose.trusted({ $in: otherIds }) });
      deletedDocs += dr.deletedCount || 0;
    }

    mergedGroups += 1;
  }

  return { mergedGroups, deletedDocs, scannedGroupsWithDupes: groups.length };
}

// @desc    Get notifications for current user
// @route   GET /api/notifications
// @access  Private
// Note:    This endpoint is READ-ONLY. It never records profile views.
//          Backward-compatible hybrid response:
//            - No `page` or `limit` query params  -> returns raw array (existing consumers)
//            - With `page` or `limit` query params -> returns object envelope with pagination
exports.getNotifications = async (req, res) => {
  try {
    // Sync professional Sinhala profile photo reminder notification:
    // Display to eligible users whose profile pictures are non-personal (avatar, placeholder, or none).
    // Automatically remove reminder notifications when the user has uploaded a genuine personal photo.
    try {
      const placeholderPatterns = [
        'placeholder', 'default-avatar', 'default_avatar', 'default-profile',
        'default_profile', 'dicebear', 'ui-avatars', 'pravatar', 'multiavatar',
        'robohash', 'couple-hero', '/images/default', 'assets/default', 'avatar/'
      ];
      const userImg = (req.user?.profileImageUrl || '').toLowerCase();
      const isPlaceholder = !userImg || placeholderPatterns.some((p) => userImg.includes(p));
      const hasAvatar = Boolean(req.user?.profileAvatar && req.user.profileAvatar.trim() !== '');

      if (hasAvatar || isPlaceholder) {
        const existingReminder = await Notification.findOne({
          user: req.user._id,
          type: 'profile_reminder',
        });
        if (!existingReminder) {
          await Notification.create({
            user: req.user._id,
            type: 'profile_reminder',
            message: '📸 ඔබේ සැබෑ ඡායාරූපයක් එක් කරන්න! සැබෑ ඡායාරූපයක් එක් කිරීමෙන් ඔබව වඩාත් ඉක්මනින් සහ විශ්වාසදායක ලෙස අනෙකුත් සාමාජිකයින්ට හඳුනාගත හැක.',
            isRead: false,
          });
        }
      } else {
        await Notification.deleteMany({
          user: req.user._id,
          type: 'profile_reminder',
        });
      }
    } catch (_syncErr) {
      // Non-blocking sync error handling
    }

    const pageRaw = req.query.page;
    const limitRaw = req.query.limit;
    const wantsPagination = pageRaw !== undefined || limitRaw !== undefined;

    const baseQuery = { user: req.user._id };

    if (!wantsPagination) {
      const notifications = await Notification.find(baseQuery)
        .sort({ createdAt: -1 })
        .limit(30)
        .populate('relatedUser', 'name profileImageUrl profileAvatar');
      return res.json(notifications);
    }

    const page = Math.max(1, parseInt(pageRaw, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(limitRaw, 10) || 30));
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      Notification.find(baseQuery)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('relatedUser', 'name profileImageUrl profileAvatar')
        .lean(),
      Notification.countDocuments(baseQuery),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / limit));
    const hasMore = skip + items.length < total;

    res.json({
      items,
      total,
      page,
      totalPages,
      hasMore,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Mark a notification as read (ownership validated)
// @route   PUT /api/notifications/:id/read
// @access  Private
exports.markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    notification.isRead = true;
    await notification.save();

    res.json(notification);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Mark all notifications as read
// @route   PUT /api/notifications/mark-all-read
// @access  Private
exports.markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { user: req.user._id, isRead: false },
      { $set: { isRead: true } }
    );

    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Admin: merge duplicate profile-view notifications across DB (or one user)
// @route   POST /api/notifications/admin/merge-profile-view-duplicates
// @access  Private/Admin
exports.adminMergeProfileViewDuplicates = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }
    const targetUser = req.body?.userId || null;
    const result = await mergeProfileViewDuplicates(targetUser);
    res.json({
      success: true,
      scope: targetUser ? `user:${targetUser}` : 'all',
      ...result,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  ...module.exports,
  mergeProfileViewDuplicates,
};
