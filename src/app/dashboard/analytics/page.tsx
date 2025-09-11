'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Calendar, Download, Filter } from 'lucide-react'
import Analytics from '@/components/Analytics'

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d')
  const [selectedGallery, setSelectedGallery] = useState<string>('all')

  const timeRangeOptions = [
    { value: '7d', label: 'Last 7 days' },
    { value: '30d', label: 'Last 30 days' },
    { value: '90d', label: 'Last 90 days' },
    { value: '1y', label: 'Last year' }
  ]

  const galleries = [
    { id: 'all', name: 'All Galleries' },
    { id: '1', name: 'Smith Wedding' },
    { id: '2', name: 'Johnson Engagement' },
    { id: '3', name: 'Brown Anniversary' },
    { id: '4', name: 'Davis Family' },
    { id: '5', name: 'Wilson Portrait' }
  ]

  const exportData = () => {
    // In a real app, this would generate and download a CSV/PDF report
    alert('Analytics report will be downloaded (feature not implemented in demo)')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link
                href="/dashboard"
                className="flex items-center text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                Back to Dashboard
              </Link>
              <div className="h-6 border-l border-gray-300"></div>
              <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Gallery Filter */}
              <div className="relative">
                <select
                  value={selectedGallery}
                  onChange={(e) => setSelectedGallery(e.target.value)}
                  className="appearance-none bg-white border border-gray-300 rounded-md px-4 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                >
                  {galleries.map((gallery) => (
                    <option key={gallery.id} value={gallery.id}>
                      {gallery.name}
                    </option>
                  ))}
                </select>
                <Filter className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              </div>

              {/* Time Range Filter */}
              <div className="relative">
                <select
                  value={timeRange}
                  onChange={(e) => setTimeRange(e.target.value as '7d' | '30d' | '90d' | '1y')}
                  className="appearance-none bg-white border border-gray-300 rounded-md px-4 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                >
                  {timeRangeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <Calendar className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              </div>

              {/* Export Button */}
              <button
                onClick={exportData}
                className="flex items-center px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 transition-colors text-sm"
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Analytics Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Analytics 
          photographerId="photographer-1" 
          galleryId={selectedGallery === 'all' ? undefined : selectedGallery}
          timeRange={timeRange}
        />
      </div>

      {/* Insights Panel */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <div className="bg-white rounded-lg p-6 shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">📊 Key Insights</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="font-semibold text-blue-900 mb-2">Peak Viewing Times</h4>
              <p className="text-sm text-blue-700">
                Most clients view galleries between 7-9 PM on weekdays and 2-4 PM on weekends.
              </p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <h4 className="font-semibold text-green-900 mb-2">Top Performing Content</h4>
              <p className="text-sm text-green-700">
                Portrait and ceremony photos receive 40% more engagement than group shots.
              </p>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <h4 className="font-semibold text-purple-900 mb-2">Client Behavior</h4>
              <p className="text-sm text-purple-700">
                Clients spend an average of 4.5 minutes per gallery and favorite 12% of viewed photos.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}