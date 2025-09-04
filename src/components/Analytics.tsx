'use client'

import { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts'
import { Eye, Heart, ShoppingCart, Users, Clock } from 'lucide-react'
import Image from 'next/image'

interface AnalyticsData {
  overview: {
    totalViews: number
    totalFavorites: number
    totalComments: number
    totalDownloads: number
    totalPurchaseRequests: number
    uniqueVisitors: number
    avgTimeSpent: string
    conversionRate: number
  }
  dailyViews: Array<{
    date: string
    views: number
    favorites: number
    comments: number
  }>
  topPhotos: Array<{
    id: string
    title: string
    views: number
    favorites: number
    thumbnail: string
    collection: string
  }>
  galleryPerformance: Array<{
    name: string
    views: number
    engagement: number
  }>
  clientActivity: Array<{
    name: string
    email: string
    lastActive: string
    totalViews: number
    favorites: number
    gallery: string
  }>
  deviceBreakdown: Array<{
    name: string
    value: number
    color: string
  }>
}

// Mock data - in real app, this would come from API
const mockAnalytics: AnalyticsData = {
  overview: {
    totalViews: 12847,
    totalFavorites: 1523,
    totalComments: 89,
    totalDownloads: 234,
    totalPurchaseRequests: 45,
    uniqueVisitors: 892,
    avgTimeSpent: '4m 32s',
    conversionRate: 5.2
  },
  dailyViews: [
    { date: '2024-01-15', views: 245, favorites: 32, comments: 5 },
    { date: '2024-01-16', views: 189, favorites: 28, comments: 3 },
    { date: '2024-01-17', views: 312, favorites: 45, comments: 8 },
    { date: '2024-01-18', views: 278, favorites: 38, comments: 6 },
    { date: '2024-01-19', views: 356, favorites: 52, comments: 12 },
    { date: '2024-01-20', views: 423, favorites: 67, comments: 15 },
    { date: '2024-01-21', views: 398, favorites: 58, comments: 9 }
  ],
  topPhotos: [
    {
      id: '1',
      title: 'Golden Hour Portrait',
      views: 1247,
      favorites: 189,
      thumbnail: 'https://images.unsplash.com/photo-1594736797933-d0401ba2fe65?w=150&h=150&fit=crop',
      collection: 'Wedding Portraits'
    },
    {
      id: '2',
      title: 'Ceremony Kiss',
      views: 1089,
      favorites: 156,
      thumbnail: 'https://images.unsplash.com/photo-1606216794074-735e91aa2c92?w=150&h=150&fit=crop',
      collection: 'Ceremony'
    },
    {
      id: '3',
      title: 'Reception Dance',
      views: 967,
      favorites: 134,
      thumbnail: 'https://images.unsplash.com/photo-1469371670807-013ccf25f16a?w=150&h=150&fit=crop',
      collection: 'Reception'
    },
    {
      id: '4',
      title: 'Bridal Details',
      views: 845,
      favorites: 112,
      thumbnail: 'https://images.unsplash.com/photo-1606800052052-a08af7148866?w=150&h=150&fit=crop',
      collection: 'Details'
    },
    {
      id: '5',
      title: 'Group Photo',
      views: 723,
      favorites: 98,
      thumbnail: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=150&h=150&fit=crop',
      collection: 'Family & Friends'
    }
  ],
  galleryPerformance: [
    { name: 'Smith Wedding', views: 3245, engagement: 8.2 },
    { name: 'Johnson Engagement', views: 2156, engagement: 6.8 },
    { name: 'Brown Anniversary', views: 1876, engagement: 7.1 },
    { name: 'Davis Family', views: 1654, engagement: 5.9 },
    { name: 'Wilson Portrait', views: 1432, engagement: 6.3 }
  ],
  clientActivity: [
    {
      name: 'Sarah Smith',
      email: 'sarah@example.com',
      lastActive: '2 hours ago',
      totalViews: 156,
      favorites: 23,
      gallery: 'Smith Wedding'
    },
    {
      name: 'Mike Johnson',
      email: 'mike@example.com',
      lastActive: '1 day ago',
      totalViews: 89,
      favorites: 12,
      gallery: 'Johnson Engagement'
    },
    {
      name: 'Lisa Brown',
      email: 'lisa@example.com',
      lastActive: '3 days ago',
      totalViews: 234,
      favorites: 34,
      gallery: 'Brown Anniversary'
    }
  ],
  deviceBreakdown: [
    { name: 'Desktop', value: 45, color: '#8884d8' },
    { name: 'Mobile', value: 35, color: '#82ca9d' },
    { name: 'Tablet', value: 20, color: '#ffc658' }
  ]
}

interface AnalyticsProps {
  photographerId?: string
  galleryId?: string
  timeRange?: '7d' | '30d' | '90d' | '1y'
}

export default function Analytics({ photographerId, galleryId, timeRange = '30d' }: AnalyticsProps) {
  const [analytics, setAnalytics] = useState<AnalyticsData>(mockAnalytics)
  const [loading, setLoading] = useState(false)
  const [selectedTab, setSelectedTab] = useState<'overview' | 'photos' | 'galleries' | 'clients'>('overview')

  useEffect(() => {
    // In real app, fetch analytics data based on props
    setLoading(true)
    // Simulate API call
    setTimeout(() => {
      setAnalytics(mockAnalytics)
      setLoading(false)
    }, 1000)
  }, [photographerId, galleryId, timeRange])

  const StatCard = ({ icon: Icon, title, value, change, color }: {
    icon: React.ComponentType<{ className?: string }>
    title: string
    value: string | number
    change?: string
    color: string
  }) => (
    <div className="bg-white rounded-lg p-6 shadow-sm border">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {change && (
            <p className={`text-sm ${change.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
              {change} from last period
            </p>
          )}
        </div>
        <div className={`p-3 rounded-full ${color}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
    </div>
  )

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg p-6 shadow-sm border animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={Eye}
          title="Total Views"
          value={analytics.overview.totalViews.toLocaleString()}
          change="+12.5%"
          color="bg-blue-500"
        />
        <StatCard
          icon={Heart}
          title="Favorites"
          value={analytics.overview.totalFavorites.toLocaleString()}
          change="+8.2%"
          color="bg-red-500"
        />
        <StatCard
          icon={Users}
          title="Unique Visitors"
          value={analytics.overview.uniqueVisitors.toLocaleString()}
          change="+15.3%"
          color="bg-green-500"
        />
        <StatCard
          icon={ShoppingCart}
          title="Purchase Requests"
          value={analytics.overview.totalPurchaseRequests}
          change="+22.1%"
          color="bg-purple-500"
        />
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'photos', label: 'Top Photos' },
            { id: 'galleries', label: 'Gallery Performance' },
            { id: 'clients', label: 'Client Activity' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedTab(tab.id as 'overview' | 'photos' | 'galleries' | 'clients')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                selectedTab === tab.id
                  ? 'border-black text-black'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {selectedTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Daily Views Chart */}
          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Daily Activity</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analytics.dailyViews}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="views" stroke="#3b82f6" strokeWidth={2} />
                <Line type="monotone" dataKey="favorites" stroke="#ef4444" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Device Breakdown */}
          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Device Breakdown</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analytics.deviceBreakdown}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${percent ? (percent * 100).toFixed(0) : 0}%`}
                >
                  {analytics.deviceBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {selectedTab === 'photos' && (
        <div className="bg-white rounded-lg p-6 shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Performing Photos</h3>
          <div className="space-y-4">
            {analytics.topPhotos.map((photo, index) => (
              <div key={photo.id} className="flex items-center space-x-4 p-4 border rounded-lg">
                <div className="text-lg font-bold text-gray-400 w-8">#{index + 1}</div>
                <Image
                  src={photo.thumbnail}
                  alt={photo.title}
                  width={64}
                  height={64}
                  className="w-16 h-16 object-cover rounded-lg"
                />
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900">{photo.title}</h4>
                  <p className="text-sm text-gray-600">{photo.collection}</p>
                </div>
                <div className="text-right">
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <span className="flex items-center">
                      <Eye className="h-4 w-4 mr-1" />
                      {photo.views}
                    </span>
                    <span className="flex items-center">
                      <Heart className="h-4 w-4 mr-1" />
                      {photo.favorites}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {selectedTab === 'galleries' && (
        <div className="bg-white rounded-lg p-6 shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Gallery Performance</h3>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={analytics.galleryPerformance}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="views" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {selectedTab === 'clients' && (
        <div className="bg-white rounded-lg p-6 shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Client Activity</h3>
          <div className="space-y-4">
            {analytics.clientActivity.map((client, index) => (
              <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h4 className="font-semibold text-gray-900">{client.name}</h4>
                  <p className="text-sm text-gray-600">{client.email}</p>
                  <p className="text-sm text-gray-500">{client.gallery}</p>
                </div>
                <div className="text-right">
                  <div className="flex items-center space-x-4 text-sm text-gray-600 mb-1">
                    <span className="flex items-center">
                      <Eye className="h-4 w-4 mr-1" />
                      {client.totalViews}
                    </span>
                    <span className="flex items-center">
                      <Heart className="h-4 w-4 mr-1" />
                      {client.favorites}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 flex items-center">
                    <Clock className="h-3 w-3 mr-1" />
                    {client.lastActive}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}