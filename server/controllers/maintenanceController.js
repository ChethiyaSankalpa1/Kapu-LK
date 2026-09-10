const MaintenanceConfig = require('../models/MaintenanceConfig');
const { invalidateMaintenanceCache } = require('../middleware/maintenanceMiddleware');
const { logAuditEvent } = require('../middleware/auditLogger');

// @desc    Get public maintenance status
// @route   GET /api/maintenance/status
// @access  Public
exports.getMaintenanceStatus = async (req, res) => {
  try {
    const config = await MaintenanceConfig.getConfig();

    const now = new Date();
    let effectiveActive = Boolean(config.isActive);

    if (config.scheduledStartAt && now >= new Date(config.scheduledStartAt)) {
      if (!config.scheduledEndAt || now < new Date(config.scheduledEndAt)) {
        effectiveActive = true;
      } else {
        effectiveActive = false;
      }
    } else if (config.scheduledEndAt && now >= new Date(config.scheduledEndAt)) {
      effectiveActive = false;
    }

    return res.json({
      success: true,
      isActive: effectiveActive,
      scope: config.scope,
      affectedFeatures: config.affectedFeatures,
      title: config.title,
      message: config.message,
      reason: config.reason,
      expectedCompletionAt: config.expectedCompletionAt,
      supportContact: config.supportContact,
      comingSoon: config.comingSoon?.enabled
        ? {
            enabled: true,
            featureName: config.comingSoon.featureName,
            description: config.comingSoon.description,
            icon: config.comingSoon.icon,
            launchDate: config.comingSoon.launchDate,
            totalSubscribers: (config.comingSoon.subscribedEmails || []).length,
          }
        : null,
    });
  } catch (error) {
    console.error('Error fetching maintenance status:', error);
    return res.json({
      success: true,
      isActive: false,
      scope: 'full',
      affectedFeatures: [],
    });
  }
};

