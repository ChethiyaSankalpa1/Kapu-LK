const express = require('express');
const router = express.Router();
const {
  getEvents,
  getEvent,
  createEvent,
  updateEvent,
  rsvpEvent,
  markAttended,
  likeEvent,
  deleteEvent
} = require('../controllers/eventController');
const { protect, admin } = require('../middleware/auth');

router.route('/').get(getEvents).post(protect, createEvent);
router.route('/:id').get(getEvent).put(protect, updateEvent).delete(protect, deleteEvent);
router.route('/:id/rsvp').post(protect, rsvpEvent);
router.route('/:id/attend').post(protect, markAttended);
router.route('/:id/like').post(protect, likeEvent);

module.exports = router;
