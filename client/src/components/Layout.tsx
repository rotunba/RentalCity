import { Outlet } from 'react-router-dom'
import { Link } from 'react-router-dom'
import { useAuth } from '../lib/useAuth'

export function Layout() {
  const { user } = useAuth()

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b bg-white">
        <nav className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="font-semibold text-lg text-blue-600">
            Rental City
          </Link>
          <div className="flex gap-4">
            {user ? (
              <span className="text-gray-600 text-sm">{user.email}</span>
            ) : (
              <>
                <Link to="/login" className="text-gray-600 hover:text-gray-900">
                  Log in
                </Link>
                <Link to="/signup" className="text-blue-600 hover:text-blue-700 font-medium">
                  Sign up
                </Link>
              </>
            )}
          </div>
        </nav>
      </header>
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8">
        <Outlet />
      </main>
    </div>
  )
}
