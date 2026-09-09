const Event = require('../models/Event');
const User = require('../models/User');
const { UserStats } = require('../models/Achievement');

// @desc    Get all events
// @route   GET /api/events
// @access  Public
exports.getEvents = async (req, res) => {
  try {
    const { featured, upcoming, eventType, location } = req.query;
    
    const query = { isPublished: true };
    
    if (featured === 'true') {
      query.isFeatured = true;
    }
    
    if (upcoming === 'true') {
      query.startDate = { $gte: new Date() };
    }
    
    if (eventType) {
      query.eventType = eventType;
    }
    
    if (location) {
      query['location.city'] = new RegExp(location, 'i');
    }

    const events = await Event.find(query)
      .populate('organizer', 'name profileImageUrl')
      .sort({ startDate: 1 })
      .limit(50);

    res.json(events);
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ message: 'Failed to fetch events' });
  }
};

// @desc    Get single event
// @route   GET /api/events/:id
// @access  Public
exports.getEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('organizer', 'name profileImageUrl')
      .populate('attendees.user', 'name profileImageUrl');

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    res.json(event);
  } catch (error) {
    console.error('Error fetching event:', error);
    res.status(500).json({ message: 'Failed to fetch event' });
  }
};

// @desc    Create event
// @route   POST /api/events
// @access  Private
exports.createEvent = async (req, res) => {
  try {
    const eventData = req.body;
    eventData.organizer = req.user._id;

    const event = await Event.create(eventData);

    const populatedEvent = await Event.findById(event._id)
      .populate('organizer', 'name profileImageUrl');

    res.status(201).json(populatedEvent);
  } catch (error) {
    console.error('Error creating event:', error);
    res.status(500).json({ message: 'Failed to create event' });
  }
};

// @desc    Update event
// @route   PUT /api/events/:id
// @access  Private
exports.updateEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Check if user is organizer or admin
    if (event.organizer.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const { title, description, eventType, date, location, maxAttendees, isVirtual, meetingLink, coverImage } = req.body;
    const allowedUpdates = {};
    if (title !== undefined) allowedUpdates.title = String(title).trim();
    if (description !== undefined) allowedUpdates.description = description;
    if (eventType !== undefined) allowedUpdates.eventType = eventType;
    if (date !== undefined) allowedUpdates.date = date;
    if (location !== undefined) allowedUpdates.location = location;
    if (maxAttendees !== undefined) allowedUpdates.maxAttendees = Number(maxAttendees);
    if (isVirtual !== undefined) allowedUpdates.isVirtual = !!isVirtual;
    if (meetingLink !== undefined) allowedUpdates.meetingLink = meetingLink;
    if (coverImage !== undefined) allowedUpdates.coverImage = coverImage;

    const updatedEvent = await Event.findByIdAndUpdate(
      req.params.id,
      { $set: allowedUpdates },
      { new: true }
    ).populate('organizer', 'name profileImageUrl');

    res.json(updatedEvent);
  } catch (error) {
    console.error('Error updating event:', error);
    res.status(500).json({ message: 'Failed to update event' });
  }
};

// @desc    RSVP to event
// @route   POST /api/events/:id/rsvp
// @access  Private
exports.rsvpEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const userId = req.user._id;

    // Check if already RSVP'd
    const existingAttendee = event.attendees.find(
      a => a.user.toString() === userId.toString()
    );

    if (existingAttendee) {
      // Cancel RSVP
      event.attendees = event.attendees.filter(
        a => a.user.toString() !== userId.toString()
      );
      event.currentAttendees = Math.max(0, event.currentAttendees - 1);
    } else {
      // Check if event is full
      if (event.maxAttendees && event.currentAttendees >= event.maxAttendees) {
        return res.status(400).json({ message: 'Event is full' });
      }

      // Add attendee
      event.attendees.push({
        user: userId,
        status: 'registered'
      });
      event.currentAttendees += 1;
    }

    await event.save();

    const populatedEvent = await Event.findById(req.params.id)
      .populate('organizer', 'name profileImageUrl')
      .populate('attendees.user', 'name profileImageUrl');

    res.json({
      rsvped: !existingAttendee,
      event: populatedEvent
    });
  } catch (error) {
    console.error('Error RSVPing to event:', error);
    res.status(500).json({ message: 'Failed to RSVP to event' });
  }
};

// @desc    Mark event as attended
// @route   POST /api/events/:id/attend
// @access  Private
exports.markAttended = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const userId = req.user._id;
    const attendee = event.attendees.find(
      a => a.user.toString() === userId.toString()
    );

    if (!attendee) {
      return res.status(400).json({ message: 'Not registered for this event' });
    }

    attendee.status = 'attended';
    await event.save();

    // Update user stats
    let userStats = await UserStats.findOne({ user: userId });
    if (!userStats) {
      userStats = new UserStats({ user: userId });
    }
    userStats.totalEventsAttended += 1;
    userStats.points += 20; // Bonus for attending event
    await userStats.save();

    res.json({ message: 'Marked as attended' });
  } catch (error) {
    console.error('Error marking attendance:', error);
    res.status(500).json({ message: 'Failed to mark attendance' });
  }
};

// @desc    Like event
// @route   POST /api/events/:id/like
// @access  Private
exports.likeEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const userId = req.user._id;
    const alreadyLiked = event.likes.includes(userId);

    if (alreadyLiked) {
      event.likes = event.likes.filter(id => id.toString() !== userId.toString());
      event.likeCount = Math.max(0, event.likeCount - 1);
    } else {
      event.likes.push(userId);
      event.likeCount += 1;
    }

    await event.save();

    res.json({
      liked: !alreadyLiked,
      likeCount: event.likeCount
    });
  } catch (error) {
    console.error('Error liking event:', error);
    res.status(500).json({ message: 'Failed to like event' });
  }
};

// @desc    Delete event
// @route   DELETE /api/events/:id
// @access  Private
exports.deleteEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Check if user is organizer or admin
    if (event.organizer.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    await Event.findByIdAndDelete(req.params.id);
    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Error deleting event:', error);
    res.status(500).json({ message: 'Failed to delete event' });
  }
};
