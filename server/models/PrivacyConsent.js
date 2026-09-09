const mongoose = require('mongoose');

const privacyConsentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['accepted', 'withdrawn', 'superseded'],
      default: 'accepted',
      index: true,
    },
    policyVersions: {
      privacyPolicy: {
        type: String,
        default: '2.0',
        required: true,
      },
      termsOfService: {
        type: String,
        default: '2.0',
        required: true,
      },
      communityGuidelines: {
        type: String,
        default: '1.0',
        required: true,
      },
    },
    language: {
      type: String,
      enum: ['en', 'si', 'ta'],
      default: 'en',
    },
    consentSource: {
      type: String,
      enum: [
        'web_registration',
        'profile_completion',
        'policy_update_modal',
        'settings_reconsent',
      ],
      default: 'web_registration',
    },
    agreements: {
      is18OrOlder: {
        type: Boolean,
        required: true,
      },
      isAccurateInfo: {
        type: Boolean,
        required: true,
      },
      acceptedTermsAndPrivacy: {
        type: Boolean,
        required: true,
      },
      acceptedInactivityDeletion: {
        type: Boolean,
        required: true,
      },
    },
    acceptedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    supersededAt: {
      type: Date,
    },
    withdrawnAt: {
      type: Date,
    },
    ipAddress: {
      type: String,
      trim: true,
      default: '',
    },
    userAgent: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

privacyConsentSchema.index({ user: 1, status: 1, acceptedAt: -1 });

module.exports = mongoose.model('PrivacyConsent', privacyConsentSchema);
