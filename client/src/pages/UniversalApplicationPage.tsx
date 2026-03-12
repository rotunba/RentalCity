import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/useAuth'

const APPLICATION_FEE = 125
const INCLUDED_ITEMS = [
  'Professional background check',
  'Comprehensive credit report',
  'Access to all rental applications',
  '6 months of unlimited property applications',
]

function stripSpaces(s: string) {
  return s.replace(/\s/g, '')
}

export function UniversalApplicationPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [cardNumber, setCardNumber] = useState('')
  const [expiryDate, setExpiryDate] = useState('')
  const [cvc, setCvc] = useState('')
  const [cardholderName, setCardholderName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const digits = stripSpaces(cardNumber)
    if (digits.length < 13 || digits.length > 19 || !/^\d+$/.test(digits)) {
      setError('Enter a valid card number.')
      return
    }
    const expiryDigits = stripSpaces(expiryDate).replace('/', '')
    if (!/^\d{4}$/.test(expiryDigits)) {
      setError('Enter expiry as MM/YY (e.g. 12/25).')
      return
    }
    if (!/^\d{3,4}$/.test(stripSpaces(cvc))) {
      setError('Enter a valid CVC.')
      return
    }
    if (!cardholderName.trim()) {
      setError('Enter cardholder name.')
      return
    }
    setLoading(true)
    try {
      // TODO: call backend to create payment intent / record when Stripe is integrated
      await new Promise((r) => setTimeout(r, 800))
      navigate('/applications/apply/form', { replace: true })
    } catch (err) {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 md:p-12">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-gray-900 text-white flex items-center justify-center">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-9 4h16a2 2 0 002-2V7a2 2 0 00-2-2H4a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
        </div>

        <h1 className="text-4xl font-semibold text-center text-gray-900 mb-4">Start your application</h1>
        <p className="max-w-2xl mx-auto text-center text-gray-600 text-lg leading-8 mb-10">
          A one-time application fee covers background checks and gives you access to apply for any property for the next 6 months.
        </p>

        <div className="rounded-xl bg-gray-50 px-6 py-8 text-center mb-10">
          <div className="flex items-center justify-center gap-3 text-gray-900">
            <span className="text-5xl font-semibold">${APPLICATION_FEE}</span>
            <span className="text-2xl text-gray-600">Application Fee</span>
          </div>
          <p className="mt-3 text-xl text-gray-500">Valid for 6 months • Covers all properties</p>
        </div>

        <h2 className="text-3xl font-medium text-center text-gray-900 mb-8">What&apos;s included:</h2>
        <ul className="max-w-xl mx-auto space-y-5 mb-10">
          {INCLUDED_ITEMS.map((item) => (
            <li key={item} className="flex items-center gap-4 text-xl text-gray-700">
              <span className="w-7 h-7 rounded-full bg-gray-900 flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </span>
              <span>{item}</span>
            </li>
          ))}
        </ul>

        <form onSubmit={handleSubmit} className="max-w-xl mx-auto space-y-6">
          {error && (
            <div className="rounded-xl bg-red-50 px-4 py-3 text-red-800 text-center text-sm">
              {error}
            </div>
          )}
          <div>
            <label htmlFor="card-number" className="block text-lg font-medium text-gray-800 mb-3">
              Card Number
            </label>
            <div className="relative">
              <input
                id="card-number"
                type="text"
                value={cardNumber}
                onChange={(e) => setCardNumber(e.target.value)}
                placeholder="1234 5678 9012 3456"
                className="w-full rounded-xl border border-gray-300 px-6 py-5 pr-14 text-3xl text-gray-900 placeholder:text-gray-400 focus:border-gray-500 focus:ring-2 focus:ring-gray-200"
              />
              <svg className="w-8 h-8 text-gray-400 absolute right-4 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-9 4h16a2 2 0 002-2V7a2 2 0 00-2-2H4a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-5">
            <div>
              <label htmlFor="expiry-date" className="block text-lg font-medium text-gray-800 mb-3">
                Expiry Date
              </label>
              <input
                id="expiry-date"
                type="text"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                placeholder="MM/YY"
                className="w-full rounded-xl border border-gray-300 px-6 py-5 text-3xl text-gray-900 placeholder:text-gray-400 focus:border-gray-500 focus:ring-2 focus:ring-gray-200"
              />
            </div>
            <div>
              <label htmlFor="cvc" className="block text-lg font-medium text-gray-800 mb-3">
                CVC
              </label>
              <input
                id="cvc"
                type="text"
                value={cvc}
                onChange={(e) => setCvc(e.target.value)}
                placeholder="123"
                className="w-full rounded-xl border border-gray-300 px-6 py-5 text-3xl text-gray-900 placeholder:text-gray-400 focus:border-gray-500 focus:ring-2 focus:ring-gray-200"
              />
            </div>
          </div>

          <div>
            <label htmlFor="cardholder-name" className="block text-lg font-medium text-gray-800 mb-3">
              Cardholder Name
            </label>
            <input
              id="cardholder-name"
              type="text"
              value={cardholderName}
              onChange={(e) => setCardholderName(e.target.value)}
              placeholder="John Doe"
              className="w-full rounded-xl border border-gray-300 px-6 py-5 text-3xl text-gray-900 placeholder:text-gray-400 focus:border-gray-500 focus:ring-2 focus:ring-gray-200"
            />
          </div>

          <div className="pt-2 space-y-4">
            {user ? (
              <>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full inline-flex items-center justify-center gap-3 rounded-xl bg-gray-900 py-4 text-lg font-medium text-white hover:bg-gray-800 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    'Processing…'
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c-1.657 0-3 .895-3 2v2h6v-2c0-1.105-1.343-2-3-2zm6 2v2a2 2 0 01-2 2H8a2 2 0 01-2-2v-2a2 2 0 012-2V9a4 4 0 118 0v2a2 2 0 012 2zm-6-8a2 2 0 00-2 2v2h4V7a2 2 0 00-2-2z" />
                      </svg>
                      Pay ${APPLICATION_FEE} &amp; Continue to Application
                    </>
                  )}
                </button>

                <Link
                  to="/applications"
                  className="w-full inline-flex items-center justify-center rounded-xl border border-gray-300 py-4 text-lg font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </Link>
              </>
            ) : (
              <>
                <Link
                  to="/signup"
                  className="w-full inline-flex items-center justify-center gap-3 rounded-xl bg-gray-900 py-4 text-lg font-medium text-white hover:bg-gray-800"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c-1.657 0-3 .895-3 2v2h6v-2c0-1.105-1.343-2-3-2zm6 2v2a2 2 0 01-2 2H8a2 2 0 01-2-2v-2a2 2 0 012-2V9a4 4 0 118 0v2a2 2 0 012 2zm-6-8a2 2 0 00-2 2v2h4V7a2 2 0 00-2-2z" />
                  </svg>
                  Pay ${APPLICATION_FEE} &amp; Continue to Application
                </Link>

                <Link
                  to="/applications"
                  className="w-full inline-flex items-center justify-center rounded-xl border border-gray-300 py-4 text-lg font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </Link>
              </>
            )}

            <div className="text-center text-base text-gray-500">
              <span className="inline-flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Secure payment processed by Stripe
              </span>
            </div>

            <div className="border-t border-gray-200 pt-6 text-center">
              <p className="text-lg text-gray-700">Questions about the fee?</p>
              <Link to="/support" className="text-lg underline text-gray-900 hover:text-gray-700">
                Contact support
              </Link>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
