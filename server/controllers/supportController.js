const mongoose = require('mongoose');
const SupportTicket = require('../models/SupportTicket');
const Notification = require('../models/Notification');
const User = require('../models/User');

// Valid categories
const VALID_CATEGORIES = [
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
];

/**
 * @desc    Create a new support ticket (User or Guest)
 * @route   POST /api/support/tickets
 * @access  Public / Optional Auth
 */
exports.createTicket = async (req, res) => {
  try {
    const { category, subject, message, guestEmail, guestName, priority } = req.body;

    if (!category || !VALID_CATEGORIES.includes(category)) {
      return res.status(400).json({
        success: false,
        message: `Please select a valid category: ${VALID_CATEGORIES.join(', ')}`,
      });
    }

    if (!subject || subject.trim().length < 3) {
      return res.status(400).json({
        success: false,
        message: 'Subject is required and must be at least 3 characters long',
      });
    }

    if (!message || message.trim().length < 5) {
      return res.status(400).json({
        success: false,
        message: 'Message is required and must be at least 5 characters long',
      });
    }

    const isAuth = !!req.user;
    if (!isAuth && (!guestEmail || !guestEmail.includes('@'))) {
      return res.status(400).json({
        success: false,
        message: 'A valid email address is required so support can respond to your request.',
      });
    }

    const ticket = new SupportTicket({
      user: isAuth ? req.user._id : null,
      guestEmail: !isAuth ? guestEmail.trim().toLowerCase() : undefined,
      guestName: !isAuth ? (guestName ? guestName.trim() : 'Guest') : undefined,
      category,
      subject: subject.trim(),
      priority: ['low', 'medium', 'high', 'urgent'].includes(priority) ? priority : 'medium',
      messages: [
        {
          sender: 'user',
          senderUser: isAuth ? req.user._id : null,
          text: message.trim(),
          createdAt: new Date(),
        },
      ],
      lastActivityAt: new Date(),
    });

    await ticket.save();

    res.status(201).json({
      success: true,
      message: 'Thank you for contacting Kapu-LK Support. Your request has been received. An administrator will respond as soon as possible.',
      ticketNumber: ticket.ticketNumber,
      ticket,
    });
  } catch (error) {
    console.error('Error creating support ticket:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit support ticket. Please try again.',
      error: error.message,
    });
  }
};

/**
 * @desc    Get tickets submitted by current logged-in user
 * @route   GET /api/support/my-tickets
 * @access  Private
 */
exports.getMyTickets = async (req, res) => {
  try {
    const tickets = await SupportTicket.find({ user: req.user._id })
      .sort({ lastActivityAt: -1 })
      .select('-adminNotes');

    res.json({
      success: true,
      tickets,
    });
  } catch (error) {
    console.error('Error fetching user tickets:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to load tickets',
    });
  }
};

/**
 * @desc    Get ticket by ID or ticketNumber
 * @route   GET /api/support/tickets/:id
 * @access  Private / Admin
 */
exports.getTicketById = async (req, res) => {
  try {
    const { id } = req.params;
    let query;
    if (mongoose.Types.ObjectId.isValid(id)) {
      query = { _id: id };
    } else {
      query = { ticketNumber: id };
    }

    const ticket = await SupportTicket.findOne(query)
      .populate('user', 'name email avatar role')
      .populate('messages.senderUser', 'name avatar role');

    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }

    // Access control: only owner or admin can view
    const isOwner = req.user && ticket.user && ticket.user._id.toString() === req.user._id.toString();
    const isAdmin = req.user && req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Access denied to this ticket' });
    }

    // Hide adminNotes for non-admin
    if (!isAdmin) {
      ticket.adminNotes = undefined;
    }

    res.json({
      success: true,
      ticket,
    });
  } catch (error) {
    console.error('Error getting ticket by ID:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching ticket details',
    });
  }
};

/**
 * @desc    User adds a reply to their ticket
 * @route   POST /api/support/tickets/:id/reply
 * @access  Private
 */
exports.addUserReply = async (req, res) => {
  try {
    const { id } = req.params;
    const { text } = req.body;

    if (!text || text.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Message text cannot be empty' });
    }

    const ticket = await SupportTicket.findById(id);
    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }

    // Only owner can reply here
    if (!ticket.user || ticket.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to reply to this ticket' });
    }

    ticket.messages.push({
      sender: 'user',
      senderUser: req.user._id,
      text: text.trim(),
      createdAt: new Date(),
    });

    // Reopen ticket if resolved or closed
    if (ticket.status === 'resolved' || ticket.status === 'closed') {
      ticket.status = 'in_progress';
    }

    ticket.lastActivityAt = new Date();
    await ticket.save();

    res.json({
      success: true,
      message: 'Reply sent successfully',
      ticket,
    });
  } catch (error) {
    console.error('Error adding user ticket reply:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send reply',
    });
  }
};

