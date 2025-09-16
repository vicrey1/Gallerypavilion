import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import { 
  PlusIcon, 
  TrashIcon, 
  ClipboardDocumentIcon,
  EyeIcon,
  CalendarIcon,
  UserGroupIcon,
  PaperAirplaneIcon,
  EnvelopeIcon,
  UserIcon
} from '@heroicons/react/24/outline';

const InviteManager = ({ galleryId, isInviteOnly }) => {
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newInvite, setNewInvite] = useState({
    expiresAt: '',
    maxUses: 1,
    description: ''
  });
  const [emailInvite, setEmailInvite] = useState({
    recipientEmail: '',
    recipientName: '',
    expiresAt: '',
    maxUses: 1
  });
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);

  useEffect(() => {
    if (isInviteOnly) {
      fetchInvitations();
    }
  }, [galleryId, isInviteOnly]);

  const fetchInvitations = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/invitations/gallery/${galleryId}`);
      setInvitations(response.data.data?.invitations || []);
    } catch (error) {
      console.error('Error fetching invitations:', error);
      toast.error('Failed to load invitations');
    } finally {
      setLoading(false);
    }
  };

  const createInvitation = async (e) => {
    e.preventDefault();
    setCreating(true);
    
    try {
      const response = await axios.post('/invitations/create', {
        galleryId,
        ...newInvite,
        expiresAt: newInvite.expiresAt || undefined
      });
      
      setInvitations(prev => [response.data.data, ...prev]);
      setNewInvite({ expiresAt: '', maxUses: 1, description: '' });
      setShowCreateForm(false);
      toast.success('Invitation created successfully!');
    } catch (error) {
      console.error('Error creating invitation:', error);
      toast.error(error.response?.data?.message || 'Failed to create invitation');
    } finally {
      setCreating(false);
    }
  };

  const sendEmailInvitation = async (e) => {
    e.preventDefault();
    setSendingEmail(true);
    
    try {
      const response = await axios.post('/invitations/send', {
        galleryId,
        ...emailInvite,
        expiresAt: emailInvite.expiresAt || undefined
      });
      
      setInvitations(prev => [response.data.data.invitation, ...prev]);
      setEmailInvite({
        recipientEmail: '',
        recipientName: '',
        expiresAt: '',
        maxUses: 1
      });
      setShowEmailForm(false);
      
      if (response.data.data.emailSent) {
        toast.success('Invitation sent successfully!');
        if (response.data.data.previewUrl) {
          console.log('Email preview:', response.data.data.previewUrl);
        }
      } else {
        toast.success('Invitation created, but email sending failed. Please check your email configuration.');
      }
    } catch (error) {
      console.error('Error sending invitation:', error);
      toast.error(error.response?.data?.message || 'Failed to send invitation');
    } finally {
      setSendingEmail(false);
    }
  };

  const deleteInvitation = async (inviteId) => {
    if (!window.confirm('Are you sure you want to delete this invitation?')) {
      return;
    }
    
    try {
      await axios.delete(`/invitations/${inviteId}`);
      setInvitations(prev => prev.filter(inv => inv._id !== inviteId));
      toast.success('Invitation deleted successfully!');
    } catch (error) {
      console.error('Error deleting invitation:', error);
      toast.error('Failed to delete invitation');
    }
  };

  const copyInviteCode = (code) => {
    navigator.clipboard.writeText(code);
    toast.success('Invitation code copied to clipboard!');
  };

  const copyInviteUrl = (code) => {
    const url = `${window.location.origin}/gallery/view?invite=${code}`;
    navigator.clipboard.writeText(url);
    toast.success('Invitation URL copied to clipboard!');
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isInviteOnly) {
    return (
      <div className="bg-gray-50 rounded-lg p-6 text-center">
        <UserGroupIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Invite Management</h3>
        <p className="text-gray-600 mb-4">
          Enable "Invite-only access" in gallery settings to manage invitations.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Invitation Management</h3>
          <p className="text-sm text-gray-600">
            Create and manage invitation codes for this gallery
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowEmailForm(true)}
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 flex items-center space-x-2 shadow-lg"
          >
            <PaperAirplaneIcon className="w-4 h-4" />
            <span>Send Invitation</span>
          </button>
          <button
            onClick={() => setShowCreateForm(true)}
            className="btn-primary flex items-center space-x-2"
          >
            <PlusIcon className="w-4 h-4" />
            <span>Create Code</span>
          </button>
        </div>
      </div>

      {/* Send Email Invitation Form */}
      {showEmailForm && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-blue-200 rounded-xl p-6 shadow-lg"
        >
          <div className="flex items-center space-x-3 mb-4">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-2 rounded-lg">
              <EnvelopeIcon className="w-5 h-5 text-white" />
            </div>
            <h4 className="text-xl font-semibold text-gray-900">Send Professional Invitation</h4>
          </div>
          <p className="text-gray-600 mb-6">Send a beautifully designed invitation email with automatic access link generation.</p>
          
          <form onSubmit={sendEmailInvitation} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <EnvelopeIcon className="w-4 h-4 inline mr-1" />
                  Recipient Email *
                </label>
                <input
                  type="email"
                  value={emailInvite.recipientEmail}
                  onChange={(e) => setEmailInvite(prev => ({ ...prev, recipientEmail: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="recipient@example.com"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <UserIcon className="w-4 h-4 inline mr-1" />
                  Recipient Name
                </label>
                <input
                  type="text"
                  value={emailInvite.recipientName}
                  onChange={(e) => setEmailInvite(prev => ({ ...prev, recipientName: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="John Doe"
                />
              </div>
            </div>
            

            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <CalendarIcon className="w-4 h-4 inline mr-1" />
                  Expiration Date
                </label>
                <input
                  type="datetime-local"
                  value={emailInvite.expiresAt}
                  onChange={(e) => setEmailInvite(prev => ({ ...prev, expiresAt: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  min={new Date().toISOString().slice(0, 16)}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Maximum Uses
                </label>
                <input
                  type="number"
                  min="1"
                  max="1000"
                  value={emailInvite.maxUses}
                  onChange={(e) => setEmailInvite(prev => ({ ...prev, maxUses: parseInt(e.target.value) }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  required
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={() => setShowEmailForm(false)}
                className="px-6 py-3 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={sendingEmail}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 font-medium shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {sendingEmail ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Sending...</span>
                  </>
                ) : (
                  <>
                    <PaperAirplaneIcon className="w-4 h-4" />
                    <span>Send Invitation</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      )}

      {/* Create Form */}
      {showCreateForm && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border rounded-lg p-6"
        >
          <h4 className="text-lg font-medium text-gray-900 mb-4">Create New Invitation</h4>
          <form onSubmit={createInvitation} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Expiration Date (Optional)
                </label>
                <input
                  type="datetime-local"
                  value={newInvite.expiresAt}
                  onChange={(e) => setNewInvite(prev => ({ ...prev, expiresAt: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Maximum Uses
                </label>
                <input
                  type="number"
                  min="1"
                  max="1000"
                  value={newInvite.maxUses}
                  onChange={(e) => setNewInvite(prev => ({ ...prev, maxUses: parseInt(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description (Optional)
              </label>
              <input
                type="text"
                value={newInvite.description}
                onChange={(e) => setNewInvite(prev => ({ ...prev, description: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="e.g., For wedding guests, Client review, etc."
              />
            </div>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={creating}
                className="btn-primary"
              >
                {creating ? 'Creating...' : 'Create Invitation'}
              </button>
            </div>
          </form>
        </motion.div>
      )}

      {/* Invitations List */}
      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
          <p className="text-gray-600 mt-2">Loading invitations...</p>
        </div>
      ) : invitations.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <UserGroupIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <h4 className="text-lg font-medium text-gray-900 mb-2">No Invitations Yet</h4>
          <p className="text-gray-600">Create your first invitation to share this gallery.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {invitations.map((invitation) => (
            <motion.div
              key={invitation._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white border rounded-lg p-6"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-3">
                    <code className="bg-gray-100 px-3 py-1 rounded text-sm font-mono">
                      {invitation.code}
                    </code>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      invitation.isExpired 
                        ? 'bg-red-100 text-red-800'
                        : invitation.isActive
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {invitation.isExpired ? 'Expired' : invitation.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  
                  {invitation.description && (
                    <p className="text-gray-600 mb-2">{invitation.description}</p>
                  )}
                  
                  <div className="flex items-center space-x-6 text-sm text-gray-500">
                    <div className="flex items-center space-x-1">
                      <EyeIcon className="w-4 h-4" />
                      <span>{invitation.usageCount}/{invitation.maxUses} uses</span>
                    </div>
                    {invitation.expiresAt && (
                      <div className="flex items-center space-x-1">
                        <CalendarIcon className="w-4 h-4" />
                        <span>Expires {formatDate(invitation.expiresAt)}</span>
                      </div>
                    )}
                    <span>Created {formatDate(invitation.createdAt)}</span>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => copyInviteCode(invitation.code)}
                    className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                    title="Copy invitation code"
                  >
                    <ClipboardDocumentIcon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => copyInviteUrl(invitation.code)}
                    className="p-2 text-blue-400 hover:text-blue-600 transition-colors"
                    title="Copy invitation URL"
                  >
                    <EyeIcon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => deleteInvitation(invitation._id)}
                    className="p-2 text-red-400 hover:text-red-600 transition-colors"
                    title="Delete invitation"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default InviteManager;