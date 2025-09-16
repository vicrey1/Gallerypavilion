import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  LinkIcon,
  EyeIcon,
  CalendarIcon,
  LockClosedIcon,
  TrashIcon,
  ClipboardDocumentIcon,
  CheckIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';

const ShareLinksList = ({ shareLinks, onDeleteShare, galleryId }) => {
  const [copiedLinks, setCopiedLinks] = useState(new Set());

  const copyToClipboard = async (token) => {
    try {
      const shareUrl = `${window.location.origin}/gallery/${token}`;
      await navigator.clipboard.writeText(shareUrl);
      setCopiedLinks(prev => new Set([...prev, token]));
      toast.success('Share link copied to clipboard!');
      
      // Reset copied state after 2 seconds
      setTimeout(() => {
        setCopiedLinks(prev => {
          const newSet = new Set(prev);
          newSet.delete(token);
          return newSet;
        });
      }, 2000);
    } catch (error) {
      toast.error('Failed to copy link');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isExpired = (expiresAt) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };

  const getStatusColor = (share) => {
    if (isExpired(share.expiresAt)) return 'text-red-600 bg-red-50';
    if (share.maxViews && share.viewCount >= share.maxViews) return 'text-red-600 bg-red-50';
    return 'text-green-600 bg-green-50';
  };

  const getStatusText = (share) => {
    if (isExpired(share.expiresAt)) return 'Expired';
    if (share.maxViews && share.viewCount >= share.maxViews) return 'View limit reached';
    return 'Active';
  };

  return (
    <div className="space-y-4">
      {shareLinks.map((share, index) => (
        <motion.div
          key={share._id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              {/* Share Link Header */}
              <div className="flex items-center space-x-3 mb-3">
                <LinkIcon className="w-5 h-5 text-primary-600" />
                <h3 className="font-medium text-gray-900">{share.name}</h3>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(share)}`}>
                  {getStatusText(share)}
                </span>
              </div>

              {/* Share Link URL */}
              <div className="flex items-center space-x-2 mb-3">
                <div className="flex-1 bg-gray-50 rounded-lg p-3 font-mono text-sm text-gray-700 break-all">
                  {`${window.location.origin}/gallery/${share.token}`}
                </div>
                <button
                  onClick={() => copyToClipboard(share.token)}
                  className="p-2 text-gray-500 hover:text-primary-600 transition-colors"
                  title="Copy link"
                >
                  {copiedLinks.has(share.token) ? (
                    <CheckIcon className="w-5 h-5 text-green-600" />
                  ) : (
                    <ClipboardDocumentIcon className="w-5 h-5" />
                  )}
                </button>
              </div>

              {/* Share Link Details */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                <div className="flex items-center space-x-2">
                  <EyeIcon className="w-4 h-4" />
                  <span>
                    Views: {share.viewCount || 0}
                    {share.maxViews && ` / ${share.maxViews}`}
                  </span>
                </div>
                
                <div className="flex items-center space-x-2">
                  <CalendarIcon className="w-4 h-4" />
                  <span>Expires: {formatDate(share.expiresAt)}</span>
                </div>
                
                <div className="flex items-center space-x-2">
                  {share.password ? (
                    <>
                      <LockClosedIcon className="w-4 h-4" />
                      <span>Password protected</span>
                    </>
                  ) : (
                    <span>No password</span>
                  )}
                </div>
              </div>

              {/* Permissions */}
              <div className="mt-3">
                <div className="flex flex-wrap gap-2">
                  {share.permissions?.canView && (
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                      Can View
                    </span>
                  )}
                  {share.permissions?.canDownload && (
                    <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                      Can Download
                    </span>
                  )}
                  {share.permissions?.canComment && (
                    <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                      Can Comment
                    </span>
                  )}
                </div>
              </div>

              {/* Creation Date */}
              <div className="mt-3 text-xs text-gray-500">
                Created: {formatDate(share.createdAt)}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-2 ml-4">
              <button
                onClick={() => {
                  // TODO: Implement analytics view
                  toast.info('Analytics feature coming soon!');
                }}
                className="p-2 text-gray-500 hover:text-blue-600 transition-colors"
                title="View analytics"
              >
                <ChartBarIcon className="w-5 h-5" />
              </button>
              
              <button
                onClick={() => {
                  if (window.confirm('Are you sure you want to delete this share link? This action cannot be undone.')) {
                    onDeleteShare(share._id);
                  }
                }}
                className="p-2 text-gray-500 hover:text-red-600 transition-colors"
                title="Delete share link"
              >
                <TrashIcon className="w-5 h-5" />
              </button>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default ShareLinksList;