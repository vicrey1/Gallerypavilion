'use client'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { motion } from 'framer-motion'
import Image from 'next/image'
import { 
  Users, 
  Camera, 
  BarChart3, 
  Settings, 
  Shield, 
  AlertTriangle,
  XCircle,
  Eye,
  Palette,
  UserCheck,
  Activity,
  Loader2,
  Database,
  Server,
  Wifi,
  LogOut,
  X,
  Image as ImageIcon
} from 'lucide-react'

interface AdminStats {
  totalPhotographers: number
  totalClients: number
  totalGalleries: number
  totalPhotos: number
  pendingApprovals: number
  activeInvites: number
  totalViews: number
  totalArtworks: number
  pendingPhotographers?: number
  recentViews?: number
  recentDownloads?: number
  totalDownloads?: number
}

interface Photographer {
  id: string
  user: {
    name: string
    email: string
  }
  status: string
  _count: {
    galleries: number
  }
  createdAt: string
}

interface Client {
  id: string
  user: {
    name: string
    email: string
  }
  _count: {
    favorites: number
    comments: number
  }
  createdAt: string
}

interface Gallery {
  id: string
  title: string
  status: string
  visibility: string
  photographer: {
    user: {
      name: string
      email: string
    }
  }
  stats: {
    views: number
    certificates: number
    photos: number
    invites: number
  }
  coverPhoto: {
    thumbnailUrl: string
  } | null
  createdAt: string
}

interface SystemSettings {
  autoApprovePhotographers: string
  emailNotifications: string
  maxUploadSize: string
  allowGuestAccess: string
  maintenanceMode: string
  analyticsEnabled: string
}

interface SystemHealth {
  status: string
  timestamp: string
  checks: {
    database: { status: string; responseTime: number; error: string | null }
    storage: { status: string; freeSpace: number; error: string | null }
    memory: { status: string; usage: number; total: number }
    uptime: number
  }
}

interface Activity {
  id: string
  type: string
  title: string
  description: string
  timestamp: string
  status: string
  metadata?: Record<string, string | number | boolean | null>
}

