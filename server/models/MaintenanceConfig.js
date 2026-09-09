const mongoose = require('mongoose');

const maintenanceConfigSchema = new mongoose.Schema(
  {
    isActive: {
      type: Boolean,
      default: false,
      index: true,
    },
    scope: {
      type: String,
      enum: ['full', 'feature_specific'],
      default: 'full',
    },
    affectedFeatures: [
      {
        type: String,
        enum: ['messaging', 'payments', 'profile_edit', 'rewards', 'uploads'],
      },
    ],
    title: {
      en: { type: String, default: "We'll Be Back Soon!" },
      si: { type: String, default: 'අපි ළඟදීම නැවත පැමිණෙන්නෙමු!' },
      ta: { type: String, default: 'நாங்கள் விரைவில் திரும்புவோம்!' },
    },
    message: {
      en: {
        type: String,
        default:
          'Kapu-LK is currently undergoing scheduled platform maintenance and security upgrades. Your account and personal data remain completely safe and protected.',
      },
      si: {
        type: String,
        default:
          'Kapu-LK පද්ධතියේ නියමිත නඩත්තු කටයුතු සහ ආරක්ෂණ යාවත්කාලීන කිරීම් මේ වන විට සිදුකෙරේ. ඔබගේ ගිණුම සහ දත්ත සම්පූර්ණයෙන්ම ආරක්ෂිතයි.',
      },
      ta: {
        type: String,
        default:
          'Kapu-LK தற்போது திட்டமிடப்பட்ட பராமரிப்பு மற்றும் பாதுகாப்பு மேம்பாடுகளை மேற்கொள்கிறது. உங்கள் கணக்கு மற்றும் தரவு முற்றிலும் பாதுகாப்பாக உள்ளன.',
      },
    },
    reason: {
      type: String,
      default: 'Routine performance optimization & security hardening',
    },
    expectedCompletionAt: {
      type: Date,
    },
    scheduledStartAt: {
      type: Date,
    },
    scheduledEndAt: {
      type: Date,
    },
    supportContact: {
      type: String,
      default: 'support@kapu-lk.com',
    },
    comingSoon: {
      enabled: {
        type: Boolean,
        default: false,
      },
      featureName: {
        en: { type: String, default: 'AI Matchmaker & Instant Horoscopes' },
        si: { type: String, default: 'AI සහකරු ගැලපුම් හා ක්ෂණික කේන්දර පරීක්ෂාව' },
        ta: { type: String, default: 'AI பொருத்தம் & உடனடி ஜாதக ஆய்வு' },
      },
      description: {
        en: {
          type: String,
          default:
            'Exciting new intelligent compatibility scoring and Sri Lankan astrological compatibility insights are launching soon!',
        },
        si: {
          type: String,
          default:
            'නව බුද්ධිමත් ගැලපුම් ලකුණු සහ ශ්‍රී ලාංකීය ජ්‍යොතිෂ්‍ය ගැලපීම් පහසුකම් ළඟදීම!',
        },
        ta: {
          type: String,
          default:
            'புதிய புத்திசாலித்தனமான பொருத்தம் மற்றும் ஜோதிட பகுப்பாய்வு வசதிகள் விரைவில் வரவுள்ளன!',
        },
      },
      icon: {
        type: String,
        default: 'Sparkles',
      },
      launchDate: {
        type: Date,
      },
      subscribedEmails: [
        {
          email: {
            type: String,
            lowercase: true,
            trim: true,
          },
          subscribedAt: {
            type: Date,
            default: Date.now,
          },
        },
      ],
    },
    auditLog: [
      {
        action: { type: String, required: true },
        adminUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        adminEmail: { type: String },
        timestamp: { type: Date, default: Date.now },
        details: { type: String },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Singleton helper to get or initialize default config
maintenanceConfigSchema.statics.getConfig = async function () {
  let config = await this.findOne();
  if (!config) {
    config = await this.create({
      isActive: false,
      scope: 'full',
      affectedFeatures: [],
    });
  }
  return config;
};

module.exports = mongoose.model('MaintenanceConfig', maintenanceConfigSchema);
