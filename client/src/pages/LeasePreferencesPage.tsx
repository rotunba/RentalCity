import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/useAuth'
import { supabase } from '../lib/supabase'

const LEASE_LENGTH_OPTIONS = [
  { value: '', label: 'Select One' },
  { value: '1', label: 'Month-to-month' },
  { value: '6', label: '6 months' },
  { value: '12', label: '1 year' },
  { value: '24', label: '2 years' },
  { value: '36', label: '3+ years' },
]

const BUDGET_MIN = 500
const BUDGET_MAX = 5000
const BUDGET_STEP = 100

export function LeasePreferencesPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [leaseLength, setLeaseLength] = useState('')
  const [moveDate, setMoveDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [budgetValue, setBudgetValue] = useState(2500)
  const [hasPets, setHasPets] = useState<boolean | null>(null)
  const [livingSituation, setLivingSituation] = useState('')

  const formatBudget = (v: number) =>
    v >= BUDGET_MAX ? `$${BUDGET_MAX}+` : `$${v.toLocaleString()}`

  async function handleContinue() {
    if (!user) return
    setLoading(true)
    const minBudgetCents = BUDGET_MIN * 100
    const maxBudgetCents = Math.min(budgetValue, BUDGET_MAX) * 100
    const leaseLengthMonths = leaseLength ? parseInt(leaseLength, 10) : null
    const updatePayload = {
      move_in_date: moveDate || null,
      min_budget_cents: minBudgetCents,
      max_budget_cents: maxBudgetCents,
      lease_length_months: leaseLengthMonths,
      has_pets: hasPets,
      living_situation: livingSituation.trim() || null,
    }
    const { data: existing } = await supabase
      .from('tenant_preferences')
      .select('id')
      .eq('user_id', user.id)
      .limit(1)
      .maybeSingle()
    if (existing) {
      await supabase.from('tenant_preferences').update(updatePayload).eq('user_id', user.id)
    } else {
      await supabase.from('tenant_preferences').insert({ user_id: user.id, ...updatePayload })
    }
    // Mark the tenant compatibility survey as completed; this gates Matches.
    await supabase
      .from('profiles')
      .update({ tenant_survey_completed_at: new Date().toISOString() })
      .eq('id', user.id)

    setLoading(false)
    navigate('/onboarding/profile')
  }

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <div className="text-center mb-8">
          <div className="w-14 h-14 mx-auto mb-4 rounded-lg bg-gray-900 flex items-center justify-center">
            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-gray-900">Your Lease Preferences</h1>
          <p className="text-gray-600 mt-1">Based on your survey answers, we'll find the best property for you.</p>
          <Link
            to="/onboarding/tenant-questionnaire"
            className="mt-4 inline-block text-sm font-medium text-gray-600 hover:text-gray-900"
          >
            Want a personalized match score? Complete the detailed questionnaire →
          </Link>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); handleContinue() }} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="leaseLength" className="block text-sm font-medium text-gray-700 mb-2">
                How long do you intend to lease?
              </label>
              <select
                id="leaseLength"
                value={leaseLength}
                onChange={(e) => setLeaseLength(e.target.value)}
                className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-gray-900 appearance-none bg-white"
                style={{
                  backgroundImage: "url(\"data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e\")",
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 0.75rem center',
                  backgroundSize: '1.25rem 1.25rem',
                }}
              >
                {LEASE_LENGTH_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="moveDate" className="block text-sm font-medium text-gray-700 mb-2">
                When are you looking to move?
              </label>
              <div className="relative">
                <input
                  id="moveDate"
                  type="date"
                  value={moveDate}
                  onChange={(e) => setMoveDate(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-gray-900"
                />
                <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Preferred budget range
            </label>
            <p className="text-center text-gray-900 font-medium mb-2">{formatBudget(budgetValue)} / month</p>
            <input
              type="range"
              min={BUDGET_MIN}
              max={BUDGET_MAX}
              step={BUDGET_STEP}
              value={budgetValue}
              onChange={(e) => setBudgetValue(Number(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-gray-900"
            />
            <div className="flex justify-between text-sm text-gray-500 mt-1">
              <span>${BUDGET_MIN}</span>
              <span>${BUDGET_MAX}+</span>
            </div>
          </div>

          <div>
            <p className="block text-sm font-medium text-gray-700 mb-2">Do you have pets?</p>
            <div className="flex gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="pets"
                  checked={hasPets === true}
                  onChange={() => setHasPets(true)}
                  className="w-4 h-4 text-gray-900 border-gray-300 focus:ring-gray-900"
                />
                <span>Yes</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="pets"
                  checked={hasPets === false}
                  onChange={() => setHasPets(false)}
                  className="w-4 h-4 text-gray-900 border-gray-300 focus:ring-gray-900"
                />
                <span>No</span>
              </label>
            </div>
          </div>

          <div>
            <label htmlFor="livingSituation" className="block text-sm font-medium text-gray-700 mb-2">
              Will you live alone or with others?
            </label>
            <div className="relative">
              <input
                id="livingSituation"
                type="text"
                value={livingSituation}
                onChange={(e) => setLivingSituation(e.target.value)}
                placeholder="e.g., Living alone, with partner, with 2 roommates..."
                className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-gray-900"
              />
              <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={() => navigate('/matches')}
              className="flex-1 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50"
            >
              Skip
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 bg-gray-900 text-white font-medium rounded-lg hover:bg-gray-800 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? 'Saving...' : 'Continue'}
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