export default function AdminPanel() {
  const { data: session } = useSession()
  const [activeTab, setActiveTab] = useState('overview')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [stats, setStats] = useState<AdminStats>({
    totalPhotographers: 0,
    totalClients: 0,
    totalGalleries: 0,
    totalPhotos: 0,
    pendingApprovals: 0,
    activeInvites: 0,
    totalViews: 0,
    totalArtworks: 0
  })
  const [photographers, setPhotographers] = useState<Photographer[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [galleries, setGalleries] = useState<Gallery[]>([])
  const [systemSettings, setSystemSettings] = useState<SystemSettings>({
    autoApprovePhotographers: 'false',
    emailNotifications: 'true',
    maxUploadSize: '10',
    allowGuestAccess: 'false',
    maintenanceMode: 'false',
    analyticsEnabled: 'true'
  })
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null)
  const [activities, setActivities] = useState<Activity[]>([])  
  const [selectedPhotographer, setSelectedPhotographer] = useState<Photographer | null>(null)
  const [showPhotographerModal, setShowPhotographerModal] = useState(false)

  // Fetch admin data
  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        setLoading(true)
        setError(null)
        
        // Fetch stats
        const statsResponse = await fetch('/api/admin/stats')
        const statsData = await statsResponse.json()
        if (!statsResponse.ok) {
          console.warn('Stats fetch warning:', statsData)
          // Use default stats if fetch fails
          setStats({
            totalPhotographers: 0,
            totalClients: 0,
            totalGalleries: 0,
            totalPhotos: 0,
            pendingPhotographers: 0,
            pendingApprovals: 0,
            totalArtworks: 0,
            activeInvites: 0,
            recentViews: 0,
            recentDownloads: 0,
            totalViews: 0,
            totalDownloads: 0
          })
        } else {
          setStats(statsData)
        }

        // Fetch photographers
         const photographersResponse = await fetch('/api/admin/photographers')
         if (!photographersResponse.ok) {
           throw new Error(`Failed to fetch photographers: ${photographersResponse.status}`)
         }
         const photographersData = await photographersResponse.json()
         setPhotographers(photographersData.photographers || [])
 
         // Fetch clients
         const clientsResponse = await fetch('/api/admin/clients')
         if (!clientsResponse.ok) {
           throw new Error(`Failed to fetch clients: ${clientsResponse.status}`)
         }
         const clientsData = await clientsResponse.json()
         setClients(clientsData.clients || [])
 
         // Fetch galleries
         const galleriesResponse = await fetch('/api/admin/galleries')
         if (!galleriesResponse.ok) {
           throw new Error(`Failed to fetch galleries: ${galleriesResponse.status}`)
         }
         const galleriesData = await galleriesResponse.json()
         setGalleries(galleriesData.galleries || [])

        // Fetch system settings
         const settingsResponse = await fetch('/api/admin/system')
         if (!settingsResponse.ok) {
           throw new Error(`Failed to fetch system settings: ${settingsResponse.status}`)
         }
         const settingsData = await settingsResponse.json()
         setSystemSettings(settingsData.settings)
 
         // Fetch system health
         const healthResponse = await fetch('/api/admin/health')
         if (!healthResponse.ok) {
           throw new Error(`Failed to fetch system health: ${healthResponse.status}`)
         }
         const healthData = await healthResponse.json()
          setSystemHealth(healthData)
 
          // Fetch activities
          const activitiesResponse = await fetch('/api/admin/activities?limit=10')
          if (!activitiesResponse.ok) {
            throw new Error(`Failed to fetch activities: ${activitiesResponse.status}`)
          }
          const activitiesData = await activitiesResponse.json()
          setActivities(activitiesData.activities || [])
      } catch (error) {
        console.error('Error fetching admin data:', error)
        setError(error instanceof Error ? error.message : 'Failed to load admin data')
      } finally {
        setLoading(false)
      }
    }

    if (session?.user?.role === 'admin') {
      fetchAdminData()
    }
  }, [session])

  const fetchPhotographers = async () => {
    try {
      const photographersResponse = await fetch('/api/admin/photographers')
      if (!photographersResponse.ok) {
        throw new Error(`Failed to fetch photographers: ${photographersResponse.status}`)
      }
      const photographersData = await photographersResponse.json()
      setPhotographers(photographersData.photographers || [])
    } catch (error) {
      console.error('Error fetching photographers:', error)
    }
  }

  const handleApprovePhotographer = async (photographerId: string) => {
     try {
       setActionLoading(`approve-${photographerId}`)
       const response = await fetch('/api/admin/photographers', {
         method: 'PUT',
         headers: {
           'Content-Type': 'application/json'
         },
         body: JSON.stringify({
           photographerId,
           action: 'approve'
         })
       })
       
       if (!response.ok) {
         throw new Error(`Failed to approve photographer: ${response.status}`)
       }
       
       // Refresh photographers list
       const photographersResponse = await fetch('/api/admin/photographers')
       if (photographersResponse.ok) {
         const photographersData = await photographersResponse.json()
         setPhotographers(photographersData.photographers)
       }
       
       // Refresh stats
       const statsResponse = await fetch('/api/admin/stats')
       if (statsResponse.ok) {
         const statsData = await statsResponse.json()
         setStats(statsData)
       }
     } catch (error) {
       console.error('Error approving photographer:', error)
       setError(error instanceof Error ? error.message : 'Failed to approve photographer')
     } finally {
       setActionLoading(null)
     }
   }
 
   const handleRejectPhotographer = async (photographerId: string) => {
     try {
       setActionLoading(`reject-${photographerId}`)
       const response = await fetch('/api/admin/photographers', {
         method: 'PUT',
         headers: {
           'Content-Type': 'application/json'
         },
         body: JSON.stringify({
           photographerId,
           action: 'reject'
         })
       })
       
       if (!response.ok) {
         throw new Error(`Failed to reject photographer: ${response.status}`)
       }
       
       // Refresh photographers list
       const photographersResponse = await fetch('/api/admin/photographers')
       if (photographersResponse.ok) {
         const photographersData = await photographersResponse.json()
         setPhotographers(photographersData.photographers)
       }
       
       // Refresh stats
       const statsResponse = await fetch('/api/admin/stats')
       if (statsResponse.ok) {
         const statsData = await statsResponse.json()
         setStats(statsData)
       }
     } catch (error) {
       console.error('Error rejecting photographer:', error)
       setError(error instanceof Error ? error.message : 'Failed to reject photographer')
     } finally {
       setActionLoading(null)
     }
   }

  const handleUpdateSettings = async (key: string, value: string) => {
     try {
       setActionLoading('update-settings')
       const response = await fetch('/api/admin/system', {
         method: 'PUT',
         headers: {
           'Content-Type': 'application/json'
         },
         body: JSON.stringify({ 
           settings: { [key]: value }
         })
       })
       
       if (!response.ok) {
         throw new Error(`Failed to update settings: ${response.status}`)
       }
       
       setSystemSettings(prev => ({ ...prev, [key]: value }))
     } catch (error) {
       console.error('Error updating settings:', error)
       setError(error instanceof Error ? error.message : 'Failed to update settings')
     } finally {
       setActionLoading(null)
     }
   }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'photographers', label: 'Photographers', icon: Camera },
    { id: 'clients', label: 'Clients', icon: Users },
    { id: 'galleries', label: 'Galleries', icon: ImageIcon },
    { id: 'system', label: 'System', icon: Settings }
  ]

  const StatCard = ({ title, value, icon: Icon, color, trend }: {
    title: string
    value: number | string
    icon: React.ComponentType<{ className?: string }>
    color: string
    trend?: string
  }) => (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className="bg-white rounded-xl p-6 shadow-lg border border-gray-200"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600 text-sm font-medium">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
          {trend && (
            <p className="text-green-600 text-sm mt-1">{trend}</p>
          )}
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </motion.div>
  )

  const renderOverview = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Photographers"
          value={stats.totalPhotographers}
          icon={Camera}
          color="bg-blue-500"
          trend="+2 this week"
        />
        <StatCard
          title="Total Clients"
          value={stats.totalClients}
          icon={Users}
          color="bg-green-500"
          trend="+15 this week"
        />
        <StatCard
          title="Total Galleries"
          value={stats.totalGalleries}
          icon={ImageIcon}
          color="bg-purple-500"
          trend="+5 this week"
        />
        <StatCard
          title="Total Photos"
          value={stats.totalPhotos.toLocaleString()}
          icon={Eye}
          color="bg-orange-500"
          trend="+234 this week"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Pending Approvals"
          value={stats.pendingApprovals}
          icon={AlertTriangle}
          color="bg-red-500"
        />
        <StatCard
          title="Active Invites"
          value={stats.activeInvites}
          icon={UserCheck}
          color="bg-indigo-500"
        />
        <StatCard
          title="Total Views"
          value={stats.totalViews.toLocaleString()}
          icon={Activity}
          color="bg-teal-500"
          trend="+1.2k today"
        />
        <StatCard
          title="Total Artworks"
            value={stats.totalArtworks}
            icon={Palette}
          color="bg-pink-500"
          trend="+45 today"
        />
      </div>

      <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
        <div className="space-y-3">
          {activities.length > 0 ? (
            activities.map((activity) => {
              const getActivityIcon = (type: string) => {
                switch (type) {
                  case 'photographer_registration':
                    return <Users className="w-5 h-5 text-blue-500" />
                  case 'gallery_created':
                    return <ImageIcon className="w-5 h-5 text-green-500" />
                  case 'client_registration':
                    return <Users className="w-5 h-5 text-purple-500" />
                  case 'purchase_request':
                    return <Camera className="w-5 h-5 text-orange-500" />
                  default:
                    return <Activity className="w-5 h-5 text-gray-500" />
                }
              }

              return (
                <div key={activity.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    {getActivityIcon(activity.type)}
                    <span className="text-gray-700">{activity.description}</span>
                  </div>
                  <span className="text-gray-500 text-sm">
                    {new Date(activity.timestamp).toLocaleString()}
                  </span>
                </div>
              )
            })
          ) : (
            <div className="text-center py-8 text-gray-500">
              No recent activities
            </div>
          )}
        </div>
      </div>

      {/* Photographer Details Modal */}
      {showPhotographerModal && selectedPhotographer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Photographer Details</h2>
              <button
                onClick={() => {
                  setShowPhotographerModal(false)
                  setSelectedPhotographer(null)
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="space-y-6">
              {/* Basic Information */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Basic Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Name</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedPhotographer.user.name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedPhotographer.user.email}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Status</label>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      selectedPhotographer.status === 'approved' 
                        ? 'bg-green-100 text-green-800'
                        : selectedPhotographer.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {selectedPhotographer.status.charAt(0).toUpperCase() + selectedPhotographer.status.slice(1)}
                    </span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Member Since</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {new Date(selectedPhotographer.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Statistics */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Statistics</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">{selectedPhotographer._count.galleries}</div>
                    <div className="text-sm text-gray-600">Galleries</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">0</div>
                    <div className="text-sm text-gray-600">Total Photos</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">0</div>
                    <div className="text-sm text-gray-600">Total Views</div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              {selectedPhotographer.status === 'approved' && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Actions</h3>
                  <div className="flex space-x-3">
                    <button
                      onClick={async () => {
                        try {
                          const response = await fetch(`/api/admin/photographers/${selectedPhotographer.id}`, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ status: 'suspended' })
                          })
                          if (response.ok) {
                            setShowPhotographerModal(false)
                            setSelectedPhotographer(null)
                            fetchPhotographers()
                          }
                        } catch (error) {
                          console.error('Error suspending photographer:', error)
                        }
                      }}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                      Suspend Account
                    </button>
                    <button
                      onClick={() => window.open(`mailto:${selectedPhotographer.user.email}`, '_blank')}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Send Email
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )

  const renderPhotographers = () => (
    <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Photographer Management</h3>
        <div className="flex space-x-2">
          <span className="text-sm text-gray-600">
            {photographers.filter(p => p.status === 'pending').length} pending approval
          </span>
        </div>
      </div>
      
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          <span className="ml-2 text-gray-600">Loading photographers...</span>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-medium text-gray-700">Name</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Email</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Galleries</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Joined</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {photographers.map((photographer) => (
                <tr key={photographer.id} className="border-b border-gray-100">
                  <td className="py-3 px-4">{photographer.user.name}</td>
                  <td className="py-3 px-4">{photographer.user.email}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded-full text-sm ${
                      photographer.status === 'approved' 
                        ? 'bg-green-100 text-green-800'
                        : photographer.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {photographer.status.charAt(0).toUpperCase() + photographer.status.slice(1)}
                    </span>
                  </td>
                  <td className="py-3 px-4">{photographer._count.galleries}</td>
                  <td className="py-3 px-4">
                    {new Date(photographer.createdAt).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4">
                    {photographer.status === 'pending' ? (
                      <div className="flex space-x-2">
                        <button 
                          onClick={() => handleApprovePhotographer(photographer.id)}
                          disabled={actionLoading === `approve-${photographer.id}`}
                          className="text-green-600 hover:text-green-800 text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                        >
                          {actionLoading === `approve-${photographer.id}` && (
                            <Loader2 className="w-3 h-3 animate-spin mr-1" />
                          )}
                          Approve
                        </button>
                        <button 
                          onClick={() => handleRejectPhotographer(photographer.id)}
                          disabled={actionLoading === `reject-${photographer.id}`}
                          className="text-red-600 hover:text-red-800 text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                        >
                          {actionLoading === `reject-${photographer.id}` && (
                            <Loader2 className="w-3 h-3 animate-spin mr-1" />
                          )}
                          Reject
                        </button>
                      </div>
                    ) : (
                      <button 
                        onClick={() => {
                          setSelectedPhotographer(photographer)
                          setShowPhotographerModal(true)
                        }}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        View Details
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {photographers.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No photographers found
            </div>
          )}
        </div>
      )}
    </div>
  )

  const renderClients = () => (
    <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">Client Management</h3>
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          <span className="ml-2 text-gray-600">Loading clients...</span>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-medium text-gray-700">Name</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Email</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Favorites</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Comments</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Joined</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {clients.map((client) => (
                <tr key={client.id} className="border-b border-gray-100">
                  <td className="py-3 px-4">{client.user.name}</td>
                  <td className="py-3 px-4">{client.user.email}</td>
                  <td className="py-3 px-4">{client._count.favorites}</td>
                  <td className="py-3 px-4">{client._count.comments}</td>
                  <td className="py-3 px-4">
                    {new Date(client.createdAt).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4">
                    <button className="text-blue-600 hover:text-blue-800 mr-3 text-sm">View</button>
                    <button className="text-red-600 hover:text-red-800 text-sm">Remove</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {clients.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No clients found
            </div>
          )}
        </div>
      )}
    </div>
  )

  const renderGalleries = () => (
    <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">Gallery Management</h3>
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          <span className="ml-2 text-gray-600">Loading galleries...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {galleries.map((gallery) => (
            <div key={gallery.id} className="border border-gray-200 rounded-lg p-4">
              <div className="aspect-video bg-gray-200 rounded-lg mb-3 overflow-hidden">
                {gallery.coverPhoto?.thumbnailUrl ? (
                  <Image 
                    src={gallery.coverPhoto.thumbnailUrl} 
                    alt={gallery.title}
                    width={400}
                    height={225}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageIcon className="w-8 h-8 text-gray-400" />
                  </div>
                )}
              </div>
              <h4 className="font-medium text-gray-900 truncate">{gallery.title}</h4>
              <p className="text-gray-600 text-sm">by {gallery.photographer.user.name}</p>
              <p className="text-gray-500 text-sm">
                {gallery.stats.photos} artworks • {gallery.stats.views} views • {gallery.stats.certificates} certificates
              </p>
              <div className="mt-2 flex items-center space-x-2">
                <span className={`px-2 py-1 rounded-full text-xs ${
                  gallery.status === 'published' 
                    ? 'bg-green-100 text-green-800'
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {gallery.status}
                </span>
                <span className={`px-2 py-1 rounded-full text-xs ${
                  gallery.visibility === 'public' 
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {gallery.visibility}
                </span>
              </div>
              <div className="mt-3 flex space-x-2">
                <button className="text-blue-600 hover:text-blue-800 text-sm">View</button>
                <button className="text-red-600 hover:text-red-800 text-sm">Archive</button>
              </div>
            </div>
          ))}
        </div>
      )}
      {galleries.length === 0 && !loading && (
        <div className="text-center py-8 text-gray-500">
          No galleries found
        </div>
      )}
    </div>
  )

  const renderSystem = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">System Settings</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <h4 className="font-medium text-gray-900">Auto-approve photographers</h4>
              <p className="text-gray-600 text-sm">Automatically approve new photographer registrations</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer" 
                checked={systemSettings.autoApprovePhotographers === 'true'}
                onChange={(e) => handleUpdateSettings('autoApprovePhotographers', e.target.checked ? 'true' : 'false')}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
          
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <h4 className="font-medium text-gray-900">Email notifications</h4>
              <p className="text-gray-600 text-sm">Send email notifications for system events</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer" 
                checked={systemSettings.emailNotifications === 'true'}
                onChange={(e) => handleUpdateSettings('emailNotifications', e.target.checked ? 'true' : 'false')}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <h4 className="font-medium text-gray-900">Maintenance mode</h4>
              <p className="text-gray-600 text-sm">Enable maintenance mode for system updates</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer" 
                checked={systemSettings.maintenanceMode === 'true'}
                onChange={(e) => handleUpdateSettings('maintenanceMode', e.target.checked ? 'true' : 'false')}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">System Health</h3>
        {!systemHealth ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            <span className="ml-2 text-gray-600">Checking system health...</span>
          </div>
        ) : (
          <>
            <div className={`mb-4 p-3 rounded-lg text-center ${
              systemHealth.status === 'healthy' ? 'bg-green-50 text-green-800' :
              systemHealth.status === 'warning' ? 'bg-yellow-50 text-yellow-800' :
              'bg-red-50 text-red-800'
            }`}>
              <p className="font-medium">Overall Status: {systemHealth.status.toUpperCase()}</p>
              <p className="text-sm opacity-75">Last checked: {new Date(systemHealth.timestamp).toLocaleString()}</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className={`text-center p-4 rounded-lg ${
                systemHealth.checks.database.status === 'healthy' ? 'bg-green-50' : 'bg-red-50'
              }`}>
                {systemHealth.checks.database.status === 'healthy' ? (
                  <Database className="w-8 h-8 text-green-500 mx-auto mb-2" />
                ) : (
                  <XCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
                )}
                <p className={`font-medium ${
                  systemHealth.checks.database.status === 'healthy' ? 'text-green-900' : 'text-red-900'
                }`}>Database</p>
                <p className={`text-sm ${
                  systemHealth.checks.database.status === 'healthy' ? 'text-green-700' : 'text-red-700'
                }`}>
                  {systemHealth.checks.database.error || `${systemHealth.checks.database.responseTime}ms`}
                </p>
              </div>
              <div className={`text-center p-4 rounded-lg ${
                systemHealth.checks.storage.status === 'healthy' ? 'bg-green-50' : 'bg-red-50'
              }`}>
                {systemHealth.checks.storage.status === 'healthy' ? (
                  <Server className="w-8 h-8 text-green-500 mx-auto mb-2" />
                ) : (
                  <XCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
                )}
                <p className={`font-medium ${
                  systemHealth.checks.storage.status === 'healthy' ? 'text-green-900' : 'text-red-900'
                }`}>Storage</p>
                <p className={`text-sm ${
                  systemHealth.checks.storage.status === 'healthy' ? 'text-green-700' : 'text-red-700'
                }`}>
                  {systemHealth.checks.storage.error || 'Available'}
                </p>
              </div>
              <div className={`text-center p-4 rounded-lg ${
                systemHealth.checks.memory.status === 'healthy' ? 'bg-green-50' : 
                systemHealth.checks.memory.status === 'warning' ? 'bg-yellow-50' : 'bg-red-50'
              }`}>
                {systemHealth.checks.memory.status === 'healthy' ? (
                  <Wifi className="w-8 h-8 text-green-500 mx-auto mb-2" />
                ) : systemHealth.checks.memory.status === 'warning' ? (
                  <AlertTriangle className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
                ) : (
                  <XCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
                )}
                <p className={`font-medium ${
                  systemHealth.checks.memory.status === 'healthy' ? 'text-green-900' : 
                  systemHealth.checks.memory.status === 'warning' ? 'text-yellow-900' : 'text-red-900'
                }`}>Memory</p>
                <p className={`text-sm ${
                  systemHealth.checks.memory.status === 'healthy' ? 'text-green-700' : 
                  systemHealth.checks.memory.status === 'warning' ? 'text-yellow-700' : 'text-red-700'
                }`}>
                  {systemHealth.checks.memory.usage}% ({systemHealth.checks.memory.total}MB)
                </p>
              </div>
            </div>
            <div className="mt-4 text-center text-sm text-gray-600">
              Uptime: {Math.floor(systemHealth.checks.uptime / 3600)}h {Math.floor((systemHealth.checks.uptime % 3600) / 60)}m
            </div>
           </>
         )}
       </div>
    </div>
  )

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverview()
      case 'photographers':
        return renderPhotographers()
      case 'clients':
        return renderClients()
      case 'galleries':
        return renderGalleries()
      case 'system':
        return renderSystem()
      default:
        return renderOverview()
    }
  }

  if (!session || session.user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600">You do not have permission to access this page.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <Shield className="w-8 h-8 text-purple-600" />
              <h1 className="text-xl font-bold text-gray-900">Admin Panel</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">Welcome, {session.user.name}</span>
              <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-medium">
                  {session.user.name?.charAt(0) || 'A'}
                </span>
              </div>
              <button
                onClick={() => signOut({ callbackUrl: '/' })}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <AlertTriangle className="w-5 h-5 text-red-500 mr-2" />
              <span className="text-red-700">{error}</span>
              <button 
                onClick={() => setError(null)}
                className="ml-auto text-red-500 hover:text-red-700"
              >
                <XCircle className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <div className="lg:w-64">
            <nav className="space-y-2">
              {tabs.map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
                      activeTab === tab.id
                        ? 'bg-purple-600 text-white'
                        : 'text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{tab.label}</span>
                  </button>
                )
              })}
            </nav>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {renderContent()}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}