/**
 * @desc    Admin: get list of all tickets with filters
 * @route   GET /api/support/admin/tickets
 * @access  Private / Admin
 */
exports.getAdminTickets = async (req, res) => {
  try {
    const { status, category, search, page = 1, limit = 50 } = req.query;

    const filter = {};
    if (status && status !== 'all') {
      filter.status = status;
    }
    if (category && category !== 'all') {
      filter.category = category;
    }

    if (search && search.trim()) {
      const safeSearch = search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const sRegex = new RegExp(safeSearch, 'i');
      filter.$or = mongoose.trusted([
        { ticketNumber: sRegex },
        { subject: sRegex },
        { guestEmail: sRegex },
        { guestName: sRegex },
      ]);
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const total = await SupportTicket.countDocuments(filter);
    const tickets = await SupportTicket.find(filter)
      .populate('user', 'name email avatar role isApproved')
      .populate('assignedTo', 'name email')
      .sort({ lastActivityAt: -1 })
      .skip(skip)
      .limit(parseInt(limit, 10));

    // Also get status counts for fast UI tabs
    const statusCounts = {
      all: await SupportTicket.countDocuments({}),
      open: await SupportTicket.countDocuments({ status: 'open' }),
      in_progress: await SupportTicket.countDocuments({ status: 'in_progress' }),
      resolved: await SupportTicket.countDocuments({ status: 'resolved' }),
      closed: await SupportTicket.countDocuments({ status: 'closed' }),
    };

    res.json({
      success: true,
      total,
      page: parseInt(page, 10),
      totalPages: Math.ceil(total / limit),
      statusCounts,
      tickets,
    });
  } catch (error) {
    console.error('Error in getAdminTickets:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch admin tickets',
    });
  }
};

/**
 * @desc    Admin: reply to ticket and notify user
 * @route   POST /api/support/admin/tickets/:id/reply
 * @access  Private / Admin
 */
exports.addAdminReply = async (req, res) => {
  try {
    const { id } = req.params;
    const { text, status } = req.body;

    if (!text || text.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Reply text cannot be empty' });
    }

    const ticket = await SupportTicket.findById(id).populate('user', 'name email');
    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }

    ticket.messages.push({
      sender: 'admin',
      senderUser: req.user._id,
      text: text.trim(),
      createdAt: new Date(),
    });

    if (status && ['open', 'in_progress', 'resolved', 'closed'].includes(status)) {
      ticket.status = status;
    } else if (ticket.status === 'open') {
      ticket.status = 'in_progress';
    }

    if (ticket.status === 'resolved') {
      ticket.resolvedAt = ticket.resolvedAt || new Date();
      ticket.resolvedBy = req.user._id;
    } else {
      ticket.resolvedAt = undefined;
      ticket.resolvedBy = undefined;
    }

    ticket.lastActivityAt = new Date();
    await ticket.save();

    // Create Notification if ticket owner is a registered user
    if (ticket.user) {
      try {
        const preview = text.trim().length > 70 ? text.trim().substring(0, 67) + '...' : text.trim();
        await Notification.create({
          user: ticket.user._id || ticket.user,
          type: 'support_reply',
          message: `Support Team replied to Ticket #${ticket.ticketNumber}: "${preview}"`,
        });
      } catch (notifErr) {
        console.warn('Failed to send notification for support reply:', notifErr.message);
      }
    }

    res.json({
      success: true,
      message: 'Admin reply posted successfully',
      ticket,
    });
  } catch (error) {
    console.error('Error posting admin reply:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to post admin reply',
    });
  }
};

/**
 * @desc    Admin: update ticket status / notes / priority
 * @route   PUT /api/support/admin/tickets/:id
 * @access  Private / Admin
 */
exports.updateTicketStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, priority, adminNotes, assignedTo } = req.body;

    const ticket = await SupportTicket.findById(id);
    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }

    if (status && ['open', 'in_progress', 'resolved', 'closed'].includes(status)) {
      ticket.status = status;
    }
    if (priority && ['low', 'medium', 'high', 'urgent'].includes(priority)) {
      ticket.priority = priority;
    }
    if (adminNotes !== undefined) {
      ticket.adminNotes = adminNotes;
    }
    if (assignedTo !== undefined) {
      ticket.assignedTo = assignedTo || null;
    }

    if (ticket.status === 'resolved') {
      ticket.resolvedAt = ticket.resolvedAt || new Date();
      ticket.resolvedBy = req.user._id;
    } else {
      ticket.resolvedAt = undefined;
      ticket.resolvedBy = undefined;
    }

    ticket.lastActivityAt = new Date();
    await ticket.save();

    res.json({
      success: true,
      message: 'Ticket updated successfully',
      ticket,
    });
  } catch (error) {
    console.error('Error updating ticket:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update ticket',
    });
  }
};
