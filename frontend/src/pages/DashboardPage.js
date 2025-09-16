import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { 
  ChartBarIcon, 
  PhotoIcon, 
  ShareIcon, 
  EyeIcon,
  CalendarIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

const DashboardPage = () => {
  const { user, logout, isAuthenticated, loading: authLoading } = useAuth();
  const [stats, setStats] = useState({
    totalGalleries: 0,
    totalPhotos: 0,
    activeShares: 0,
    totalViews: 0
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboardStats = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get('/galleries/stats');
      
      if (response.data.success) {
        setStats(response.data.stats);
        setRecentActivity(response.data.recentActivity || []);
        
        // Handle status messages for pending/rejected users
        if (response.data.message) {
          setError(response.data.message);
        } else {
          setError(null);
        }
      } else {
        setError(response.data.message || 'Failed to fetch dashboard statistics');
      }
    } catch (err) {
      if (err.response?.status === 401) {
        setError('Your session has expired. Please log in again.');
        // The axios interceptor will handle the redirect to login
      } else if (err.response?.status === 403) {
        setError(err.response.data?.message || 'Access denied. Please contact administrator.');
      } else {
        setError('Error loading dashboard data');
      }
      console.error('Dashboard stats error:', err);
    } finally {
      setLoading(false);
    }
  }, []); // Empty dependency array since this function doesn't depend on any props or state

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      fetchDashboardStats();
    } else if (!authLoading && !isAuthenticated) {
      setError('Please log in to view dashboard data');
      setLoading(false);
    }
  }, [authLoading, isAuthenticated, fetchDashboardStats]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link to="/" className="text-2xl font-serif font-bold gradient-text">
                Gallery Pavilion
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">Welcome, {user?.firstName}</span>
              <button
                onClick={logout}
                className="btn-secondary"
              >
                Sign Out
              </button>
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
          <div className="mb-8">
            <h1 className="text-3xl font-serif font-bold text-gray-900">
              Photographer Dashboard
            </h1>
            <p className="mt-2 text-gray-600">
              Manage your galleries, upload photos, and share with clients
            </p>
          </div>

          {/* Quick Stats */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="card animate-pulse">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-gray-200 rounded-lg mr-4"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded mb-2"></div>
                      <div className="h-6 bg-gray-200 rounded w-16"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8">
              <p className="text-red-600">{error}</p>
              {!isAuthenticated ? (
                <Link 
                  to="/login"
                  className="mt-2 inline-block bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Go to Login
                </Link>
              ) : (
                // Only show 'Try again' for actual errors, not status messages
                !error.includes('pending approval') && 
                !error.includes('requires approval') && 
                !error.includes('Access denied') && 
                !error.includes('Dashboard access limited') ? (
                  <button 
                    onClick={fetchDashboardStats}
                    className="mt-2 text-red-700 underline hover:text-red-800"
                  >
                    Try again
                  </button>
                ) : (
                  <div className="mt-2 text-sm text-gray-600">
                    {error.includes('pending approval') && (
                      <p>Please wait for an administrator to approve your account.</p>
                    )}
                    {(error.includes('requires approval') || error.includes('Access denied')) && (
                      <p>Contact an administrator for account access.</p>
                    )}
                  </div>
                )
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              {[
                { label: 'Total Galleries', value: stats.totalGalleries, color: 'bg-blue-500' },
                { label: 'Total Photos', value: stats.totalPhotos, color: 'bg-green-500' },
                { label: 'Active Shares', value: stats.activeShares, color: 'bg-purple-500' },
                { label: 'Total Views', value: stats.totalViews, color: 'bg-orange-500' }
              ].map((stat, index) => (
                <div key={index} className="card">
                  <div className="flex items-center">
                    <div className={`w-12 h-12 ${stat.color} rounded-lg flex items-center justify-center text-white font-bold text-xl mr-4`}>
                      {stat.value}
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">{stat.label}</p>
                      <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Action Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="card-hover text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Create New Gallery</h3>
              <p className="text-gray-600 mb-4">Start a new photo gallery for your clients</p>
              <Link to="/galleries/create" className="btn-primary inline-block">
                Create Gallery
              </Link>
            </div>

            <div className="card-hover text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Upload Photos</h3>
              <p className="text-gray-600 mb-4">Add new photos to your galleries</p>
              <Link to="/galleries" className="btn-secondary inline-block">
                Manage Galleries
              </Link>
            </div>

            <div className="card-hover text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Share Gallery</h3>
              <p className="text-gray-600 mb-4">Generate secure links for client access</p>
              <Link to="/galleries" className="btn-primary inline-block">
                Manage Shares
              </Link>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="mt-12">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Recent Activity</h2>
            <div className="card">
              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center space-x-3 animate-pulse">
                      <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-gray-200 rounded mb-1"></div>
                        <div className="h-3 bg-gray-200 rounded w-24"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : recentActivity.length > 0 ? (
                <div className="space-y-3">
                  {recentActivity.map((activity, index) => (
                    <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{activity.title}</p>
                        <p className="text-sm text-gray-500">
                          Created {new Date(activity.createdAt).toLocaleDateString()} • 
                          <span className={`ml-1 px-2 py-1 rounded-full text-xs ${
                            activity.status === 'published' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {activity.status}
                          </span>
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <p className="text-gray-500">No recent activity</p>
                  <p className="text-sm text-gray-400 mt-1">Create your first gallery to get started</p>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default DashboardPage;