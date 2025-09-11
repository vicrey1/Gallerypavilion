'use client'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

import { motion, AnimatePresence } from 'framer-motion'
import { Camera, Plus, Upload, Eye, Heart, Download, Settings, Users, BarChart3, Calendar, Search, Filter, Grid, List, X, Edit, Trash2, Share, Copy, Mail } from 'lucide-react'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import Image from 'next/image'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import NotificationCenter from '@/components/NotificationCenter'
import InviteModal from '@/components/InviteModal'


interface Gallery {
  id: string
  title: string
  description?: string
  status: 'draft' | 'active' | 'archived'
  createdAt: string
  expiresAt?: string
  isPublic: boolean
  allowDownloads: boolean
  totalPhotos: number
  views: number
  favorites: number
  invites: number
  thumbnail?: string
}

interface Analytics {
  totalGalleries: number
  activeGalleries: number
  totalPhotos: number
  totalViews: number
  totalFavorites: number
  totalDownloads: number
  recentActivity: Array<{
    type: 'view' | 'favorite' | 'download'
    gallery: string
    client: string
    time: string
  }>
  monthlyViews: Array<{
    month: Date
    count: number
  }>
}

interface CreateGalleryFormData {
  title: string
  description?: string
  isPublic: boolean
}



interface PhotographerProfile {
  id: string
  name: string
  email: string
  businessName?: string
  website?: string
  phone?: string
  bio?: string
  equipment?: string
  experience?: string
  portfolio?: string
  socialMedia?: {
    instagram?: string
    facebook?: string
    twitter?: string
    linkedin?: string
  }
  status: string
  createdAt: string
  updatedAt: string
}

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'galleries' | 'analytics' | 'settings'>('galleries')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'draft' | 'expired'>('all')
  const [showCreateModal, setShowCreateModal] = useState(false)


  const [createFormData, setCreateFormData] = useState<CreateGalleryFormData>({
    title: '',
    description: '',
    isPublic: false
  })
  
  // Data state
  const [galleries, setGalleries] = useState<Gallery[]>([])
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [profile, setProfile] = useState<PhotographerProfile | null>(null)
  const [profileLoading, setProfileLoading] = useState(false)
  const [profileSaving, setProfileSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState<Gallery | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showInviteModal, setShowInviteModal] = useState<Gallery | null>(null)
  
  // Profile form state
  const [profileForm, setProfileForm] = useState({
    businessName: '',
    email: '',
    website: '',
    phone: '',
    bio: '',
    defaultExpiry: 90,
    enableWatermarks: true,
    requireApproval: true
  })

  // Redirect if not authenticated or not a photographer
  useEffect(() => {
    if (status === 'loading') return
    if (!session || session.user?.role !== 'photographer') {
      router.push('/auth/photographer-login')
      return
    }
  }, [session, status, router])

  // Fetch galleries
  const fetchGalleries = async () => {
    try {
      const response = await fetch('/api/photographer/galleries')
      if (!response.ok) {
        if (response.status === 401) {
          console.error('Authentication error: User not logged in as photographer')
          setError('Authentication required. Please log in as a photographer.')
          router.push('/auth/photographer-login')
          return
        }
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
      }
      const data = await response.json()
      setGalleries(data.galleries)
    } catch (error) {
      console.error('Error fetching galleries:', error)
      setError(error instanceof Error ? error.message : 'Failed to load galleries')
    }
  }

  // Fetch analytics
  const fetchAnalytics = async () => {
    try {
      const response = await fetch('/api/photographer/stats')
      if (!response.ok) {
        if (response.status === 401) {
          console.error('Authentication error: User not logged in as photographer')
          setError('Authentication required. Please log in as a photographer.')
          router.push('/auth/photographer-login')
          return
        }
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
      }
      const data = await response.json()
      setAnalytics(data)
    } catch (error) {
      console.error('Error fetching analytics:', error)
      setError(error instanceof Error ? error.message : 'Failed to load analytics')
    }
  }

  // Fetch profile
  const fetchProfile = async () => {
    try {
      setProfileLoading(true)
      const response = await fetch('/api/photographer/profile')
      if (!response.ok) {
        if (response.status === 401) {
          console.error('Authentication error: User not logged in as photographer')
          setError('Authentication required. Please log in as a photographer.')
          router.push('/auth/photographer-login')
          return
        }
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
      }
      const data = await response.json()
        setProfile(data)
        // Update form state with fetched data
        setProfileForm({
          businessName: data.businessName || '',
          email: data.email || '',
          website: data.website || '',
          phone: data.phone || '',
          bio: data.bio || '',
          defaultExpiry: 90, // This would come from photographer settings if we had them
          enableWatermarks: true,
          requireApproval: true
        })
     } catch (error) {
       console.error('Error fetching profile:', error)
       setError(error instanceof Error ? error.message : 'Failed to load profile')
     } finally {
       setProfileLoading(false)
     }
   }

   // Save profile
   const saveProfile = async () => {
     try {
       setProfileSaving(true)
       const response = await fetch('/api/photographer/profile', {
         method: 'PUT',
         headers: {
           'Content-Type': 'application/json',
         },
         body: JSON.stringify({
           businessName: profileForm.businessName,
           website: profileForm.website,
           phone: profileForm.phone,
           bio: profileForm.bio
         }),
       })
       
       if (!response.ok) {
         if (response.status === 401) {
           setError('Authentication required. Please log in as a photographer.')
           router.push('/auth/photographer-login')
           return
         }
         const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
         throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
       }
       
       const data = await response.json()
        setProfile(data)
        // Show success message or notification here
        console.log('Profile saved successfully')
     } catch (error) {
       console.error('Error saving profile:', error)
       setError(error instanceof Error ? error.message : 'Failed to save profile')
     } finally {
       setProfileSaving(false)
     }
   }

  // Initial data load
  useEffect(() => {
    if (session?.user?.role === 'photographer') {
      Promise.all([fetchGalleries(), fetchAnalytics(), fetchProfile()])
        .finally(() => setLoading(false))
    }
  }, [session])

  const filteredGalleries = galleries.filter(gallery => {
    const matchesSearch = gallery.title.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filterStatus === 'all' || gallery.status === filterStatus
    return matchesSearch && matchesFilter
  })

  const handleCreateGallery = async (formData: CreateGalleryFormData) => {
    try {
      const response = await fetch('/api/photographer/galleries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })
      
      if (response.status === 401) {
        setError('Authentication required. Please log in as a photographer.')
        router.push('/auth/photographer-login')
        return
      }
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(errorData.error || `Failed to create gallery (${response.status})`)
      }
      
      const newGallery = await response.json()
      setGalleries(prev => [newGallery, ...prev])
      setShowCreateModal(false)
      
      // Refresh analytics
      fetchAnalytics()
    } catch (error) {
      console.error('Error creating gallery:', error)
      setError(error instanceof Error ? error.message : 'Failed to create gallery')
    }
  }

  const handleDeleteGallery = async (gallery: Gallery) => {
    if (!gallery?.id) {
      setError('Gallery ID is missing')
      return
    }
    
    setIsDeleting(true)
    try {
      const response = await fetch(`/api/photographer/galleries/${gallery.id}`, {
        method: 'DELETE',
      })
      
      if (response.status === 401) {
        setError('Authentication required. Please log in as a photographer.')
        router.push('/auth/photographer-login')
        return
      }
      
      if (response.status === 403) {
        setError('You do not have permission to delete this gallery.')
        setIsDeleting(false)
        return
      }
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(errorData.error || `Failed to delete gallery (${response.status})`)
      }
      
      // Remove gallery from state
      setGalleries(prev => prev.filter(g => g.id !== gallery.id))
      setShowDeleteModal(null)
      
      // Refresh analytics
      fetchAnalytics()
    } catch (error) {
      console.error('Error deleting gallery:', error)
      setError(error instanceof Error ? error.message : 'Failed to delete gallery')
    } finally {
      setIsDeleting(false)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b border-white mx-auto mb-4" style={{borderBottomWidth: '2px'}}></div>
          <p>Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (!session || session.user?.role !== 'photographer') {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Navigation */}
      <nav className="relative z-50 px-4 sm:px-6 py-4 bg-black/20 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-7xl mx-auto">
          {/* Mobile Navigation */}
          <div className="block sm:hidden">
            <div className="flex items-center justify-between mb-3">
              <Link href="/" className="flex items-center space-x-2">
                <Camera className="h-6 w-6 text-white" />
                <span className="text-lg font-bold text-white">Gallery Pavilion</span>
              </Link>
              
              <div className="flex items-center space-x-2">
                <NotificationCenter />
                <button 
                  onClick={() => signOut({ callbackUrl: '/' })}
                  className="text-white hover:text-purple-300 transition-colors p-2 rounded-lg"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h1 className="text-xl font-bold text-white">Dashboard</h1>
                <p className="text-gray-300 text-sm">Manage your galleries</p>
              </div>
              
              <div className="flex items-center space-x-2">
                <Link 
                  href="/collections"
                  className="bg-white/10 hover:bg-white/20 text-white px-3 py-2 rounded-lg transition-colors text-sm"
                >
                  Collections
                </Link>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded-lg transition-colors min-h-[40px] flex items-center"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
          
          {/* Desktop Navigation */}
          <div className="hidden sm:flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/" className="flex items-center space-x-2">
                <Camera className="h-6 w-6 text-white" />
                <span className="text-lg font-bold text-white">Gallery Pavilion</span>
              </Link>
              <div className="text-gray-300">•</div>
              <span className="text-white font-medium">Photographer Dashboard</span>
              <div className="text-gray-300">•</div>
              <Link href="/collections" className="text-white hover:text-purple-300 transition-colors">
                Collections
              </Link>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center space-x-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <Plus className="h-4 w-4" />
                <span>New Gallery</span>
              </button>
              
              <NotificationCenter />
              
              <button 
                onClick={() => signOut({ callbackUrl: '/' })}
                className="text-white hover:text-purple-300 transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Error Display */}
        {error && (
          <div className="mb-6 bg-red-500/20 border border-red-500/50 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <X className="h-5 w-5 text-red-400" />
              <span className="text-red-200">{error}</span>
              <button
                onClick={() => setError(null)}
                className="ml-auto text-red-400 hover:text-red-300"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
        {/* Tab Navigation */}
        <div className="flex space-x-1 bg-white/10 rounded-lg p-1 mb-6 sm:mb-8 w-full sm:w-fit overflow-x-auto">
          {[
            { id: 'galleries', label: 'Galleries', icon: Camera },
            { id: 'analytics', label: 'Analytics', icon: BarChart3 },
            { id: 'settings', label: 'Settings', icon: Settings }
          ].map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as 'galleries' | 'analytics' | 'settings')}
                className={`flex items-center space-x-2 px-3 sm:px-4 py-2 rounded-md transition-colors whitespace-nowrap min-h-[44px] ${
                  activeTab === tab.id
                    ? 'bg-white/20 text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="text-sm sm:text-base">{tab.label}</span>
              </button>
            )
          })}
        </div>

        {/* Galleries Tab */}
        {activeTab === 'galleries' && (
          <div>
            {/* Controls */}
            <div className="flex flex-col gap-4 mb-6 sm:mb-8">
              {/* Search and Filter Row */}
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search galleries..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 sm:py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 text-base sm:text-sm"
                  />
                </div>
                
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as 'all' | 'active' | 'draft' | 'expired')}
                  className="bg-white/10 border border-white/20 rounded-lg text-white px-3 py-3 sm:py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 text-base sm:text-sm min-w-[120px]"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="draft">Draft</option>
                  <option value="expired">Expired</option>
                </select>
              </div>
              
              {/* View Mode Toggle */}
              <div className="flex justify-end">
                <div className="flex bg-white/10 rounded-lg p-1">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-3 sm:p-2 rounded-md transition-colors ${
                      viewMode === 'grid' ? 'bg-white/20 text-white' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    <Grid className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-3 sm:p-2 rounded-md transition-colors ${
                      viewMode === 'list' ? 'bg-white/20 text-white' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    <List className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Galleries Grid/List */}
            <div className={viewMode === 'grid' 
              ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6'
              : 'space-y-3 sm:space-y-4'
            }>
              {filteredGalleries.map((gallery) => (
                <motion.div
                  key={gallery.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`group bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 hover:border-white/20 transition-all duration-200 ${
                    viewMode === 'list' ? 'flex items-center p-4' : 'overflow-hidden'
                  }`}
                >
                  {/* Thumbnail */}
                  <div className={`relative ${
                    viewMode === 'grid' ? 'aspect-[4/3]' : 'w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden'
                  }`}>
                    <div className="w-full h-full bg-gradient-to-br from-purple-400 to-pink-400 opacity-70"></div>
                    
                    {/* Status Badge */}
                    <div className={`absolute top-2 left-2 px-2 py-1 rounded-full text-xs font-medium ${
                      gallery.status === 'active' ? 'bg-green-500 text-white' :
                      gallery.status === 'draft' ? 'bg-yellow-500 text-black' :
                      'bg-red-500 text-white'
                    }`}>
                      {gallery.status}
                    </div>
                  </div>
                  
                  {/* Content */}
                  <div className={`p-4 flex-1 ${
                    viewMode === 'list' ? 'ml-4' : ''
                  }`}>
                    <h3 className="text-lg font-semibold text-white mb-2">{gallery.title}</h3>
                    
                    <div className={`grid gap-2 text-sm text-gray-300 mb-4 ${
                      viewMode === 'grid' ? 'grid-cols-2' : 'grid-cols-2 sm:grid-cols-4'
                    }`}>
                      <div className="flex items-center space-x-1">
                        <Camera className="h-3 w-3" />
                        <span>{gallery.totalPhotos} photos</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Eye className="h-3 w-3" />
                        <span>{gallery.views} views</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Heart className="h-3 w-3" />
                        <span>{gallery.favorites} favorites</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Users className="h-3 w-3" />
                        <span>{gallery.invites} invites</span>
                      </div>
                    </div>
                    
                    <div className="text-xs text-gray-400 mb-4">
                      Created: {new Date(gallery.createdAt).toLocaleDateString()}
                      {gallery.expiresAt && (
                        <span className="ml-2">
                          Expires: {new Date(gallery.expiresAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    
                    {/* Actions */}
                    <div className={`flex gap-2 ${
                      viewMode === 'grid' ? 'flex-wrap' : 'flex-wrap sm:flex-nowrap'
                    }`}>
                      <Link
                        href={`/gallery/${gallery.id}/public`}
                        className="flex items-center justify-center space-x-1 text-xs sm:text-sm bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 sm:py-1 rounded-md transition-colors min-h-[36px] flex-1 sm:flex-none"
                      >
                        <Eye className="h-3 w-3" />
                        <span className="hidden sm:inline">Preview</span>
                      </Link>
                      
                      <Link
                        href={`/gallery/${gallery.id}`}
                        className="flex items-center justify-center space-x-1 text-xs sm:text-sm bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 sm:py-1 rounded-md transition-colors min-h-[36px] flex-1 sm:flex-none"
                      >
                        <Edit className="h-3 w-3" />
                        <span className="hidden sm:inline">Manage</span>
                      </Link>
                      
                      <button
                        onClick={() => setShowInviteModal(gallery)}
                        className="flex items-center justify-center space-x-1 text-xs sm:text-sm bg-green-600 hover:bg-green-700 text-white px-3 py-2 sm:py-1 rounded-md transition-colors min-h-[36px] flex-1 sm:flex-none"
                      >
                        <Mail className="h-3 w-3" />
                        <span className="hidden sm:inline">Invite</span>
                      </button>

                      <button
                        onClick={() => setShowDeleteModal(gallery)}
                        className="flex items-center justify-center space-x-1 text-xs sm:text-sm bg-red-600 hover:bg-red-700 text-white px-3 py-2 sm:py-1 rounded-md transition-colors min-h-[36px] flex-1 sm:flex-none"
                      >
                        <Trash2 className="h-3 w-3" />
                        <span className="hidden sm:inline">Delete</span>
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {filteredGalleries.length === 0 && (
              <div className="text-center py-12">
                <Camera className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">No galleries found</h3>
                <p className="text-gray-400 mb-4">Create your first gallery to get started</p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg transition-colors"
                >
                  Create Gallery
                </button>
              </div>
            )}
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
              <h2 className="text-xl sm:text-2xl font-bold text-white">Analytics Overview</h2>
              <Link href="/dashboard/analytics" className="text-sm text-purple-300 hover:text-white self-start sm:self-auto">
                View Detailed Analytics →
              </Link>
            </div>
            
            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
              {[
                { label: 'Total Views', value: analytics?.totalViews || 0, icon: Eye, color: 'blue' },
                { label: 'Total Favorites', value: analytics?.totalFavorites || 0, icon: Heart, color: 'red' },
                { label: 'Total Downloads', value: analytics?.totalDownloads || 0, icon: Download, color: 'green' },
                { label: 'Active Galleries', value: analytics?.activeGalleries || 0, icon: Camera, color: 'purple' }
              ].map((stat) => {
                const Icon = stat.icon
                return (
                  <div key={stat.label} className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
                    <div className="flex items-center justify-between mb-4">
                      <Icon className={`h-8 w-8 text-${stat.color}-400`} />
                      <span className="text-2xl font-bold text-white">{stat.value.toLocaleString()}</span>
                    </div>
                    <h3 className="text-gray-300 font-medium">{stat.label}</h3>
                  </div>
                )
              })}
            </div>
            
            {/* Recent Activity */}
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
              <h3 className="text-xl font-semibold text-white mb-6">Recent Activity</h3>
              <div className="space-y-4">
                {analytics?.recentActivity?.map((activity, index) => (
                  <div key={index} className="flex items-center space-x-4 p-4 bg-white/5 rounded-lg">
                    <div className={`p-2 rounded-full ${
                      activity.type === 'view' ? 'bg-blue-500/20 text-blue-400' :
                      activity.type === 'favorite' ? 'bg-red-500/20 text-red-400' :
                      'bg-green-500/20 text-green-400'
                    }`}>
                      {activity.type === 'view' && <Eye className="h-4 w-4" />}
                      {activity.type === 'favorite' && <Heart className="h-4 w-4" />}
                      {activity.type === 'download' && <Download className="h-4 w-4" />}
                    </div>
                    <div className="flex-1">
                      <p className="text-white">
                        <span className="font-medium">{activity.client}</span>
                        {' '}{activity.type === 'view' ? 'viewed' : activity.type === 'favorite' ? 'favorited' : 'downloaded from'}{' '}
                        <span className="font-medium">{activity.gallery}</span>
                      </p>
                      <p className="text-sm text-gray-400">{activity.time}</p>
                    </div>
                  </div>
                )) || (
                  <div className="text-center py-8">
                    <p className="text-gray-400">No recent activity</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div>
            <h2 className="text-2xl font-bold text-white mb-8">Account Settings</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Profile Settings */}
              <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
                <h3 className="text-xl font-semibold text-white mb-6">Profile Information</h3>
                {profileLoading ? (
                  <div className="text-center py-8">
                    <p className="text-gray-400">Loading profile...</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Business Name</label>
                      <input
                        type="text"
                        value={profileForm.businessName}
                        onChange={(e) => setProfileForm(prev => ({ ...prev, businessName: e.target.value }))}
                        className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                        placeholder="Enter your business name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
                      <input
                        type="email"
                        value={profileForm.email}
                        onChange={(e) => setProfileForm(prev => ({ ...prev, email: e.target.value }))}
                        className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                        placeholder="Enter your email"
                        disabled
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Website</label>
                      <input
                        type="url"
                        value={profileForm.website}
                        onChange={(e) => setProfileForm(prev => ({ ...prev, website: e.target.value }))}
                        className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                        placeholder="https://your-website.com"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Phone</label>
                      <input
                        type="tel"
                        value={profileForm.phone}
                        onChange={(e) => setProfileForm(prev => ({ ...prev, phone: e.target.value }))}
                        className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                        placeholder="Enter your phone number"
                      />
                    </div>
                  </div>
                )}
              </div>
              
              {/* Gallery Defaults */}
              <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
                <h3 className="text-xl font-semibold text-white mb-6">Default Gallery Settings</h3>
                {profileLoading ? (
                  <div className="text-center py-8">
                    <p className="text-gray-400">Loading settings...</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Default Expiry (days)</label>
                      <input
                        type="number"
                        value={profileForm.defaultExpiry}
                        onChange={(e) => setProfileForm(prev => ({ ...prev, defaultExpiry: parseInt(e.target.value) || 90 }))}
                        className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                        min="1"
                        max="365"
                      />
                    </div>
                    <div>
                      <label className="flex items-center space-x-2">
                        <input 
                          type="checkbox" 
                          checked={profileForm.enableWatermarks}
                          onChange={(e) => setProfileForm(prev => ({ ...prev, enableWatermarks: e.target.checked }))}
                          className="rounded" 
                        />
                        <span className="text-gray-300">Enable watermarks by default</span>
                      </label>
                    </div>
                    <div>
                      <label className="flex items-center space-x-2">
                        <input 
                          type="checkbox" 
                          checked={profileForm.requireApproval}
                          onChange={(e) => setProfileForm(prev => ({ ...prev, requireApproval: e.target.checked }))}
                          className="rounded" 
                        />
                        <span className="text-gray-300">Require approval for downloads</span>
                      </label>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="mt-8">
              <button 
                onClick={saveProfile}
                disabled={profileSaving || profileLoading}
                className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg transition-colors flex items-center space-x-2"
              >
                {profileSaving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b border-white" style={{borderBottomWidth: '2px'}}></div>
                    <span>Saving...</span>
                  </>
                ) : (
                  <span>Save Settings</span>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create Gallery Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
            onClick={() => setShowCreateModal(false)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-bold text-white mb-6">Create New Gallery</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Gallery Title</label>
                  <input
                    type="text"
                    placeholder="Enter gallery title..."
                    value={createFormData.title}
                    onChange={(e) => setCreateFormData(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                  <textarea
                    placeholder="Gallery description..."
                    rows={3}
                    value={createFormData.description}
                    onChange={(e) => setCreateFormData(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                
                <div className="space-y-3">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={createFormData.isPublic}
                      onChange={(e) => setCreateFormData(prev => ({ ...prev, isPublic: e.target.checked }))}
                      className="rounded"
                    />
                    <span className="text-gray-300">Make gallery public</span>
                  </label>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3 mt-6">
                <button
                  onClick={() => {
                    handleCreateGallery(createFormData)
                    setCreateFormData({
                      title: '',
                      description: '',
                      isPublic: false
                    })
                  }}
                  disabled={!createFormData.title.trim()}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white py-2 rounded-lg transition-colors"
                >
                  Create Gallery
                </button>
                <button
                  onClick={() => {
                    setShowCreateModal(false)
                    setCreateFormData({
                      title: '',
                      description: '',
                      isPublic: false
                    })
                  }}
                  className="flex-1 bg-white/10 hover:bg-white/20 text-white py-2 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>




      {/* Invite Modal */}
      <InviteModal
        isOpen={!!showInviteModal}
        onClose={() => setShowInviteModal(null)}
        galleryId={showInviteModal?.id || ''}
        galleryTitle={showInviteModal?.title || ''}
      />

      {/* Delete Gallery Modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowDeleteModal(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-gray-900 rounded-xl p-6 w-full max-w-md border border-gray-800"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center">
                  <Trash2 className="w-5 h-5 text-red-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Delete Gallery</h3>
                  <p className="text-sm text-gray-400">This action cannot be undone</p>
                </div>
              </div>
              
              <p className="text-gray-300 mb-6">
                Are you sure you want to delete "{showDeleteModal.title}"? This will permanently remove the gallery and all its photos.
              </p>
              
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    handleDeleteGallery(showDeleteModal)
                    setShowDeleteModal(null)
                  }}
                  disabled={isDeleting}
                  className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white py-2 rounded-lg transition-colors"
                >
                  {isDeleting ? 'Deleting...' : 'Delete Gallery'}
                </button>
                <button
                  onClick={() => setShowDeleteModal(null)}
                  disabled={isDeleting}
                  className="flex-1 bg-white/10 hover:bg-white/20 disabled:bg-white/5 text-white py-2 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}