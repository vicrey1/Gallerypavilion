import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    // Delete all session records from the database
    const deletedSessions = await prisma.session.deleteMany({})
    
    // Also delete all accounts to ensure clean state
    const deletedAccounts = await prisma.account.deleteMany({})
    
    // Delete verification tokens
    const deletedTokens = await prisma.verificationToken.deleteMany({})
    
    return NextResponse.json({ 
      success: true, 
      message: 'All session data cleared from database',
      deletedSessions: deletedSessions.count,
      deletedAccounts: deletedAccounts.count,
      deletedTokens: deletedTokens.count
    })
  } catch (error) {
    console.error('Error clearing session data:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to clear session data' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const sessionCount = await prisma.session.count()
    const accountCount = await prisma.account.count()
    const tokenCount = await prisma.verificationToken.count()
    
    return NextResponse.json({
      sessionCount,
      accountCount,
      tokenCount
    })
  } catch (error) {
    console.error('Error getting session data count:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to get session data count' },
      { status: 500 }
    )
  }
}