import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import {
  PlusIcon,
  EyeIcon,
  ShareIcon,
  PencilIcon,
  TrashIcon,
  PhotoIcon,
  CalendarIcon,
  GlobeAltIcon,
  LockClosedIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';

const GalleriesPage = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [galleries, setGalleries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all'); // all, published, draft
  const [searchTerm, setSearchTerm] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    pages: 0
  });

  // Fetch galleries
  const fetchGalleries = async (page = 1, status = filter, search = searchTerm) => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString()
      });
      
      if (status !== 'all') {
        params.append('status', status === 'published' ? 'published' : 'draft');
      }
      
      if (search.trim()) {
        params.append('search', search.trim());
      }
      
      const response = await axios.get(`/galleries/my?${params}`);
      
      if (response.data) {
        setGalleries(response.data.galleries || []);
        setPagination(response.data.pagination || pagination);
      }
    } catch (err) {
      console.error('Error fetching galleries:', err);
      setError(err.response?.data?.message || 'Failed to load galleries');
      if (err.response?.status === 401) {
        toast.error('Please log in to view your galleries');
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchGalleries();
    }
  }, [isAuthenticated, filter]);

  // Handle search
  const handleSearch = (e) => {
    e.preventDefault();
    fetchGalleries(1, filter, searchTerm);
  };

  // Handle filter change
  const handleFilterChange = (newFilter) => {
    setFilter(newFilter);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  // Handle pagination
  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
    fetchGalleries(newPage, filter, searchTerm);
  };

  // Delete gallery
  const handleDeleteGallery = async (galleryId, galleryTitle) => {
    if (!window.confirm(`Are you sure you want to delete "${galleryTitle}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await axios.delete(`/galleries/${galleryId}`);
      toast.success('Gallery deleted successfully');
      fetchGalleries(pagination.page, filter, searchTerm);
    } catch (err) {
      console.error('Error deleting gallery:', err);
      toast.error(err.response?.data?.message || 'Failed to delete gallery');
    }
  };

  // Toggle gallery publish status
  const handleTogglePublish = async (galleryId, currentStatus) => {
    try {
      const newStatus = currentStatus !== 'published';
      await axios.patch(`/galleries/${galleryId}/status`, {
        isPublished: newStatus
      });
      toast.success(`Gallery ${newStatus ? 'published' : 'unpublished'} successfully`);
      fetchGalleries(pagination.page, filter, searchTerm);
    } catch (err) {
      console.error('Error updating gallery status:', err);
      toast.error(err.response?.data?.message || 'Failed to update gallery status');
    }
  };

  // Handle share gallery - navigate to gallery editor share tab
  const handleShareGallery = (galleryId) => {
    navigate(`/gallery/${galleryId}/edit?tab=share`);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Authentication Required</h2>
          <p className="text-gray-600 mb-6">Please log in to manage your galleries.</p>
          <Link to="/login" className="btn-primary">
            Log In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link to="/dashboard" className="text-gray-600 hover:text-gray-900">
                ← Back to Dashboard
              </Link>
              <Link to="/" className="text-2xl font-serif font-bold gradient-text">
                Gallery Pavilion
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Welcome, {user?.firstName}</span>
              <Link to="/galleries/create" className="btn-primary flex items-center space-x-2">
                <PlusIcon className="w-4 h-4" />
                <span>New Gallery</span>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-serif font-bold text-gray-900 mb-2">
              My Galleries
            </h1>
            <p className="text-gray-600">
              Manage your photo galleries, upload images, and control sharing settings.
            </p>
          </div>

          {/* Search and Filters */}
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
              {/* Search */}
              <form onSubmit={handleSearch} className="flex-1 max-w-md">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search galleries..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-4 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                  <button
                    type="submit"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </button>
                </div>
              </form>

              {/* Filters */}
              <div className="flex space-x-2">
                {['all', 'published', 'draft'].map((filterOption) => (
                  <button
                    key={filterOption}
                    onClick={() => handleFilterChange(filterOption)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      filter === filterOption
                        ? 'bg-primary-100 text-primary-700 border border-primary-200'
                        : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200'
                    }`}
                  >
                    {filterOption.charAt(0).toUpperCase() + filterOption.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-700">{error}</p>
              <button
                onClick={() => fetchGalleries(pagination.page, filter, searchTerm)}
                className="mt-2 text-red-600 hover:text-red-800 text-sm font-medium"
              >
                Try again
              </button>
            </div>
          )}

          {/* Galleries Grid */}
          {!loading && !error && (
            <>
              {galleries.length === 0 ? (
                <div className="text-center py-12">
                  <PhotoIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {searchTerm || filter !== 'all' ? 'No galleries found' : 'No galleries yet'}
                  </h3>
                  <p className="text-gray-600 mb-6">
                    {searchTerm || filter !== 'all'
                      ? 'Try adjusting your search or filter criteria.'
                      : 'Create your first gallery to get started.'}
                  </p>
                  <Link to="/galleries/create" className="btn-primary">
                    Create Your First Gallery
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {galleries.map((gallery) => (
                    <motion.div
                      key={gallery._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white rounded-lg shadow-sm border overflow-hidden hover:shadow-md transition-shadow"
                    >
                      {/* Gallery Cover */}
                      <div className="aspect-video bg-gray-200 relative">
                        {gallery.coverImage?.url ? (
                          <img
                            src={gallery.coverImage.url}
                            alt={gallery.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <PhotoIcon className="w-12 h-12 text-gray-400" />
                          </div>
                        )}
                        
                        {/* Status Badge */}
                        <div className="absolute top-2 right-2">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            gallery.isPublished
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {gallery.isPublished ? 'Published' : 'Draft'}
                          </span>
                        </div>
                      </div>

                      {/* Gallery Info */}
                      <div className="p-4">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2 truncate">
                          {gallery.title}
                        </h3>
                        <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                          {gallery.description}
                        </p>
                        
                        {/* Gallery Meta */}
                        <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                          <div className="flex items-center space-x-4">
                            <span className="flex items-center space-x-1">
                              <PhotoIcon className="w-4 h-4" />
                              <span>{gallery.photoCount || 0}</span>
                            </span>
                            <span className="flex items-center space-x-1">
                              <EyeIcon className="w-4 h-4" />
                              <span>{gallery.stats?.totalViews || 0}</span>
                            </span>
                          </div>
                          <span className="flex items-center space-x-1">
                            <CalendarIcon className="w-4 h-4" />
                            <span>{formatDate(gallery.createdAt)}</span>
                          </span>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center justify-between">
                          <div className="flex space-x-2">
                            <Link
                              to={`/gallery/${gallery._id}/edit`}
                              className="p-2 text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                              title="Edit Gallery"
                            >
                              <PencilIcon className="w-4 h-4" />
                            </Link>
                            <button
                              onClick={() => handleShareGallery(gallery._id)}
                              className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Share Gallery"
                            >
                              <ShareIcon className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteGallery(gallery._id, gallery.title)}
                              className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete Gallery"
                            >
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}

              {/* Pagination */}
              {pagination.pages > 1 && (
                <div className="flex justify-center items-center space-x-2 mt-8">
                  <button
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page === 1}
                    className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  
                  {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`px-3 py-2 text-sm font-medium rounded-md ${
                        page === pagination.page
                          ? 'bg-primary-600 text-white'
                          : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  
                  <button
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page === pagination.pages}
                    className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </motion.div>
      </main>
    </div>
  );
};

export default GalleriesPage;