// @desc    Subscribe to "Notify Me" for Coming Soon features (with duplicate prevention)
// @route   POST /api/maintenance/coming-soon/subscribe
// @access  Public
exports.subscribeComingSoon = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email || !/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email)) {
      return res.status(400).json({ message: 'Please provide a valid email address.' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const config = await MaintenanceConfig.getConfig();

    if (!config.comingSoon) {
      config.comingSoon = { enabled: true, subscribedEmails: [] };
    }
    if (!Array.isArray(config.comingSoon.subscribedEmails)) {
      config.comingSoon.subscribedEmails = [];
    }

    // Check duplicate
    const alreadySubscribed = config.comingSoon.subscribedEmails.some(
      (sub) => (sub.email || '').toLowerCase() === normalizedEmail
    );

    if (alreadySubscribed) {
      return res.json({
        success: true,
        alreadySubscribed: true,
        message: "You're already subscribed! We'll notify you as soon as this feature launches.",
      });
    }

    config.comingSoon.subscribedEmails.push({
      email: normalizedEmail,
      subscribedAt: new Date(),
    });

    await config.save();
    invalidateMaintenanceCache();

    return res.json({
      success: true,
      message: "Thank you! You'll be the first to know when we launch.",
    });
  } catch (error) {
    console.error('Error subscribing to coming soon updates:', error);
    return res.status(500).json({ message: 'Failed to subscribe. Please try again.' });
  }
};

// @desc    Get full maintenance config and audit history for admin dashboard
// @route   GET /api/maintenance/admin
// @access  Private/Admin
exports.getAdminMaintenanceConfig = async (req, res) => {
  try {
    const config = await MaintenanceConfig.getConfig();
    return res.json({
      success: true,
      config,
    });
  } catch (error) {
    console.error('Error fetching admin maintenance config:', error);
    return res.status(500).json({ message: 'Failed to retrieve maintenance settings.' });
  }
};

// @desc    Update maintenance configuration and schedule
// @route   PUT /api/maintenance/admin
// @access  Private/Admin
exports.updateAdminMaintenanceConfig = async (req, res) => {
  try {
    const {
      isActive,
      scope,
      affectedFeatures,
      title,
      message,
      reason,
      expectedCompletionAt,
      scheduledStartAt,
      scheduledEndAt,
      supportContact,
      comingSoon,
    } = req.body;

    const config = await MaintenanceConfig.getConfig();

    const wasActive = config.isActive;
    const nowActive = isActive !== undefined ? Boolean(isActive) : wasActive;

    // Update fields
    if (isActive !== undefined) config.isActive = Boolean(isActive);
    if (scope !== undefined) config.scope = scope;
    if (affectedFeatures !== undefined) config.affectedFeatures = affectedFeatures;
    if (title !== undefined) config.title = { ...config.title, ...title };
    if (message !== undefined) config.message = { ...config.message, ...message };
    if (reason !== undefined) config.reason = reason;
    if (expectedCompletionAt !== undefined) config.expectedCompletionAt = expectedCompletionAt || null;
    if (scheduledStartAt !== undefined) config.scheduledStartAt = scheduledStartAt || null;
    if (scheduledEndAt !== undefined) config.scheduledEndAt = scheduledEndAt || null;
    if (supportContact !== undefined) config.supportContact = supportContact;

    if (comingSoon !== undefined) {
      const previousSubscribers = config.comingSoon && Array.isArray(config.comingSoon.subscribedEmails)
        ? config.comingSoon.subscribedEmails
        : [];
      const previousComingSoonPlain = config.comingSoon && typeof config.comingSoon.toObject === 'function'
        ? config.comingSoon.toObject()
        : (config.comingSoon || {});
      config.comingSoon = {
        ...previousComingSoonPlain,
        ...comingSoon,
        subscribedEmails: previousSubscribers, // Preserve subscribers
      };
    }

    // Append to audit log
    const auditAction = !wasActive && nowActive ? 'MAINTENANCE_ENABLED' : (wasActive && !nowActive ? 'MAINTENANCE_DISABLED' : 'MAINTENANCE_UPDATED');
    config.auditLog.unshift({
      action: auditAction,
      adminUser: req.user._id,
      adminEmail: req.user.email,
      timestamp: new Date(),
      details: reason || `Updated mode to ${nowActive ? 'ACTIVE' : 'INACTIVE'} (Scope: ${config.scope})`,
    });

    // Keep audit log to 50 latest records
    if (config.auditLog.length > 50) {
      config.auditLog = config.auditLog.slice(0, 50);
    }

    await config.save();
    invalidateMaintenanceCache();

    logAuditEvent({
      userId: req.user._id,
      action: auditAction,
      targetType: 'MaintenanceConfig',
      details: {
        isActive: config.isActive,
        scope: config.scope,
        reason: config.reason,
      },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    return res.json({
      success: true,
      message: 'Maintenance settings updated successfully.',
      config,
    });
  } catch (error) {
    console.error('Error updating maintenance settings:', error);
    return res.status(500).json({ message: 'Failed to update maintenance settings.' });
  }
};

// @desc    Quick end maintenance now
// @route   POST /api/maintenance/admin/end
// @access  Private/Admin
exports.endMaintenanceNow = async (req, res) => {
  try {
    const config = await MaintenanceConfig.getConfig();
    config.isActive = false;
    config.scheduledStartAt = null;
    config.scheduledEndAt = null;

    config.auditLog.unshift({
      action: 'MAINTENANCE_ENDED_IMMEDIATE',
      adminUser: req.user._id,
      adminEmail: req.user.email,
      timestamp: new Date(),
      details: 'Administrator manually ended maintenance mode immediately.',
    });

    if (config.auditLog.length > 50) {
      config.auditLog = config.auditLog.slice(0, 50);
    }

    await config.save();
    invalidateMaintenanceCache();

    logAuditEvent({
      userId: req.user._id,
      action: 'MAINTENANCE_ENDED_IMMEDIATE',
      targetType: 'MaintenanceConfig',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    return res.json({
      success: true,
      message: 'Maintenance mode ended immediately. All features restored.',
      config,
    });
  } catch (error) {
    console.error('Error ending maintenance mode:', error);
    return res.status(500).json({ message: 'Failed to end maintenance mode.' });
  }
};
