import React, { useState, useEffect } from 'react';
import { eventAPI } from '../../services/api';
import { Calendar, MapPin, Users, Heart, Share2, Plus, Check, X } from 'lucide-react';
import { toast } from 'react-toastify';
import moment from 'moment';
import ProfileAvatar from './ProfileAvatar';

const Events = ({ isAdmin = false }) => {
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    eventType: 'meetup',
    date: '',
    time: '',
    location: '',
    city: '',
    maxAttendees: '',
    coverImage: ''
  });

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const response = await eventAPI.getEvents({ published: true });
      setEvents(response.data);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRSVP = async (eventId) => {
    try {
      await eventAPI.rsvpEvent(eventId);
      toast.success('RSVP successful!');
      fetchEvents();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to RSVP');
    }
  };

  const handleLike = async (eventId) => {
    try {
      await eventAPI.likeEvent(eventId);
      setEvents(prev => prev.map(e => 
        e._id === eventId 
          ? { ...e, likeCount: e.likeCount + (e.liked ? -1 : 1), liked: !e.liked }
          : e
      ));
    } catch (error) {
      toast.error('Failed to like event');
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const start = formData.date ? new Date(`${formData.date}T${formData.time || '10:00'}:00`) : new Date();
      const end = new Date(start.getTime() + 3 * 60 * 60 * 1000);
      await eventAPI.createEvent({
        title: formData.title,
        description: formData.description,
        eventType: formData.eventType,
        startDate: start,
        endDate: end,
        location: {
          type: formData.eventType === 'webinar' ? 'online' : 'physical',
          address: formData.location,
          city: formData.city,
          country: 'Sri Lanka'
        },
        coverImage: formData.coverImage,
        maxAttendees: formData.maxAttendees ? parseInt(formData.maxAttendees) : null,
        isPublished: true
      });
      toast.success('Event created!');
      setShowCreateForm(false);
      setFormData({
        title: '',
        description: '',
        eventType: 'meetup',
        date: '',
        time: '',
        location: '',
        city: '',
        maxAttendees: '',
        coverImage: ''
      });
      fetchEvents();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create event');
    }
  };

  const handleDelete = async (eventId) => {
    if (!window.confirm('Are you sure you want to delete this event?')) return;
    try {
      await eventAPI.deleteEvent(eventId);
      toast.success('Event deleted!');
      fetchEvents();
      if (selectedEvent?._id === eventId) setSelectedEvent(null);
    } catch (error) {
      toast.error('Failed to delete event');
    }
  };

  const isEventPast = (event) => {
    const d = event.startDate || event.date;
    return d ? moment(d).isBefore(moment(), 'day') : false;
  };

  const isEventFull = (event) => {
    return event.maxAttendees && event.attendees?.length >= event.maxAttendees;
  };

  const getEventLocation = (event) => {
    if (!event) return '';
    if (typeof event.location === 'object' && event.location !== null) {
      return event.location.address || event.location.meetingLink || event.location.type || '';
    }
    return event.location || '';
  };

  const getEventCity = (event) => {
    if (!event) return '';
    if (typeof event.location === 'object' && event.location !== null) {
      return event.location.city || '';
    }
    return event.city || '';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500" />
      </div>
    );
  }

  if (selectedEvent) {
    const eventDateStr = selectedEvent.startDate || selectedEvent.date;
    const eventTimeStr = selectedEvent.startDate ? moment(selectedEvent.startDate).format('h:mm A') : (selectedEvent.time || 'Time TBD');
    return (
      <div className="space-y-6">
        <button
          onClick={() => setSelectedEvent(null)}
          className="text-purple-600 hover:text-purple-700 font-medium"
        >
          ← Back to Events
        </button>

        <div className="bg-white dark:bg-slate-800 rounded-2xl overflow-hidden shadow-sm border border-gray-200 dark:border-slate-700">
          {selectedEvent.coverImage && (
            <img
              src={selectedEvent.coverImage}
              alt={selectedEvent.title}
              className="w-full h-64 md:h-96 object-cover"
            />
          )}
          <div className="p-6 md:p-8">
            <div className="flex items-center gap-2 mb-3">
              <span className="px-3 py-1 bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300 rounded-full text-sm font-medium capitalize">
                {selectedEvent.eventType}
              </span>
              {selectedEvent.isFeatured && (
                <span className="px-3 py-1 bg-yellow-100 dark:bg-yellow-500/20 text-yellow-700 dark:text-yellow-300 rounded-full text-sm font-medium">
                  Featured
                </span>
              )}
            </div>

            <h1 className="text-2xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              {selectedEvent.title}
            </h1>

            <div className="grid md:grid-cols-2 gap-4 mb-6">
              <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
                <Calendar className="w-5 h-5 text-purple-500" />
                <div>
                  <p className="font-medium">{moment(eventDateStr).format('MMMM D, YYYY')}</p>
                  <p className="text-sm">{eventTimeStr}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
                <MapPin className="w-5 h-5 text-purple-500" />
                <div>
                  <p className="font-medium">{getEventLocation(selectedEvent)}</p>
                  <p className="text-sm">{getEventCity(selectedEvent)}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 mb-6 text-sm text-gray-500 dark:text-gray-400">
              <div className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                {selectedEvent.attendees?.length || 0} attending
              </div>
              {selectedEvent.maxAttendees && (
                <div className="flex items-center gap-1">
                  <span>•</span>
                  <span>{selectedEvent.maxAttendees} max capacity</span>
                </div>
              )}
              <div className="flex items-center gap-1">
                <Heart className="w-4 h-4" />
                {selectedEvent.likeCount || 0} likes
              </div>
            </div>

            <div className="prose dark:prose-invert max-w-none mb-6">
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line">
                {selectedEvent.description}
              </p>
            </div>

            <div className="flex items-center gap-3 pt-6 border-t border-gray-200 dark:border-slate-700">
              {!isEventPast(selectedEvent) && !isEventFull(selectedEvent) && !selectedEvent.hasRSVPed && (
                <button
                  onClick={() => handleRSVP(selectedEvent._id)}
                  className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:from-purple-700 hover:to-pink-700 transition"
                >
                  RSVP Now
                </button>
              )}
              {selectedEvent.hasRSVPed && (
                <div className="flex items-center gap-2 px-4 py-2 bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400 rounded-xl">
                  <Check className="w-4 h-4" />
                  You're attending
                </div>
              )}
              {isEventFull(selectedEvent) && (
                <div className="flex items-center gap-2 px-4 py-2 bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400 rounded-xl">
                  <X className="w-4 h-4" />
                  Event Full
                </div>
              )}
              <button
                onClick={() => handleLike(selectedEvent._id)}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700 transition"
              >
                <Heart className={`w-4 h-4 ${selectedEvent.liked ? 'fill-red-500 text-red-500' : ''}`} />
                {selectedEvent.likeCount || 0}
              </button>
              <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700 transition">
                <Share2 className="w-4 h-4" />
                Share
              </button>
              {isAdmin && (
                <button
                  onClick={() => handleDelete(selectedEvent._id)}
                  className="ml-auto px-4 py-2 bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400 rounded-xl hover:bg-red-200 dark:hover:bg-red-500/30 transition"
                >
                  Delete
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Attendees Section */}
        {selectedEvent.attendees && selectedEvent.attendees.length > 0 && (
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-gray-200 dark:border-slate-700">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Attendees</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {selectedEvent.attendees.map((attendee, idx) => (
                <div key={idx} className="flex flex-col items-center text-center">
                  <ProfileAvatar user={{ ...(attendee.user || attendee), profileImageUrl: attendee.user?.profileImageUrl || attendee.profileImageUrl }} className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-500/20 mb-2" avatarClassName="text-3xl" fallbackClassName="font-semibold text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-500/20" />
                  <span className="text-sm text-gray-700 dark:text-gray-300 truncate w-full">
                    {attendee.user?.name || attendee.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Events</h2>
          <p className="text-gray-600 dark:text-gray-400">Meetups, workshops, and social gatherings</p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowCreateForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition"
          >
            <Plus className="w-4 h-4" />
            Create Event
          </button>
        )}
      </div>

      {/* Events Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {events.map((event) => {
          const cardDate = event.startDate || event.date;
          const cardCity = getEventCity(event);
          return (
            <div
              key={event._id}
              onClick={() => setSelectedEvent(event)}
              className="bg-white dark:bg-slate-800 rounded-2xl overflow-hidden shadow-sm border border-gray-200 dark:border-slate-700 cursor-pointer hover:shadow-md transition"
            >
              {event.coverImage && (
                <img
                  src={event.coverImage}
                  alt={event.title}
                  className="w-full h-48 object-cover"
                />
              )}
              <div className="p-5">
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2 py-1 bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300 rounded-full text-xs font-medium capitalize">
                    {event.eventType}
                  </span>
                  {isEventPast(event) && (
                    <span className="px-2 py-1 bg-gray-100 dark:bg-gray-500/20 text-gray-700 dark:text-gray-400 rounded-full text-xs">
                      Past
                    </span>
                  )}
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 line-clamp-2">
                  {event.title}
                </h3>
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                    <Calendar className="w-4 h-4" />
                    {moment(cardDate).format('MMM D, YYYY')}
                  </div>
                  {cardCity && (
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                      <MapPin className="w-4 h-4" />
                      {cardCity}
                    </div>
                  )}
                </div>
                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                  <div className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {event.attendees?.length || event.currentAttendees || 0} going
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                      <Heart className="w-3 h-3" />
                      {event.likeCount || 0}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {events.length === 0 && (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No events scheduled yet. Check back soon!</p>
        </div>
      )}

      {/* Create Event Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Create Event</h2>
                <button
                  onClick={() => setShowCreateForm(false)}
                  className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div>
                <label htmlFor="event-title-input" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Event Title
                </label>
                <input
                  id="event-title-input"
                  name="title"
                  type="text"
                  required
                  autoComplete="off"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg"
                />
              </div>
              <div>
                <label htmlFor="event-type-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Event Type
                </label>
                <select
                  id="event-type-select"
                  name="eventType"
                  value={formData.eventType}
                  onChange={(e) => setFormData({ ...formData, eventType: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg"
                >
                  <option value="meetup">Meetup</option>
                  <option value="workshop">Workshop</option>
                  <option value="social">Social Gathering</option>
                  <option value="webinar">Webinar</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="event-date-input" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Date
                  </label>
                  <input
                    id="event-date-input"
                    name="date"
                    type="date"
                    required
                    autoComplete="off"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg"
                  />
                </div>
                <div>
                  <label htmlFor="event-time-input" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Time
                  </label>
                  <input
                    id="event-time-input"
                    name="time"
                    type="time"
                    autoComplete="off"
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="event-location-input" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Location
                </label>
                <input
                  id="event-location-input"
                  name="location"
                  type="text"
                  required
                  autoComplete="off"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg"
                  placeholder="Venue name or address"
                />
              </div>
              <div>
                <label htmlFor="event-city-input" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  City
                </label>
                <input
                  id="event-city-input"
                  name="city"
                  type="text"
                  required
                  autoComplete="off"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg"
                />
              </div>
              <div>
                <label htmlFor="event-maxattendees-input" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Max Attendees (optional)
                </label>
                <input
                  id="event-maxattendees-input"
                  name="maxAttendees"
                  type="number"
                  autoComplete="off"
                  value={formData.maxAttendees}
                  onChange={(e) => setFormData({ ...formData, maxAttendees: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg"
                  placeholder="Leave empty for unlimited"
                />
              </div>
              <div>
                <label htmlFor="event-description-input" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                  id="event-description-input"
                  name="description"
                  required
                  autoComplete="off"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg"
                  rows={4}
                  maxLength={5000}
                />
              </div>
              <div>
                <label htmlFor="event-coverimage-input" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Cover Image URL
                </label>
                <input
                  id="event-coverimage-input"
                  name="coverImage"
                  type="url"
                  autoComplete="off"
                  value={formData.coverImage}
                  onChange={(e) => setFormData({ ...formData, coverImage: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700"
                >
                  Create Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Events;
