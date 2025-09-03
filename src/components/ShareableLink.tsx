'use client'

import { useState } from 'react'
import { Copy, Check } from 'lucide-react'

interface ShareableLinkProps {
  inviteUrl: string
  inviteCode: string
  type: 'single_use' | 'multi_use'
  expiresAt?: string | null
  permissions: {
    canView: boolean
    canFavorite: boolean
    canComment: boolean
    canDownload: boolean
    canRequestPurchase: boolean
  }
}

export default function ShareableLink({ inviteUrl, inviteCode, type, expiresAt, permissions }: ShareableLinkProps) {
  const [copiedUrl, setCopiedUrl] = useState(false)
  const [copiedCode, setCopiedCode] = useState(false)

  const copyToClipboard = async (text: string, type: 'url' | 'code') => {
    try {
      await navigator.clipboard.writeText(text)
      if (type === 'url') {
        setCopiedUrl(true)
        setTimeout(() => setCopiedUrl(false), 2000)
      } else {
        setCopiedCode(true)
        setTimeout(() => setCopiedCode(false), 2000)
      }
    } catch (error) {
      console.error('Failed to copy to clipboard:', error)
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = text
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
    }
  }

  const getPermissionsList = () => {
    const activePermissions = []
    if (permissions.canView) activePermissions.push('View photos')
    if (permissions.canFavorite) activePermissions.push('Add favorites')
    if (permissions.canComment) activePermissions.push('Leave comments')
    if (permissions.canDownload) activePermissions.push('Download photos')
    if (permissions.canRequestPurchase) activePermissions.push('Request purchases')
    return activePermissions
  }

  return (
    <div className="p-3 sm:p-4 bg-white/5 rounded-lg border border-white/10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 gap-2">
        <h4 className="text-sm font-medium text-gray-300">Shareable Link Generated</h4>
        <span className={`text-xs px-2 py-1 rounded self-start sm:self-auto ${
          type === 'single_use' 
            ? 'bg-orange-500/20 text-orange-300' 
            : 'bg-green-500/20 text-green-300'
        }`}>
          {type === 'single_use' ? 'Single Use' : 'Multi Use'}
        </span>
      </div>
      
      <div className="space-y-3">
        {/* Gallery Link */}
        <div>
          <label className="block text-xs text-gray-400 mb-1">Gallery Link</label>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <input 
              type="text" 
              value={inviteUrl} 
              readOnly 
              className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded text-white text-sm"
            />
            <button 
              onClick={() => copyToClipboard(inviteUrl, 'url')}
              className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm transition-colors flex items-center justify-center space-x-1 whitespace-nowrap"
            >
              {copiedUrl ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
              <span>{copiedUrl ? 'Copied!' : 'Copy'}</span>
            </button>
          </div>
        </div>
        
        {/* Invite Code */}
        <div>
          <label className="block text-xs text-gray-400 mb-1">Invite Code</label>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <input 
              type="text" 
              value={inviteCode} 
              readOnly 
              className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded text-white text-sm font-mono"
            />
            <button 
              onClick={() => copyToClipboard(inviteCode, 'code')}
              className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm transition-colors flex items-center justify-center space-x-1 whitespace-nowrap"
            >
              {copiedCode ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
              <span>{copiedCode ? 'Copied!' : 'Copy'}</span>
            </button>
          </div>
        </div>
        
        {/* Expiration Date */}
        {expiresAt && (
          <div>
            <label className="block text-xs text-gray-400 mb-1">Expires</label>
            <span className="text-sm text-orange-300">
              {new Date(expiresAt).toLocaleString()}
            </span>
          </div>
        )}
        
        {/* Permissions Summary */}
        <div>
          <label className="block text-xs text-gray-400 mb-1">Permissions</label>
          <div className="flex flex-wrap gap-1">
            {getPermissionsList().map((permission, index) => (
              <span 
                key={index}
                className="text-xs bg-purple-500/20 text-purple-300 px-2 py-1 rounded"
              >
                {permission}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}