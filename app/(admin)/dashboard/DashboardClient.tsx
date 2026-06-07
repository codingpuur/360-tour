'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { Plus, Eye, Pencil, Trash2, Globe, Lock, LogOut } from 'lucide-react'
import Link from 'next/link'

interface TourSummary {
  _id:        string
  title:      string
  slug:       string
  isPublished: boolean
  coverImage: string
  createdAt:  string
}

interface Props {
  tours: TourSummary[]
}

export function DashboardClient({ tours: initialTours }: Props) {
  const router = useRouter()
  const [tours,   setTours]   = useState(initialTours)
  const [loading, setLoading] = useState(false)

  async function createTour() {
    const title = prompt('Tour title:')
    if (!title?.trim()) return
    setLoading(true)
    const res = await fetch('/api/tours', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title }),
    })
    const tour = await res.json()
    setLoading(false)
    router.push(`/editor/${tour._id}`)
  }

  async function deleteTour(id: string, title: string) {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return
    await fetch(`/api/tours/${id}`, { method: 'DELETE' })
    setTours(prev => prev.filter(t => t._id !== id))
  }

  async function togglePublish(id: string, current: boolean) {
    const res  = await fetch(`/api/tours/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isPublished: !current }),
    })
    const updated = await res.json()
    setTours(prev => prev.map(t => t._id === id ? { ...t, isPublished: updated.isPublished } : t))
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <header className="bg-gray-900 border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold">360° Tour Platform</h1>
        <div className="flex items-center gap-3">
          <button
            onClick={createTour}
            disabled={loading}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <Plus size={16} /> New Tour
          </button>
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="text-gray-400 hover:text-white transition-colors"
            title="Sign out"
          >
            <LogOut size={18} />
          </button>
        </div>
      </header>

      {/* Tour grid */}
      <main className="p-6">
        {tours.length === 0 ? (
          <div className="text-center py-24 text-gray-500">
            <p className="text-lg mb-4">No tours yet.</p>
            <button onClick={createTour} className="text-blue-400 hover:text-blue-300 underline">
              Create your first tour
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {tours.map(tour => (
              <div
                key={tour._id}
                className="bg-gray-900 rounded-xl overflow-hidden border border-white/10 hover:border-white/20 transition-colors"
              >
                {/* Cover */}
                <div className="h-32 bg-gray-800 overflow-hidden">
                  {tour.coverImage ? (
                    <img src={tour.coverImage} alt={tour.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-600">
                      No cover
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="p-3">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h2 className="font-medium text-sm truncate">{tour.title}</h2>
                    <button
                      onClick={() => togglePublish(tour._id, tour.isPublished)}
                      title={tour.isPublished ? 'Published — click to unpublish' : 'Unpublished — click to publish'}
                      className={`flex-shrink-0 ${tour.isPublished ? 'text-green-400' : 'text-gray-500'}`}
                    >
                      {tour.isPublished ? <Globe size={14} /> : <Lock size={14} />}
                    </button>
                  </div>

                  <div className="flex gap-2 mt-3">
                    <Link
                      href={`/editor/${tour._id}`}
                      className="flex items-center gap-1 text-xs text-gray-300 hover:text-white bg-gray-800 hover:bg-gray-700 px-2 py-1 rounded transition-colors"
                    >
                      <Pencil size={12} /> Edit
                    </Link>
                    {tour.isPublished && (
                      <Link
                        href={`/tour/${tour.slug}`}
                        target="_blank"
                        className="flex items-center gap-1 text-xs text-gray-300 hover:text-white bg-gray-800 hover:bg-gray-700 px-2 py-1 rounded transition-colors"
                      >
                        <Eye size={12} /> View
                      </Link>
                    )}
                    <button
                      onClick={() => deleteTour(tour._id, tour.title)}
                      className="flex items-center gap-1 text-xs text-red-400 hover:text-red-300 bg-gray-800 hover:bg-gray-700 px-2 py-1 rounded transition-colors ml-auto"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
