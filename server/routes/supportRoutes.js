const express = require('express');
const router = express.Router();
const {
  createTicket,
  getMyTickets,
  getTicketById,
  addUserReply,
  getAdminTickets,
  addAdminReply,
  updateTicketStatus,
} = require('../controllers/supportController');
const { protect, admin, optionalProtect } = require('../middleware/auth');
const { supportLimiter } = require('../middleware/rateLimiters');

// Public / User routes
router.post('/tickets', supportLimiter, optionalProtect, createTicket);
router.get('/my-tickets', protect, getMyTickets);
router.get('/tickets/:id', protect, getTicketById);
router.post('/tickets/:id/reply', protect, addUserReply);

// Admin routes
router.get('/admin/tickets', protect, admin, getAdminTickets);
router.post('/admin/tickets/:id/reply', protect, admin, addAdminReply);
router.put('/admin/tickets/:id', protect, admin, updateTicketStatus);

module.exports = router;
