import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'



export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get system settings
    const settings = await prisma.systemSetting.findMany()
    const settingsMap = settings.reduce((acc, setting) => {
      acc[setting.key] = {
        value: setting.value,
        type: setting.type,
        description: setting.description,
        updatedAt: setting.updatedAt
      }
      return acc
    }, {} as Record<string, {
      value: string
      type: string
      description: string | null
      updatedAt: Date
    }>)

    // Default settings if not found in database
    const defaultSettings = {
      autoApprovePhotographers: settingsMap.autoApprovePhotographers?.value || 'false',
      emailNotifications: settingsMap.emailNotifications?.value || 'true',
      maxUploadSize: settingsMap.maxUploadSize?.value || '10',
      allowGuestAccess: settingsMap.allowGuestAccess?.value || 'false',
      maintenanceMode: settingsMap.maintenanceMode?.value || 'false',
      analyticsEnabled: settingsMap.analyticsEnabled?.value || 'true'
    }

    return NextResponse.json({
      settings: defaultSettings,
      lastUpdated: Math.max(...settings.map(s => new Date(s.updatedAt).getTime()), 0)
    })
  } catch (error) {
    console.error('Error fetching system settings:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { settings } = body

    if (!settings || typeof settings !== 'object') {
      return NextResponse.json(
        { error: 'Settings object is required' },
        { status: 400 }
      )
    }

    // Update settings in database
    const updatePromises = Object.entries(settings).map(async ([key, value]) => {
      return prisma.systemSetting.upsert({
        where: { key },
        update: {
          value: String(value),
          updatedAt: new Date()
        },
        create: {
          key,
          value: String(value),
          type: typeof value === 'boolean' ? 'boolean' : typeof value === 'number' ? 'number' : 'string',
          description: getSettingDescription(key)
        }
      })
    })

    await Promise.all(updatePromises)

    // Log the admin action
    await prisma.analytics.create({
      data: {
        type: 'admin_action',
        metadata: {
          action: 'system_settings_updated',
          settings: Object.keys(settings),
          adminId: session.user.id,
          timestamp: new Date().toISOString()
        }
      }
    })

    return NextResponse.json({
      message: 'System settings updated successfully',
      settings
    })
  } catch (error) {
    console.error('Error updating system settings:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

function getSettingDescription(key: string): string {
  const descriptions: Record<string, string> = {
    autoApprovePhotographers: 'Automatically approve new photographer registrations',
    emailNotifications: 'Enable email notifications for system events',
    maxUploadSize: 'Maximum file upload size in MB',
    allowGuestAccess: 'Allow guest users to view public galleries',
    maintenanceMode: 'Enable maintenance mode to restrict access',
    analyticsEnabled: 'Enable analytics tracking for user interactions'
  }
  return descriptions[key] || 'System setting'
}