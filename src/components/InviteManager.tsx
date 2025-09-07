'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Mail, Copy, Edit, Trash2, Plus, Clock, CheckCircle, XCircle, AlertCircle, BarChart3, Users } from 'lucide-react'
import { useState, useEffect, useCallback } from 'react'
import { generateInviteCode } from '@/lib/utils'
import CreateInviteModal from './CreateInviteModal'
import InviteAnalytics from './InviteAnalytics'

interface Invite {
  id: string
  galleryId: string
  galleryTitle: string
  type: 'single-use' | 'multi-use' | 'time-limited'
  status: 'pending' | 'active' | 'expired' | 'revoked'
  clientEmail?: string
  inviteCode: string
  permissions: {
    canView: boolean
    canFavorite: boolean
    canComment: boolean
    canDownload: boolean
    canRequestPurchase: boolean
  }
  createdAt: string
  expiresAt?: string
  usedAt?: string
  usageCount: number
  maxUsage?: number
}

interface InviteManagerProps {
  galleryId?: string
  galleryTitle?: string
}

export default function InviteManager({ galleryId, galleryTitle }: InviteManagerProps) {
  const [invites, setInvites] = useState<Invite[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedInvite, setSelectedInvite] = useState<Invite | null>(null)
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'expired' | 'pending' | 'revoked'>('all')
  const [filterType, setFilterType] = useState<'all' | 'single-use' | 'multi-use' | 'time-limited'>('all')
  const [activeTab, setActiveTab] = useState<'invites' | 'analytics'>('invites')

  // Fetch invites from API
  const fetchInvites = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (filterStatus !== 'all') params.append('status', filterStatus)
      if (filterType !== 'all') params.append('type', filterType)
      
      const response = await fetch(`/api/gallery/${galleryId}/invites?${params}`)
      if (response.ok) {
        const data = await response.json()
        setInvites(data.invites)
      } else {
        console.error('Failed to fetch invites')
      }
    } catch (error) {
      console.error('Error fetching invites:', error)
    } finally {
      setLoading(false)
    }
  }, [galleryId, filterStatus, filterType])

  useEffect(() => {
    if (galleryId) {
      fetchInvites()
    }
  }, [galleryId, filterStatus, filterType, fetchInvites])

  // Filter invites based on gallery and filters
  const filteredInvites = invites.filter(invite => {
    if (galleryId && invite.galleryId !== galleryId) return false
    if (filterStatus !== 'all' && invite.status !== filterStatus) return false
    if (filterType !== 'all' && invite.type !== filterType) return false
    return true
  })

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="h-4 w-4 text-green-400" />
      case 'expired': return <Clock className="h-4 w-4 text-yellow-400" />
      case 'revoked': return <XCircle className="h-4 w-4 text-red-400" />
      case 'pending': return <AlertCircle className="h-4 w-4 text-blue-400" />
      default: return null
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500/20 text-green-400 border-green-500/30'
      case 'expired': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
      case 'revoked': return 'bg-red-500/20 text-red-400 border-red-500/30'
      case 'pending': return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    }
  }

  const copyInviteLink = (invite: Invite) => {
    const link = `${window.location.origin}/client/${invite.inviteCode}`
    navigator.clipboard.writeText(link)
    // In a real app, show a toast notification
    alert('Invite link copied to clipboard!')
  }

  const revokeInvite = async (inviteId: string) => {
    try {
      const response = await fetch(`/api/invite/${inviteId}/revoke`, {
        method: 'POST',
      })
      
      if (response.ok) {
        await fetchInvites() // Refresh the list
      } else {
        console.error('Failed to revoke invite')
      }
    } catch (error) {
      console.error('Error revoking invite:', error)
    }
  }

  const deleteInvite = async (inviteId: string) => {
    try {
      const response = await fetch(`/api/invite/${inviteId}`, {
        method: 'DELETE',
      })
      
      if (response.ok) {
        await fetchInvites() // Refresh the list
      } else {
        console.error('Failed to delete invite')
      }
    } catch (error) {
      console.error('Error deleting invite:', error)
    }
  }

  const resendInvite = async (inviteId: string) => {
    try {
      const response = await fetch(`/api/invite/${inviteId}/resend`, {
        method: 'POST',
      })
      
      if (response.ok) {
        // In a real app, show a toast notification
        alert('Invite resent successfully!')
      } else {
        console.error('Failed to resend invite')
      }
    } catch (error) {
      console.error('Error resending invite:', error)
    }
  }



  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">
            {galleryTitle ? `Invites for ${galleryTitle}` : 'All Invites'}
          </h2>
          <p className="text-gray-300">
            Manage client access and permissions for your galleries
          </p>
        </div>
        
        {activeTab === 'invites' && (
          <button
            onClick={() => setShowCreateModal(true)}
            disabled={loading}
            className="flex items-center space-x-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-600/50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Create Invite</span>
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-white/5 p-1 rounded-lg">
        <button
          onClick={() => setActiveTab('invites')}
          className={`flex items-center space-x-2 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            activeTab === 'invites'
              ? 'bg-purple-600 text-white'
              : 'text-gray-300 hover:text-white hover:bg-white/10'
          }`}
        >
          <Users className="h-4 w-4" />
          <span>Manage Invites</span>
        </button>
        <button
          onClick={() => setActiveTab('analytics')}
          className={`flex items-center space-x-2 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            activeTab === 'analytics'
              ? 'bg-purple-600 text-white'
              : 'text-gray-300 hover:text-white hover:bg-white/10'
          }`}
        >
          <BarChart3 className="h-4 w-4" />
          <span>Analytics</span>
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'invites' ? (
        <>
          {/* Filters */}
          <div className="flex flex-wrap gap-4">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as 'all' | 'active' | 'expired' | 'pending' | 'revoked')}
              className="bg-white/10 border border-white/20 rounded-lg text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="expired">Expired</option>
              <option value="revoked">Revoked</option>
            </select>
            
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as 'all' | 'single-use' | 'multi-use' | 'time-limited')}
              className="bg-white/10 border border-white/20 rounded-lg text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">All Types</option>
              <option value="single-use">Single Use</option>
              <option value="multi-use">Multi Use</option>
              <option value="time-limited">Time Limited</option>
            </select>
          </div>

          {/* Invites List */}
          <div className="space-y-4">
        {loading ? (
          <div className="text-center py-8 text-gray-500">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p>Loading invites...</p>
          </div>
        ) : filteredInvites.map((invite) => (
          <motion.div
            key={invite.id}
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 hover:border-white/20 transition-all"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <h3 className="text-lg font-semibold text-white">
                    {invite.clientEmail || `Invite ${invite.inviteCode}`}
                  </h3>
                  
                  <div className={`flex items-center space-x-1 px-2 py-1 rounded-full border text-xs font-medium ${
                    getStatusColor(invite.status)
                  }`}>
                    {getStatusIcon(invite.status)}
                    <span className="capitalize">{invite.status}</span>
                  </div>
                  
                  <div className="px-2 py-1 bg-white/10 rounded-full text-xs text-gray-300">
                    {invite.type.replace('-', ' ')}
                  </div>
                </div>
                
                <p className="text-gray-300 text-sm mb-2">
                  Gallery: {invite.galleryTitle}
                </p>
                
                <div className="flex items-center space-x-4 text-sm text-gray-400">
                  <span>Code: {invite.inviteCode}</span>
                  <span>•</span>
                  <span>Created: {new Date(invite.createdAt).toLocaleDateString()}</span>
                  {invite.expiresAt && (
                    <>
                      <span>•</span>
                      <span>Expires: {new Date(invite.expiresAt).toLocaleDateString()}</span>
                    </>
                  )}
                  <span>•</span>
                  <span>Used: {invite.usageCount}{invite.maxUsage ? `/${invite.maxUsage}` : ''}</span>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => copyInviteLink(invite)}
                  className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                  title="Copy invite link"
                >
                  <Copy className="h-4 w-4 text-white" />
                </button>
                
                <button
                  onClick={() => setSelectedInvite(invite)}
                  className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                  title="Edit invite"
                >
                  <Edit className="h-4 w-4 text-white" />
                </button>
                
                {invite.status === 'active' && (
                  <button
                    onClick={() => revokeInvite(invite.id)}
                    className="p-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg transition-colors"
                    title="Revoke invite"
                  >
                    <XCircle className="h-4 w-4 text-red-400" />
                  </button>
                )}
                
                {invite.clientEmail && (
                    <button
                      onClick={() => resendInvite(invite.id)}
                      className="p-2 bg-blue-500/20 hover:bg-blue-500/30 rounded-lg transition-colors"
                      title="Resend invite email"
                    >
                      <Mail className="h-4 w-4 text-blue-400" />
                    </button>
                  )}
                  
                  <button
                    onClick={() => deleteInvite(invite.id)}
                    className="p-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg transition-colors"
                    title="Delete invite"
                  >
                    <Trash2 className="h-4 w-4 text-red-400" />
                  </button>
              </div>
            </div>
            
            {/* Permissions */}
            <div className="border-t border-white/10 pt-4">
              <h4 className="text-sm font-medium text-gray-300 mb-2">Permissions</h4>
              <div className="flex flex-wrap gap-2">
                {Object.entries(invite.permissions).map(([key, value]) => (
                  <div
                    key={key}
                    className={`flex items-center space-x-1 px-2 py-1 rounded text-xs ${
                      value 
                        ? 'bg-green-500/20 text-green-400' 
                        : 'bg-gray-500/20 text-gray-400'
                    }`}
                  >
                    {value ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                    <span>{key.replace('can', '').toLowerCase()}</span>
                   </div>
                 ))}
                </div>
             </div>
          </motion.div>
        ))}
           </div>

           {filteredInvites.length === 0 && (
             <div className="text-center py-12">
               <Mail className="h-12 w-12 text-gray-400 mx-auto mb-4" />
               <h3 className="text-xl font-semibold text-white mb-2">No invites found</h3>
               <p className="text-gray-400 mb-4">Create your first invite to get started</p>
               <button
                 onClick={() => setShowCreateModal(true)}
                 className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg transition-colors"
               >
                 Create Invite
               </button>
             </div>
           )}
         </>
       ) : (
         galleryId && <InviteAnalytics galleryId={galleryId} />
       )}

      {/* Create Invite Modal */}
      {galleryId && galleryTitle && (
        <CreateInviteModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          galleryId={galleryId}
          galleryTitle={galleryTitle}
          onInviteCreated={fetchInvites}
        />
      )}

      {/* Edit Invite Modal */}
      <AnimatePresence>
        {selectedInvite && (
          <EditInviteModal
            invite={selectedInvite}
            onClose={() => setSelectedInvite(null)}
            onUpdate={(updatedInvite) => {
              setInvites(prev => prev.map(invite => 
                invite.id === updatedInvite.id ? updatedInvite : invite
              ))
              setSelectedInvite(null)
            }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}



// Edit Invite Modal Component
function EditInviteModal({ 
  invite, 
  onClose, 
  onUpdate 
}: { 
  invite: Invite
  onClose: () => void
  onUpdate: (invite: Invite) => void
}) {
  const [formData, setFormData] = useState({
    clientEmail: invite.clientEmail || '',
    expiresAt: invite.expiresAt ? new Date(invite.expiresAt).toISOString().slice(0, 16) : '',
    maxUsage: invite.maxUsage || 1,
    permissions: { ...invite.permissions }
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onUpdate({
      ...invite,
      clientEmail: formData.clientEmail,
      expiresAt: formData.expiresAt ? new Date(formData.expiresAt).toISOString() : undefined,
      maxUsage: formData.maxUsage,
      permissions: formData.permissions
    })
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 max-w-lg w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-xl font-bold text-white mb-6">Edit Invite</h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Invite Code</label>
            <input
              type="text"
              value={invite.inviteCode}
              disabled
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-gray-400"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Client Email</label>
            <input
              type="email"
              value={formData.clientEmail}
              onChange={(e) => setFormData(prev => ({ ...prev, clientEmail: e.target.value }))}
              placeholder="client@example.com"
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Expiry Date</label>
            <input
              type="datetime-local"
              value={formData.expiresAt}
              onChange={(e) => setFormData(prev => ({ ...prev, expiresAt: e.target.value }))}
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          
          {invite.type === 'multi-use' && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Max Usage Count</label>
              <input
                type="number"
                min="1"
                value={formData.maxUsage}
                onChange={(e) => setFormData(prev => ({ ...prev, maxUsage: parseInt(e.target.value) }))}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">Permissions</label>
            <div className="space-y-2">
              {Object.entries(formData.permissions).map(([key, value]) => (
                <label key={key} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={value}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      permissions: {
                        ...prev.permissions,
                        [key]: e.target.checked
                      }
                    }))}
                    className="rounded"
                  />
                  <span className="text-gray-300 capitalize">
                    {key.replace('can', 'Can ')}
                  </span>
                </label>
              ))}
            </div>
          </div>
          
          <div className="flex space-x-3 mt-6">
            <button
              type="submit"
              className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-lg transition-colors"
            >
              Update Invite
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-white/10 hover:bg-white/20 text-white py-2 rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  )
}