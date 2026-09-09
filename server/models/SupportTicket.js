const mongoose = require('mongoose');

const supportTicketSchema = new mongoose.Schema(
  {
    ticketNumber: {
      type: String,
      unique: true,
      index: true,
      default: () => `KLK-${Math.floor(10000 + Math.random() * 90000)}`,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
      default: null,
    },
    guestEmail: {
      type: String,
      trim: true,
      lowercase: true,
    },
    guestName: {
      type: String,
      trim: true,
    },
    category: {
      type: String,
      enum: [
        'login',
        'profile',
        'verification',
        'messaging',
        'payments',
        'reporting',
        'privacy',
        'recovery',
        'technical',
        'other',
      ],
      required: true,
    },
    subject: {
      type: String,
      required: [true, 'Subject is required'],
      trim: true,
      maxlength: 200,
    },
    status: {
      type: String,
      enum: ['open', 'in_progress', 'resolved', 'closed'],
      default: 'open',
      index: true,
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium',
    },
    messages: [
      {
        sender: {
          type: String,
          enum: ['user', 'bot', 'admin'],
          required: true,
        },
        senderUser: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        text: {
          type: String,
          required: true,
          trim: true,
          maxlength: 3000,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    adminNotes: {
      type: String,
      default: '',
      maxlength: 2000,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    lastActivityAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Auto-generate human-readable ticket number (e.g. KLK-98234)
supportTicketSchema.pre('validate', function (next) {
  if (!this.ticketNumber) {
    const randomDigits = Math.floor(10000 + Math.random() * 90000);
    this.ticketNumber = `KLK-${randomDigits}`;
  }
  next();
});

module.exports = mongoose.model('SupportTicket', supportTicketSchema);
