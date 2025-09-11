'use client'

import { Camera, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import InviteManager from '@/components/InviteManager'

export default function InvitesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Navigation */}
      <nav className="relative z-50 px-6 py-4 bg-black/20 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/" className="flex items-center space-x-2">
              <Camera className="h-6 w-6 text-white" />
              <span className="text-lg font-bold text-white">Gallery Pavilion</span>
            </Link>
            <div className="text-gray-300">•</div>
            <span className="text-white font-medium">Invite Management</span>
          </div>
          
          <div className="flex items-center space-x-4">
            <Link 
              href="/dashboard"
              className="flex items-center space-x-2 text-white hover:text-purple-300 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Dashboard</span>
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <InviteManager />
      </div>
    </div>
  )
}