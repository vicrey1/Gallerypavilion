import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export default async function PhotographerDashboard() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.email) {
    redirect('/auth/signin')
  }

  const photographer = await prisma.photographer.findFirst({
    where: {
      user: {
        email: session.user.email,
        role: 'PHOTOGRAPHER'
      }
    },
    include: {
      _count: {
        select: {
          galleries: true,
          photos: true
        }
      }
    }
  })

  if (!photographer) {
    redirect('/auth/photographer-signup')
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Photographer Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-xl font-semibold mb-2">Galleries</h3>
          <p className="text-3xl font-bold">{photographer._count.galleries}</p>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-xl font-semibold mb-2">Photos</h3>
          <p className="text-3xl font-bold">{photographer._count.photos}</p>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-xl font-semibold mb-2">Status</h3>
          <p className="text-3xl font-bold capitalize">{photographer.status}</p>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold mb-4">Profile Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-gray-600">Name</p>
            <p className="font-semibold">{photographer.name}</p>
          </div>
          
          <div>
            <p className="text-gray-600">Business Name</p>
            <p className="font-semibold">{photographer.businessName || 'Not set'}</p>
          </div>
          
          <div>
            <p className="text-gray-600">Email</p>
            <p className="font-semibold">{session.user.email}</p>
          </div>
          
          <div>
            <p className="text-gray-600">Phone</p>
            <p className="font-semibold">{photographer.phone || 'Not set'}</p>
          </div>
          
          <div className="col-span-2">
            <p className="text-gray-600">Bio</p>
            <p className="font-semibold">{photographer.bio || 'No bio added'}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
