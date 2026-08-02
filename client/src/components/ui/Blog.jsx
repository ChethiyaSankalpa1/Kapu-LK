import React, { useState, useEffect } from 'react';
import { blogAPI } from '../../services/api';
import { Calendar, Heart, MessageCircle, Share2, Plus, Eye } from 'lucide-react';
import { toast } from 'react-toastify';
import moment from 'moment';

const Blog = ({ isAdmin = false }) => {
  const [posts, setPosts] = useState([]);
  const [selectedPost, setSelectedPost] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [editorMode, setEditorMode] = useState('create'); // create or edit
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: 'dating',
    tags: '',
    coverImage: ''
  });

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const response = await blogAPI.getBlogPosts({ published: true });
      setPosts(response.data);
    } catch (error) {
      console.error('Error fetching blog posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (postId) => {
    try {
      await blogAPI.likeBlogPost(postId);
      setPosts(prev => prev.map(p => 
        p._id === postId 
          ? { ...p, likeCount: p.likeCount + (p.liked ? -1 : 1), liked: !p.liked }
          : p
      ));
    } catch (error) {
      toast.error('Failed to like post');
    }
  };

  const handleAddComment = async (postId, content) => {
    try {
      await blogAPI.addComment(postId, content);
      toast.success('Comment added!');
      if (selectedPost?._id === postId) {
        const response = await blogAPI.getBlogPost(selectedPost.slug);
        setSelectedPost(response.data);
      }
    } catch (error) {
      toast.error('Failed to add comment');
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const slug = formData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') || `post-${Date.now()}`;
      await blogAPI.createBlogPost({
        ...formData,
        slug,
        coverImage: formData.coverImage,
        tags: formData.tags.split(',').map(t => t.trim()).filter(t => t)
      });
      toast.success('Blog post created!');
      setShowEditor(false);
      setFormData({ title: '', content: '', category: 'dating', tags: '', coverImage: '' });
      fetchPosts();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create post');
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await blogAPI.updateBlogPost(selectedPost._id, {
        ...formData,
        coverImage: formData.coverImage,
        tags: formData.tags.split(',').map(t => t.trim()).filter(t => t)
      });
      toast.success('Blog post updated!');
      setShowEditor(false);
      setFormData({ title: '', content: '', category: 'dating', tags: '', coverImage: '' });
      fetchPosts();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update post');
    }
  };

// Removed unused handlePublish function

  const handleDelete = async (postId) => {
    if (!window.confirm('Are you sure you want to delete this post?')) return;
    try {
      await blogAPI.deleteBlogPost(postId);
      toast.success('Post deleted!');
      fetchPosts();
      if (selectedPost?._id === postId) setSelectedPost(null);
    } catch (error) {
      toast.error('Failed to delete post');
    }
  };

  const openEditor = (post = null) => {
    if (post) {
      setEditorMode('edit');
      setFormData({
        title: post.title,
        content: post.content,
        category: post.category || 'dating',
        tags: post.tags?.join(', ') || '',
        coverImage: post.coverImage || post.featuredImage || ''
      });
    } else {
      setEditorMode('create');
      setFormData({ title: '', content: '', category: 'dating', tags: '', coverImage: '' });
    }
    setShowEditor(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500" />
      </div>
    );
  }

  if (selectedPost) {
    const postImg = selectedPost.coverImage || selectedPost.featuredImage;
    return (
      <div className="space-y-6">
        <button
          onClick={() => setSelectedPost(null)}
          className="text-purple-600 hover:text-purple-700 font-medium"
        >
          ← Back to Blog
        </button>

        <article className="bg-white dark:bg-slate-800 rounded-2xl overflow-hidden shadow-sm border border-gray-200 dark:border-slate-700">
          {postImg && (
            <img
              src={postImg}
              alt={selectedPost.title}
              className="w-full h-64 md:h-96 object-cover"
            />
          )}
          <div className="p-6 md:p-8">
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-3">
              <Calendar className="w-4 h-4" />
              {moment(selectedPost.createdAt).format('MMMM D, YYYY')}
              <span className="mx-2">•</span>
              <Clock className="w-4 h-4" />
              {selectedPost.readTime || '5 min read'}
            </div>

            <h1 className="text-2xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              {selectedPost.title}
            </h1>

            {selectedPost.category && (
              <span className="inline-block px-3 py-1 bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300 rounded-full text-sm mb-4">
                {selectedPost.category}
              </span>
            )}

            {selectedPost.tags && selectedPost.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {selectedPost.tags.map((tag, idx) => (
                  <span key={idx} className="text-sm text-gray-500 dark:text-gray-400">
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            <div className="prose dark:prose-invert max-w-none mb-6">
              {selectedPost.content.split('\n').map((paragraph, idx) => (
                <p key={idx} className="mb-4 text-gray-700 dark:text-gray-300 leading-relaxed">
                  {paragraph}
                </p>
              ))}
            </div>

            <div className="flex items-center justify-between pt-6 border-t border-gray-200 dark:border-slate-700">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => handleLike(selectedPost._id)}
                  className="flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-red-500 transition"
                >
                  <Heart className={`w-5 h-5 ${selectedPost.liked ? 'fill-red-500 text-red-500' : ''}`} />
                  {selectedPost.likeCount || 0}
                </button>
                <button className="flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-purple-500 transition">
                  <Share2 className="w-5 h-5" />
                  Share
                </button>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                <Eye className="w-4 h-4" />
                {selectedPost.viewCount || 0} views
              </div>
            </div>
          </div>
        </article>

        {/* Comments Section */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-gray-200 dark:border-slate-700">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Comments</h3>
          
          <div className="mb-6">
            <label htmlFor="blog-comment-input" className="sr-only">Add a comment</label>
            <textarea
              id="blog-comment-input"
              name="comment"
              autoComplete="off"
              placeholder="Add a comment..."
              className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg resize-none"
              rows={3}
            />
            <button
              onClick={() => {
                const input = document.getElementById('blog-comment-input');
                if (input && input.value.trim()) {
                  handleAddComment(selectedPost._id, input.value.trim());
                  input.value = '';
                }
              }}
              className="mt-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
            >
              Post Comment
            </button>
          </div>

          {selectedPost.comments && selectedPost.comments.length > 0 ? (
            <div className="space-y-4">
              {selectedPost.comments.map((comment, idx) => (
                <div key={idx} className="flex gap-3">
                  <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-500/20 flex items-center justify-center shrink-0">
                    <span className="text-purple-600 dark:text-purple-400 font-semibold">
                      {comment.user?.name?.charAt(0) || 'U'}
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-gray-900 dark:text-white">
                        {comment.user?.name || 'Anonymous'}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {moment(comment.createdAt).fromNow()}
                      </span>
                    </div>
                    <p className="text-gray-700 dark:text-gray-300">{comment.content}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-center py-4">No comments yet. Be the first!</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Blog</h2>
          <p className="text-gray-600 dark:text-gray-400">Relationship advice, tips, and success stories</p>
        </div>
        {isAdmin && (
          <button
            onClick={() => openEditor()}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition"
          >
            <Plus className="w-4 h-4" />
            New Post
          </button>
        )}
      </div>

      {/* Posts Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {posts.map((post) => {
          const cardImg = post.coverImage || post.featuredImage;
          return (
            <div
              key={post._id}
              onClick={() => setSelectedPost(post)}
              className="bg-white dark:bg-slate-800 rounded-2xl overflow-hidden shadow-sm border border-gray-200 dark:border-slate-700 cursor-pointer hover:shadow-md transition"
            >
              {cardImg && (
                <img
                  src={cardImg}
                  alt={post.title}
                  className="w-full h-48 object-cover"
                />
              )}
              <div className="p-5">
                {post.category && (
                  <span className="inline-block px-2 py-1 bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300 rounded-full text-xs mb-2">
                    {post.category}
                  </span>
                )}
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 line-clamp-2">
                  {post.title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 line-clamp-3">
                  {post.content.substring(0, 150)}...
                </p>
                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {moment(post.createdAt).format('MMM D')}
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                      <Heart className="w-3 h-3" />
                      {post.likeCount || 0}
                    </div>
                    <div className="flex items-center gap-1">
                      <MessageCircle className="w-3 h-3" />
                      {post.commentCount || 0}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {posts.length === 0 && (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No blog posts yet. Check back soon!</p>
        </div>
      )}

      {/* Editor Modal */}
      {showEditor && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  {editorMode === 'create' ? 'Create Blog Post' : 'Edit Blog Post'}
                </h2>
                <button
                  onClick={() => setShowEditor(false)}
                  className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700"
                >
                  <Plus className="w-5 h-5 rotate-45" />
                </button>
              </div>
            </div>
            <form onSubmit={editorMode === 'create' ? handleCreate : handleUpdate} className="p-6 space-y-4">
              <div>
                <label htmlFor="blog-title-input" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Title
                </label>
                <input
                  id="blog-title-input"
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
                <label htmlFor="blog-category-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Category
                </label>
                <select
                  id="blog-category-select"
                  name="category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg"
                >
                  <option value="dating">Dating</option>
                  <option value="relationships">Relationships</option>
                  <option value="wedding">Wedding</option>
                  <option value="lifestyle">Lifestyle</option>
                  <option value="advice">Advice</option>
                  <option value="success">Success</option>
                </select>
              </div>
              <div>
                <label htmlFor="blog-content-input" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Content
                </label>
                <textarea
                  id="blog-content-input"
                  name="content"
                  required
                  autoComplete="off"
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg"
                  rows={10}
                  maxLength={10000}
                />
              </div>
              <div>
                <label htmlFor="blog-tags-input" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Tags (comma-separated)
                </label>
                <input
                  id="blog-tags-input"
                  name="tags"
                  type="text"
                  autoComplete="off"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg"
                  placeholder="e.g., dating, relationships, tips"
                />
              </div>
              <div>
                <label htmlFor="blog-coverimage-input" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Cover Image URL
                </label>
                <input
                  id="blog-coverimage-input"
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
                  onClick={() => setShowEditor(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700"
                >
                  {editorMode === 'create' ? 'Create Post' : 'Update Post'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Blog;
