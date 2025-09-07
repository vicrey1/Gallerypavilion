'use client'
/* eslint-disable react/no-unescaped-entities */

import { useState } from 'react'
import { X, Download, Shield, Award, FileText, Calendar, User, Palette } from 'lucide-react'

interface CertificateData {
  certificateId: string
  photoId: string
  title: string
  artist: string
  medium: string
  technique: string
  materials: string
  editionNumber: number
  totalEditions: number
  dimensions: string
  createdAt: string
  artistStatement?: string
  provenance?: string
  photographerEmail: string
  galleryTitle: string
  issuedAt: string
  clientEmail?: string
  clientName?: string
  verificationUrl: string
}

interface CertificateModalProps {
  isOpen: boolean
  onClose: () => void
  photoId: string
  photoTitle: string
  photographerName: string
}

export default function CertificateModal({ isOpen, onClose, photoId, photoTitle, photographerName }: CertificateModalProps) {
  const [certificate, setCertificate] = useState<CertificateData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [clientName, setClientName] = useState('')
  const [clientEmail, setClientEmail] = useState('')

  const generateCertificate = async () => {
    setLoading(true)
    setError('')
    
    try {
      const response = await fetch(`/api/certificate/${photoId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requestType: 'generate',
          clientEmail: clientEmail || undefined,
          clientName: clientName || undefined,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate certificate')
      }

      setCertificate(data.certificate)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const downloadCertificate = () => {
    if (!certificate) return

    const certificateHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Certificate of Authenticity - ${certificate.title}</title>
        <style>
          body {
            font-family: 'Times New Roman', serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 40px;
            background: #fff;
            color: #333;
          }
          .certificate {
            border: 3px solid #8B4513;
            padding: 40px;
            text-align: center;
            background: linear-gradient(45deg, #f9f9f9 0%, #ffffff 100%);
          }
          .header {
            border-bottom: 2px solid #8B4513;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          .title {
            font-size: 28px;
            font-weight: bold;
            color: #8B4513;
            margin-bottom: 10px;
          }
          .subtitle {
            font-size: 16px;
            color: #666;
            font-style: italic;
          }
          .artwork-title {
            font-size: 24px;
            font-weight: bold;
            margin: 20px 0;
            color: #333;
          }
          .details {
            text-align: left;
            margin: 30px 0;
          }
          .detail-row {
            display: flex;
            justify-content: space-between;
            margin: 10px 0;
            padding: 5px 0;
            border-bottom: 1px dotted #ccc;
          }
          .label {
            font-weight: bold;
            color: #8B4513;
          }
          .footer {
            margin-top: 40px;
            border-top: 2px solid #8B4513;
            padding-top: 20px;
            font-size: 12px;
            color: #666;
          }
          .verification {
            background: #f0f8ff;
            padding: 15px;
            border-radius: 5px;
            margin: 20px 0;
            font-size: 12px;
          }
        </style>
      </head>
      <body>
        <div class="certificate">
          <div class="header">
            <div class="title">CERTIFICATE OF AUTHENTICITY</div>
            <div class="subtitle">Original Photographic Artwork</div>
          </div>
          
          <div class="artwork-title">"${certificate.title}"</div>
          
          <div class="details">
            <div class="detail-row">
              <span class="label">Artist:</span>
              <span>${certificate.artist}</span>
            </div>
            <div class="detail-row">
              <span class="label">Medium:</span>
              <span>${certificate.medium}</span>
            </div>
            <div class="detail-row">
              <span class="label">Technique:</span>
              <span>${certificate.technique}</span>
            </div>
            <div class="detail-row">
              <span class="label">Materials:</span>
              <span>${certificate.materials}</span>
            </div>
            <div class="detail-row">
              <span class="label">Edition:</span>
              <span>${certificate.editionNumber} of ${certificate.totalEditions}</span>
            </div>
            <div class="detail-row">
              <span class="label">Dimensions:</span>
              <span>${certificate.dimensions}</span>
            </div>
            <div class="detail-row">
              <span class="label">Created:</span>
              <span>${new Date(certificate.createdAt).toLocaleDateString()}</span>
            </div>
            <div class="detail-row">
              <span class="label">Gallery:</span>
              <span>${certificate.galleryTitle}</span>
            </div>
          </div>
          
          <div class="verification">
            <strong>Certificate ID:</strong> ${certificate.certificateId}<br>
            <strong>Issued:</strong> ${new Date(certificate.issuedAt).toLocaleDateString()}<br>
            <strong>Verification URL:</strong> ${certificate.verificationUrl}
          </div>
          
          <div class="footer">
            <p>This certificate confirms the authenticity and provenance of the above artwork.</p>
            <p>For verification, visit: ${certificate.verificationUrl}</p>
            <p>© ${new Date().getFullYear()} ${certificate.artist} - All rights reserved</p>
          </div>
        </div>
      </body>
      </html>
    `

    const blob = new Blob([certificateHTML], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `Certificate-${certificate.certificateId}.html`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <Shield className="h-6 w-6 mr-2 text-blue-600" />
            Certificate of Authenticity
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6">
          {!certificate ? (
            <div className="space-y-6">
              <div className="text-center">
                <Award className="h-16 w-16 text-blue-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Generate Certificate</h3>
                <p className="text-gray-600 mb-6">
                  Create an official certificate of authenticity for "{photoTitle}" by {photographerName}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <User className="h-4 w-4 inline mr-1" />
                    Your Name (Optional)
                  </label>
                  <input
                    type="text"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter your name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <FileText className="h-4 w-4 inline mr-1" />
                    Your Email (Optional)
                  </label>
                  <input
                    type="email"
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter your email"
                  />
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-md p-4">
                  <p className="text-red-800 text-sm">{error}</p>
                </div>
              )}

              <div className="flex justify-center">
                <button
                  onClick={generateCertificate}
                  disabled={loading}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-8 py-3 rounded-lg font-semibold transition-colors flex items-center space-x-2"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Generating...</span>
                    </>
                  ) : (
                    <>
                      <Shield className="h-4 w-4" />
                      <span>Generate Certificate</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Certificate Preview */}
              <div className="border-4 border-amber-600 p-8 bg-gradient-to-br from-amber-50 to-white text-center">
                <div className="border-b-2 border-amber-600 pb-4 mb-6">
                  <h3 className="text-3xl font-bold text-amber-800 mb-2">CERTIFICATE OF AUTHENTICITY</h3>
                  <p className="text-amber-700 italic">Original Photographic Artwork</p>
                </div>
                
                <h4 className="text-2xl font-bold mb-6 text-gray-800">"{certificate.title}"</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left mb-6">
                  <div className="space-y-3">
                    <div className="flex justify-between border-b border-gray-300 pb-1">
                      <span className="font-semibold text-amber-800">Artist:</span>
                      <span>{certificate.artist}</span>
                    </div>
                    <div className="flex justify-between border-b border-gray-300 pb-1">
                      <span className="font-semibold text-amber-800">Medium:</span>
                      <span>{certificate.medium}</span>
                    </div>
                    <div className="flex justify-between border-b border-gray-300 pb-1">
                      <span className="font-semibold text-amber-800">Technique:</span>
                      <span>{certificate.technique}</span>
                    </div>
                    <div className="flex justify-between border-b border-gray-300 pb-1">
                      <span className="font-semibold text-amber-800">Materials:</span>
                      <span>{certificate.materials}</span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between border-b border-gray-300 pb-1">
                      <span className="font-semibold text-amber-800">Edition:</span>
                      <span>{certificate.editionNumber} of {certificate.totalEditions}</span>
                    </div>
                    <div className="flex justify-between border-b border-gray-300 pb-1">
                      <span className="font-semibold text-amber-800">Dimensions:</span>
                      <span>{certificate.dimensions}</span>
                    </div>
                    <div className="flex justify-between border-b border-gray-300 pb-1">
                      <span className="font-semibold text-amber-800">Created:</span>
                      <span>{new Date(certificate.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between border-b border-gray-300 pb-1">
                      <span className="font-semibold text-amber-800">Gallery:</span>
                      <span>{certificate.galleryTitle}</span>
                    </div>
                  </div>
                </div>
                
                <div className="bg-blue-50 p-4 rounded-lg text-sm">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-left">
                    <div><strong>Certificate ID:</strong> {certificate.certificateId}</div>
                    <div><strong>Issued:</strong> {new Date(certificate.issuedAt).toLocaleDateString()}</div>
                  </div>
                  <div className="mt-2 text-center">
                    <strong>Verification:</strong> <span className="text-blue-600 text-xs break-all">{certificate.verificationUrl}</span>
                  </div>
                </div>
                
                <div className="border-t-2 border-amber-600 pt-4 mt-6 text-sm text-gray-600">
                  <p>This certificate confirms the authenticity and provenance of the above artwork.</p>
                  <p className="mt-1">© {new Date().getFullYear()} {certificate.artist} - All rights reserved</p>
                </div>
              </div>

              <div className="flex justify-center space-x-4">
                <button
                  onClick={downloadCertificate}
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center space-x-2"
                >
                  <Download className="h-4 w-4" />
                  <span>Download Certificate</span>
                </button>
                <button
                  onClick={() => setCertificate(null)}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                >
                  Generate New
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}