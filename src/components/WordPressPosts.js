import React, { useState, useEffect } from 'react';
import { wordpressApi } from '../services/wordpressApi';
import WordPressCategories from './WordPressCategories';
import PostDetails from './PostDetails';
import './WordPressPosts.css';

const WordPressPosts = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [postsPerPage] = useState(10);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [expandedPost, setExpandedPost] = useState(null);

  useEffect(() => {
    fetchPosts();
  }, [currentPage, selectedCategory]);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        per_page: postsPerPage,
        _embed: true // Include embedded data like featured images
      };
      
      // Add category filter if selected
      if (selectedCategory) {
        params.categories = selectedCategory;
      }
      
      const fetchedPosts = await wordpressApi.getPosts(params);
      setPosts(fetchedPosts);
      setError(null);
    } catch (err) {
      setError('Failed to fetch posts. Please check your WordPress API URL.');
      console.error('Error fetching posts:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCategorySelect = (categoryId) => {
    setSelectedCategory(categoryId);
    setCurrentPage(1); // Reset to first page when filtering
    setExpandedPost(null); // Collapse any expanded post
  };

  const togglePostDetails = (postId) => {
    setExpandedPost(expandedPost === postId ? null : postId);
  };

  const stripHtml = (html) => {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const getFeaturedImage = (post) => {
    if (post._embedded && post._embedded['wp:featuredmedia']) {
      return post._embedded['wp:featuredmedia'][0].source_url;
    }
    return null;
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading WordPress posts...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <h2>Error Loading Posts</h2>
        <p>{error}</p>
        <button onClick={fetchPosts} className="retry-button">
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="wordpress-posts">
      <h1>WordPress Posts</h1>
      
      {/* Categories Filter */}
      <WordPressCategories
        selectedCategory={selectedCategory}
        onCategorySelect={handleCategorySelect}
      />
      
      {posts.length === 0 ? (
        <p>No posts found{selectedCategory ? ' in this category' : ''}.</p>
      ) : (
        <div className="posts-grid">
          {posts.map((post) => (
            <article key={post.id} className="post-card">
              {getFeaturedImage(post) && (
                <div className="post-image">
                  <img 
                    src={getFeaturedImage(post)} 
                    alt={post.title.rendered}
                    loading="lazy"
                  />
                </div>
              )}
              
              <div className="post-content">
                <h2 
                  className="post-title"
                  dangerouslySetInnerHTML={{ __html: post.title.rendered }}
                />
                
                <div className="post-meta">
                  <span className="post-date">
                    {formatDate(post.date)}
                  </span>
                  {post._embedded && post._embedded.author && (
                    <span className="post-author">
                      by {post._embedded.author[0].name}
                    </span>
                  )}
                </div>
                
                <div className="post-excerpt">
                  {post.excerpt.rendered ? (
                    <div dangerouslySetInnerHTML={{ __html: post.excerpt.rendered }} />
                  ) : (
                    <p>{stripHtml(post.content.rendered).substring(0, 150)}...</p>
                  )}
                </div>
                
                <div className="post-actions">
                  <button
                    onClick={() => togglePostDetails(post.id)}
                    className="details-button"
                  >
                    {expandedPost === post.id ? '▼ Hide Details' : '▶ Show Details'}
                  </button>
                  
                  <a 
                    href={post.link} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="read-more"
                  >
                    Read More →
                  </a>
                </div>
              </div>
              
              {/* Expanded Post Details */}
              {expandedPost === post.id && (
                <PostDetails post={post} />
              )}
            </article>
          ))}
        </div>
      )}
      
      <div className="pagination">
        <button 
          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
          disabled={currentPage === 1}
          className="pagination-button"
        >
          Previous
        </button>
        
        <span className="page-info">
          Page {currentPage}
        </span>
        
        <button 
          onClick={() => setCurrentPage(prev => prev + 1)}
          disabled={posts.length < postsPerPage}
          className="pagination-button"
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default WordPressPosts;
