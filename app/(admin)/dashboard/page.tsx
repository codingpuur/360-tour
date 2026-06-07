import { connectDB } from '@/lib/db'
import { Tour } from '@/models/Tour'
import { DashboardClient } from './DashboardClient'

export default async function DashboardPage() {
  let tours: {
    _id: string; title: string; slug: string
    isPublished: boolean; coverImage: string; createdAt: string
  }[] = []

  try {
    await connectDB()
    const raw = await Tour.find({}).sort({ createdAt: -1 }).lean()
    tours = raw.map(t => ({
      _id:         t._id.toString(),
      title:       t.title,
      slug:        t.slug,
      isPublished: t.isPublished,
      coverImage:  t.coverImage,
      createdAt:   t.createdAt.toISOString(),
    }))
  } catch (e: any) {
    if (e.message?.includes('MONGODB_URI')) {
      return (
        <div className="min-h-screen bg-gray-950 flex items-center justify-center p-8">
          <div className="bg-gray-900 rounded-xl p-8 max-w-md text-center">
            <h1 className="text-white text-xl font-bold mb-3">Setup Required</h1>
            <p className="text-gray-400 text-sm mb-4">
              Fill in <code className="bg-gray-800 px-1 rounded">.env.local</code> with your MongoDB URI, then restart the dev server.
            </p>
            <pre className="bg-gray-800 text-gray-300 text-xs text-left p-3 rounded-lg">
{`MONGODB_URI=mongodb+srv://...
NEXTAUTH_SECRET=...
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD_HASH=...`}
            </pre>
            <p className="text-gray-500 text-xs mt-4">
              Generate password hash:<br />
              <code className="bg-gray-800 px-1 rounded">PLAIN_PASSWORD=x npx tsx scripts/create-admin-hash.ts</code>
            </p>
          </div>
        </div>
      )
    }
    throw e
  }

  return <DashboardClient tours={tours} />
}
