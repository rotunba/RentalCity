import { Link } from 'react-router-dom'
import { useAuth } from '../lib/useAuth'

export function HomePage() {
  const { user } = useAuth()

  return (
    <div className="text-center py-16">
      <h1 className="text-4xl font-bold text-gray-900 mb-4">
        Find Your Next Home
      </h1>
      <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
        Rental City connects tenants with landlords. Browse properties, apply in one click, and message directly.
      </p>
      {!user && (
        <div className="flex gap-4 justify-center">
          <Link
            to="/signup"
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
          >
            Get Started
          </Link>
          <Link
            to="/login"
            className="px-6 py-3 border border-gray-300 rounded-lg font-medium hover:bg-gray-50"
          >
            Log in
          </Link>
        </div>
      )}
    </div>
  )
}
