'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Calendar, Users, Settings, Send } from 'lucide-react';

interface InviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  galleryId: string;
  galleryTitle: string;
}

interface InviteFormData {
  clientEmail: string;
  type: 'single_use' | 'multi_use' | 'time_limited';
  expiresAt: string;
  maxUsage: number;
  canView: boolean;
  canFavorite: boolean;
  canComment: boolean;
  canDownload: boolean;
  canRequestPurchase: boolean;
}

export default function InviteModal({ isOpen, onClose, galleryId, galleryTitle }: InviteModalProps) {
  const [formData, setFormData] = useState<InviteFormData>({
    clientEmail: '',
    type: 'single_use',
    expiresAt: '',
    maxUsage: 1,
    canView: true,
    canFavorite: true,
    canComment: false,
    canDownload: false,
    canRequestPurchase: true,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess(false);

    try {
      const response = await fetch('/api/invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          galleryId,
          ...formData,
          expiresAt: formData.expiresAt || undefined,
          maxUsage: formData.type === 'multi_use' ? formData.maxUsage : undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send invitation');
      }

      setSuccess(true);
      setTimeout(() => {
        onClose();
        setSuccess(false);
        setFormData({
          clientEmail: '',
          type: 'single_use',
          expiresAt: '',
          maxUsage: 1,
          canView: true,
          canFavorite: true,
          canComment: false,
          canDownload: false,
          canRequestPurchase: true,
        });
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send invitation');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof InviteFormData, value: InviteFormData[keyof InviteFormData]) => {
    setFormData(prev => ({ ...prev, [field]: value } as InviteFormData));
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Invite Client</h2>
                  <p className="text-gray-600 mt-1">Send an invitation to view &quot;{galleryTitle}&quot;</p>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Success Message */}
              {success && (
                <div className="mx-6 mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center">
                    <Mail className="w-5 h-5 text-green-600 mr-2" />
                    <span className="text-green-800 font-medium">Invitation sent successfully!</span>
                  </div>
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="mx-6 mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <span className="text-red-800">{error}</span>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                {/* Email Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Client Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="email"
                      value={formData.clientEmail}
                      onChange={(e) => handleInputChange('clientEmail', e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="client@example.com"
                      required
                    />
                  </div>
                </div>

                {/* Invite Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Invitation Type
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { value: 'single_use', label: 'Single Use', icon: Users },
                      { value: 'multi_use', label: 'Multiple Use', icon: Users },
                      { value: 'time_limited', label: 'Time Limited', icon: Calendar },
                    ].map(({ value, label, icon: Icon }) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => handleInputChange('type', value)}
                        className={`p-3 border rounded-lg flex flex-col items-center space-y-2 transition-colors ${
                          formData.type === value
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                        <span className="text-sm font-medium">{label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Conditional Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Expiration Date */}
                  {(formData.type === 'time_limited' || formData.type === 'single_use') && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Expiration Date (Optional)
                      </label>
                      <input
                        type="datetime-local"
                        value={formData.expiresAt}
                        onChange={(e) => handleInputChange('expiresAt', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  )}

                  {/* Max Usage */}
                  {formData.type === 'multi_use' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Maximum Uses
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={formData.maxUsage}
                        onChange={(e) => handleInputChange('maxUsage', parseInt(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  )}
                </div>

                {/* Permissions */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    <Settings className="inline w-4 h-4 mr-1" />
                    Client Permissions
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { key: 'canView', label: 'View Photos' },
                      { key: 'canFavorite', label: 'Add to Favorites' },
                      { key: 'canComment', label: 'Leave Comments' },
                      { key: 'canDownload', label: 'Download Photos' },
                      { key: 'canRequestPurchase', label: 'Request Purchases' },
                    ].map(({ key, label }) => (
                      <label key={key} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData[key as keyof InviteFormData] as boolean}
                          onChange={(e) => handleInputChange(key as keyof InviteFormData, e.target.checked)}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">{label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Submit Button */}
                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading || !formData.clientEmail}
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors flex items-center space-x-2"
                  >
                    {isLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Sending...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Send Invitation</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}