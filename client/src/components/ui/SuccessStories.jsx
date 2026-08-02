import React, { useState, useEffect } from 'react';
import { successStoryAPI } from '../../services/api';
import { Heart, Calendar, Share2, Plus } from 'lucide-react';
import { toast } from 'react-toastify';
import moment from 'moment';

const SuccessStories = () => {
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showSubmitForm, setShowSubmitForm] = useState(false);
  const [formData, setFormData] = useState({
    coupleName: '',
    user1Id: '',
    user2Id: '',
    story: '',
    photos: [],
    weddingDate: '',
    howWeMet: '',
    advice: ''
  });

  useEffect(() => {
    fetchStories();
  }, []);

  const fetchStories = async () => {
    setLoading(true);
    try {
      const response = await successStoryAPI.getSuccessStories();
      setStories(response.data);
    } catch (error) {
      console.error('Error fetching success stories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (storyId) => {
    try {
      await successStoryAPI.likeSuccessStory(storyId);
      setStories(prev => prev.map(s => 
        s._id === storyId 
          ? { ...s, likeCount: s.likeCount + (s.liked ? -1 : 1), liked: !s.liked }
          : s
      ));
    } catch (error) {
      toast.error('Failed to like story');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await successStoryAPI.createSuccessStory(formData);
      toast.success('Success story submitted for review!');
      setShowSubmitForm(false);
      setFormData({
        coupleName: '',
        user1Id: '',
        user2Id: '',
        story: '',
        photos: [],
        weddingDate: '',
        howWeMet: '',
        advice: ''
      });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit story');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Success Stories</h2>
          <p className="text-gray-600 dark:text-gray-400">Real couples who found love on Kapu LK</p>
        </div>
        <button
          onClick={() => setShowSubmitForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition"
        >
          <Plus className="w-4 h-4" />
          Share Your Story
        </button>
      </div>

      {/* Stories Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stories.map((story) => (
          <div
            key={story._id}
            className="bg-white dark:bg-slate-800 rounded-2xl overflow-hidden shadow-sm border border-gray-200 dark:border-slate-700"
          >
            {story.photos && story.photos.length > 0 && (
              <img
                src={story.photos[0]}
                alt={story.coupleName}
                className="w-full h-48 object-cover"
              />
            )}
            <div className="p-5">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                {story.coupleName}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 line-clamp-3">
                {story.story}
              </p>
              
              {story.weddingDate && (
                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-3">
                  <Calendar className="w-3 h-3" />
                  Married {moment(story.weddingDate).format('MMMM D, YYYY')}
                </div>
              )}

              {story.howWeMet && (
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-4 italic">
                  "{story.howWeMet}"
                </div>
              )}

              <div className="flex items-center justify-between">
                <button
                  onClick={() => handleLike(story._id)}
                  className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 hover:text-red-500 transition"
                >
                  <Heart className={`w-4 h-4 ${story.liked ? 'fill-red-500 text-red-500' : ''}`} />
                  {story.likeCount || 0}
                </button>
                <button className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 hover:text-purple-500 transition">
                  <Share2 className="w-4 h-4" />
                  Share
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {stories.length === 0 && (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          <Heart className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No success stories yet. Be the first to share yours!</p>
        </div>
      )}

      {/* Submit Form Modal */}
      {showSubmitForm && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Share Your Success Story</h2>
                <button
                  onClick={() => setShowSubmitForm(false)}
                  className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700"
                >
                  <Plus className="w-5 h-5 rotate-45" />
                </button>
              </div>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label htmlFor="story-couplename-input" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Couple Name
                </label>
                <input
                  id="story-couplename-input"
                  name="coupleName"
                  type="text"
                  required
                  autoComplete="off"
                  value={formData.coupleName}
                  onChange={(e) => setFormData({ ...formData, coupleName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg"
                />
              </div>
              <div>
                <label htmlFor="story-content-input" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Your Story
                </label>
                <textarea
                  id="story-content-input"
                  name="story"
                  required
                  autoComplete="off"
                  value={formData.story}
                  onChange={(e) => setFormData({ ...formData, story: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg"
                  rows={4}
                  maxLength={5000}
                />
              </div>
              <div>
                <label htmlFor="story-howwemet-input" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  How You Met
                </label>
                <textarea
                  id="story-howwemet-input"
                  name="howWeMet"
                  autoComplete="off"
                  value={formData.howWeMet}
                  onChange={(e) => setFormData({ ...formData, howWeMet: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg"
                  rows={2}
                  maxLength={1000}
                />
              </div>
              <div>
                <label htmlFor="story-weddingdate-input" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Wedding Date (optional)
                </label>
                <input
                  id="story-weddingdate-input"
                  name="weddingDate"
                  type="date"
                  autoComplete="off"
                  value={formData.weddingDate}
                  onChange={(e) => setFormData({ ...formData, weddingDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg"
                />
              </div>
              <div>
                <label htmlFor="story-advice-input" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Advice for Others
                </label>
                <textarea
                  id="story-advice-input"
                  name="advice"
                  autoComplete="off"
                  value={formData.advice}
                  onChange={(e) => setFormData({ ...formData, advice: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg"
                  rows={2}
                  maxLength={500}
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowSubmitForm(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700"
                >
                  Submit Story
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuccessStories;
