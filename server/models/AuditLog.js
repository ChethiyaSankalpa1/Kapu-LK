const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true,
  },
  action: {
    type: String,
    required: true,
    index: true,
  },
  targetId: {
    type: mongoose.Schema.Types.ObjectId,
    index: true,
  },
  targetType: {
    type: String,
    enum: ['User', 'PaymentRequest', 'PremiumPaymentRequest', 'Blog', 'Event', 'Redemption', 'Message', 'System'],
  },
  details: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  ipAddress: {
    type: String,
    default: '',
  },
  userAgent: {
    type: String,
    default: '',
  },
  severity: {
    type: String,
    enum: ['info', 'warning', 'critical'],
    default: 'info',
  },
}, {
  timestamps: { createdAt: true, updatedAt: false },
});

auditLogSchema.index({ action: 1, createdAt: -1 });
auditLogSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
