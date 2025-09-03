'use client';

import { useState } from 'react';
import { X, Mail, Calendar, Users, Shield, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface CreateInviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  galleryId: string;
  galleryTitle: string;
  onInviteCreated: () => void;
}

interface InviteFormData {
  clientEmail: string;
  type: 'single_use' | 'multi_use' | 'time_limited';
  expiresAt: string;
  maxUsage: number | null;
  sendEmail: boolean;
  permissions: {
    canView: boolean;
    canFavorite: boolean;
    canComment: boolean;
    canDownload: boolean;
    canRequestPurchase: boolean;
  };
}

export default function CreateInviteModal({
  isOpen,
  onClose,
  galleryId,
  galleryTitle,
  onInviteCreated,
}: CreateInviteModalProps) {
  const [formData, setFormData] = useState<InviteFormData>({
    clientEmail: '',
    type: 'single_use',
    expiresAt: '',
    maxUsage: 1,
    sendEmail: true,
    permissions: {
      canView: true,
      canFavorite: true,
      canComment: true,
      canDownload: false,
      canRequestPurchase: true,
    },
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const payload = {
        galleryId,
        clientEmail: formData.clientEmail,
        type: formData.type,
        expiresAt: formData.expiresAt ? new Date(formData.expiresAt).toISOString() : null,
        maxUsage: formData.type === 'multi_use' ? formData.maxUsage : null,
        ...formData.permissions,
      };

      const response = await fetch('/api/invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const responseData = await response.json();
        setSuccess(responseData.message || 'Invite sent successfully!');
        
        // Show success message for 2 seconds before closing
        setTimeout(() => {
          onInviteCreated();
          onClose();
          setSuccess(null);
          // Reset form
          setFormData({
            clientEmail: '',
            type: 'single_use',
            expiresAt: '',
            maxUsage: 1,
            sendEmail: true,
            permissions: {
              canView: true,
              canFavorite: true,
              canComment: true,
              canDownload: false,
              canRequestPurchase: true,
            },
          });
        }, 2000);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to create invite');
      }
    } catch (error) {
      setError('An unexpected error occurred');
      console.error('Error creating invite:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePermissionChange = (permission: keyof InviteFormData['permissions']) => {
    setFormData(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [permission]: !prev.permissions[permission],
      },
    }));
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        >
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Create Gallery Invite</h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-4 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Gallery:</strong> {galleryTitle}
              </p>
            </div>

            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            {success && (
              <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                  <p className="text-sm text-green-800">{success}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Client Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Mail className="w-4 h-4 inline mr-2" />
                  Client Email
                </label>
                <input
                  type="email"
                  value={formData.clientEmail}
                  onChange={(e) => setFormData(prev => ({ ...prev, clientEmail: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="client@example.com"
                  required
                />
              </div>

              {/* Invite Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Users className="w-4 h-4 inline mr-2" />
                  Invite Type
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as InviteFormData['type'] }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="single_use">Single Use</option>
                  <option value="multi_use">Multi Use</option>
                  <option value="time_limited">Time Limited</option>
                </select>
              </div>

              {/* Max Usage (for multi_use) */}
              {formData.type === 'multi_use' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Maximum Usage Count
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.maxUsage || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, maxUsage: parseInt(e.target.value) || null }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter maximum usage count"
                  />
                </div>
              )}

              {/* Expiration Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="w-4 h-4 inline mr-2" />
                  Expiration Date (Optional)
                </label>
                <input
                  type="datetime-local"
                  value={formData.expiresAt}
                  onChange={(e) => setFormData(prev => ({ ...prev, expiresAt: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Permissions */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  <Shield className="w-4 h-4 inline mr-2" />
                  Permissions
                </label>
                <div className="space-y-3">
                  {Object.entries(formData.permissions).map(([key, value]) => (
                    <label key={key} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={value}
                        onChange={() => handlePermissionChange(key as keyof InviteFormData['permissions'])}
                        className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="text-sm text-gray-700">
                        {key.replace('can', 'Can ').replace(/([A-Z])/g, ' $1').toLowerCase()}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end space-x-3 pt-6">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isSubmitting ? 'Creating...' : 'Create Invite'}
                </button>
              </div>
            </form>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}