import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'

export default async function PhotographerGalleries() {
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
      galleries: {
        orderBy: {
          createdAt: 'desc'
        },
        include: {
          _count: {
            select: {
              photos: true,
              invites: true
            }
          }
        }
      }
    }
  })

  if (!photographer) {
    redirect('/auth/photographer-signup')
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">My Galleries</h1>
        <Link
          href="/photographer/galleries/new"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Create New Gallery
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {photographer.galleries.map((gallery) => (
          <div key={gallery.id} className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-6">
              <h3 className="text-xl font-semibold mb-2">{gallery.title}</h3>
              <p className="text-gray-600 mb-4 line-clamp-2">{gallery.description || 'No description'}</p>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-sm text-gray-600">Photos</p>
                  <p className="font-semibold">{gallery._count.photos}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Invites</p>
                  <p className="font-semibold">{gallery._count.invites}</p>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="px-2 py-1 text-sm rounded-full bg-gray-100 text-gray-800 capitalize">
                  {gallery.visibility}
                </span>
                <span className="text-sm text-gray-500">
                  {new Date(gallery.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
            
            <div className="bg-gray-50 px-6 py-3 flex justify-end gap-3">
              <Link
                href={`/photographer/galleries/${gallery.id}`}
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                View Gallery
              </Link>
              <Link
                href={`/photographer/galleries/${gallery.id}/edit`}
                className="text-gray-600 hover:text-gray-800 font-medium"
              >
                Edit
              </Link>
            </div>
          </div>
        ))}
      </div>

      {photographer.galleries.length === 0 && (
        <div className="text-center py-12">
          <h3 className="text-xl font-semibold text-gray-600 mb-4">No galleries yet</h3>
          <p className="text-gray-500 mb-6">Create your first gallery to start uploading photos</p>
          <Link
            href="/photographer/galleries/new"
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Create New Gallery
          </Link>
        </div>
      )}
    </div>
  )
}
