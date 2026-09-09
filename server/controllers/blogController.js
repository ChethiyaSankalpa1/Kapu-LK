const Blog = require('../models/Blog');
const User = require('../models/User');

// @desc    Get all blog posts
// @route   GET /api/blog
// @access  Public
exports.getBlogPosts = async (req, res) => {
  try {
    const { category, featured, search } = req.query;
    
    const query = { isPublished: true };
    
    if (category) {
      query.category = category;
    }
    
    if (featured === 'true') {
      query.featured = true;
    }

    if (search) {
      query.$text = { $search: search };
    }

    const posts = await Blog.find(query)
      .populate('author', 'name profileImageUrl')
      .sort({ featured: -1, publishedAt: -1 })
      .limit(50);

    res.json(posts);
  } catch (error) {
    console.error('Error fetching blog posts:', error);
    res.status(500).json({ message: 'Failed to fetch blog posts' });
  }
};

// @desc    Get single blog post
// @route   GET /api/blog/:slug
// @access  Public
exports.getBlogPost = async (req, res) => {
  try {
    const post = await Blog.findOne({ slug: req.params.slug, isPublished: true })
      .populate('author', 'name profileImageUrl')
      .populate('likes', 'name profileImageUrl')
      .populate('comments.user', 'name profileImageUrl');

    if (!post) {
      return res.status(404).json({ message: 'Blog post not found' });
    }

    // Increment view count
    post.views = (post.views || 0) + 1;
    await post.save();

    res.json(post);
  } catch (error) {
    console.error('Error fetching blog post:', error);
    res.status(500).json({ message: 'Failed to fetch blog post' });
  }
};

// @desc    Create blog post
// @route   POST /api/blog
// @access  Private
exports.createBlogPost = async (req, res) => {
  try {
    const { title, slug, excerpt, content, coverImage, category, tags } = req.body;

    // Check if slug already exists
    const existingPost = await Blog.findOne({ slug });
    if (existingPost) {
      return res.status(400).json({ message: 'Slug already exists' });
    }

    const blogPost = await Blog.create({
      title,
      slug,
      excerpt,
      content,
      coverImage,
      author: req.user._id,
      category,
      tags: tags || [],
      isPublished: false
    });

    const populatedPost = await Blog.findById(blogPost._id)
      .populate('author', 'name profileImageUrl');

    res.status(201).json(populatedPost);
  } catch (error) {
    console.error('Error creating blog post:', error);
    res.status(500).json({ message: 'Failed to create blog post' });
  }
};

// @desc    Update blog post
// @route   PUT /api/blog/:id
// @access  Private
exports.updateBlogPost = async (req, res) => {
  try {
    const post = await Blog.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: 'Blog post not found' });
    }

    // Check if user is author or admin
    if (post.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const { title, content, summary, category, tags, coverImage } = req.body;
    const allowedUpdates = {};
    if (title !== undefined) allowedUpdates.title = String(title).trim();
    if (content !== undefined) allowedUpdates.content = content;
    if (summary !== undefined) allowedUpdates.summary = summary;
    if (category !== undefined) allowedUpdates.category = category;
    if (tags !== undefined) allowedUpdates.tags = tags;
    if (coverImage !== undefined) allowedUpdates.coverImage = coverImage;
    if (req.user.role === 'admin' && req.body.isFeatured !== undefined) {
      allowedUpdates.isFeatured = !!req.body.isFeatured;
    }

    const updatedPost = await Blog.findByIdAndUpdate(
      req.params.id,
      { $set: allowedUpdates },
      { new: true }
    ).populate('author', 'name profileImageUrl');

    res.json(updatedPost);
  } catch (error) {
    console.error('Error updating blog post:', error);
    res.status(500).json({ message: 'Failed to update blog post' });
  }
};

// @desc    Publish blog post
// @route   PUT /api/blog/:id/publish
// @access  Private
exports.publishBlogPost = async (req, res) => {
  try {
    const post = await Blog.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: 'Blog post not found' });
    }

    // Check if user is author or admin
    if (post.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    post.isPublished = true;
    post.publishedAt = new Date();
    await post.save();

    const populatedPost = await Blog.findById(post._id)
      .populate('author', 'name profileImageUrl');

    res.json(populatedPost);
  } catch (error) {
    console.error('Error publishing blog post:', error);
    res.status(500).json({ message: 'Failed to publish blog post' });
  }
};

// @desc    Like blog post
// @route   POST /api/blog/:id/like
// @access  Private
exports.likeBlogPost = async (req, res) => {
  try {
    const post = await Blog.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Blog post not found' });
    }

    const userId = req.user._id;
    const alreadyLiked = post.likes.includes(userId);

    if (alreadyLiked) {
      post.likes = post.likes.filter(id => id.toString() !== userId.toString());
      post.likeCount = Math.max(0, post.likeCount - 1);
    } else {
      post.likes.push(userId);
      post.likeCount += 1;
    }

    await post.save();

    res.json({
      liked: !alreadyLiked,
      likeCount: post.likeCount
    });
  } catch (error) {
    console.error('Error liking blog post:', error);
    res.status(500).json({ message: 'Failed to like blog post' });
  }
};

// @desc    Add comment to blog post
// @route   POST /api/blog/:id/comments
// @access  Private
exports.addComment = async (req, res) => {
  try {
    const { content } = req.body;
    const post = await Blog.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: 'Blog post not found' });
    }

    post.comments.push({
      user: req.user._id,
      content
    });
    post.commentCount += 1;

    await post.save();

    const populatedPost = await Blog.findById(req.params.id)
      .populate('comments.user', 'name profileImageUrl');

    res.json(populatedPost.comments[populatedPost.comments.length - 1]);
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({ message: 'Failed to add comment' });
  }
};

// @desc    Delete blog post
// @route   DELETE /api/blog/:id
// @access  Private
exports.deleteBlogPost = async (req, res) => {
  try {
    const post = await Blog.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: 'Blog post not found' });
    }

    // Check if user is author or admin
    if (post.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    await Blog.findByIdAndDelete(req.params.id);
    res.json({ message: 'Blog post deleted successfully' });
  } catch (error) {
    console.error('Error deleting blog post:', error);
    res.status(500).json({ message: 'Failed to delete blog post' });
  }
};
