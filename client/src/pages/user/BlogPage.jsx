import React from 'react';
import Blog from '../../components/ui/Blog';

const BlogPage = () => {
  return (
    <div className="w-full flex-1 bg-gray-50 dark:bg-gray-900 py-6 sm:py-8 min-h-[calc(100vh-4rem)]">
      <div className="container mx-auto px-4 sm:px-6 max-w-7xl">
        <Blog isAdmin={false} />
      </div>
    </div>
  );
};

export default BlogPage;
