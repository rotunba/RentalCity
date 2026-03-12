import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/useAuth'
import { useProfileRole } from '../lib/useProfileRole'
import { supabase } from '../lib/supabase'

type ApplicationHistoryItem = {
  id: string
  property: string
  appliedDate: string
  status: 'Approved' | 'Pending' | 'Rejected' | 'Withdrawn'
}

function SectionCard({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
        <span className="text-gray-500">{icon}</span>
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
      </div>
      <div className="p-6">{children}</div>
    </div>
  )
}

function LandlordSettingsGroup({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-4">
      <h2 className="text-[1.35rem] font-medium text-gray-900">{title}</h2>
      <div className="mt-4 space-y-2">{children}</div>
    </section>
  )
}

function LandlordSettingsItem({
  to,
  title,
  description,
  icon,
  onClick,
}: {
  to?: string
  title: string
  description: string
  icon: React.ReactNode
  onClick?: () => void
}) {
  const content = (
    <div className="flex items-start gap-3 rounded-xl border border-gray-200 px-4 py-4 transition-colors hover:bg-gray-50">
      <span className="mt-0.5 text-gray-500">{icon}</span>
      <div>
        <p className="text-[1.1rem] font-medium text-gray-900">{title}</p>
        <p className="mt-1 text-sm text-gray-500">{description}</p>
      </div>
    </div>
  )

  if (to) {
    return <Link to={to}>{content}</Link>
  }

  return (
    <button type="button" onClick={onClick} className="w-full text-left">
      {content}
    </button>
  )
}

function formatStatus(s: string): ApplicationHistoryItem['status'] {
  if (s === 'approved') return 'Approved'
  if (s === 'rejected') return 'Rejected'
  if (s === 'withdrawn') return 'Withdrawn'
  return 'Pending'
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

export function AccountSettingsPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { role: profileRole, loading: roleLoading } = useProfileRole(user)
  const [deleteAccountOpen, setDeleteAccountOpen] = useState(false)
  const [deletingAccount, setDeletingAccount] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [applicationHistory, setApplicationHistory] = useState<ApplicationHistoryItem[]>([])
  const [loadingHistory, setLoadingHistory] = useState(true)

  async function handleDeleteAccount() {
    if (!user) return
    setDeletingAccount(true)
    setDeleteError(null)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token
      if (!token) {
        setDeleteError('Session expired. Please sign in again.')
        return
      }
      const res = await fetch('/api/account/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) {
        setDeleteError(body.error || 'Failed to delete account')
        return
      }
      await supabase.auth.signOut()
      navigate('/', { replace: true })
      window.location.reload()
    } catch {
      setDeleteError('Failed to delete account')
    } finally {
      setDeletingAccount(false)
    }
  }

  useEffect(() => {
    async function loadApplications() {
      if (!user || profileRole !== 'tenant') {
        setLoadingHistory(false)
        return
      }

      setLoadingHistory(true)
      const { data } = await supabase
        .from('applications')
        .select('id, status, created_at, property:property_id(title, address_line1)')
        .eq('tenant_id', user.id)
        .order('created_at', { ascending: false })

      setApplicationHistory(
        (data ?? []).map((row: { id: string; status: string; created_at: string; property?: { title?: string; address_line1?: string } }) => ({
          id: row.id,
          property: row.property?.title || row.property?.address_line1 || 'Property',
          appliedDate: formatDate(row.created_at),
          status: formatStatus(row.status),
        })),
      )
      setLoadingHistory(false)
    }

    loadApplications()
  }, [user, profileRole])

  if (roleLoading || profileRole === null) {
    return (
      <div className="flex flex-1 items-center justify-center py-12">
        <span className="text-gray-500">Loading...</span>
      </div>
    )
  }

  if (profileRole === 'landlord') {
    return (
      <div className="space-y-5 py-6">
        <div className="mb-7">
          <h1 className="text-[2rem] font-medium text-gray-900">Settings</h1>
          <p className="mt-2 text-sm text-gray-600">
            Manage your account settings, payment methods, and support options.
          </p>
        </div>

        <div className="space-y-5">
          <LandlordSettingsGroup title="Account Settings">
            <LandlordSettingsItem
              to="/account/settings/change-email"
              title="Change Email"
              description="Update your email address"
              icon={
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              }
            />
            <LandlordSettingsItem
              to="/account/settings/change-password"
              title="Change Password"
              description="Update your account password"
              icon={
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c1.657 0 3-1.343 3-3V7a3 3 0 10-6 0v1c0 1.657 1.343 3 3 3zm-7 9h14a2 2 0 002-2v-5a2 2 0 00-2-2H5a2 2 0 00-2 2v5a2 2 0 002 2z" />
                </svg>
              }
            />
          </LandlordSettingsGroup>

          <LandlordSettingsGroup title="Payment Settings">
            <LandlordSettingsItem
              to="/account/settings/payment-method"
              title="View Payment Method"
              description="See your current payment method via Stripe"
              icon={
                <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">stripe</span>
              }
            />
            <LandlordSettingsItem
              to="/account/settings/payment-history"
              title="Match Purchase History"
              description="View your match unlock transaction history"
              icon={
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              }
            />
          </LandlordSettingsGroup>

          <LandlordSettingsGroup title="Support">
            <LandlordSettingsItem
              to="/account/settings/support"
              title="Contact Support"
              description="Get help from our team"
              icon={
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              }
            />
            <LandlordSettingsItem
              to="/account/settings/legal/terms"
              title="Terms of Services"
              description="View our terms and conditions to better understand the platform."
              icon={
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              }
            />
            <LandlordSettingsItem
              to="/account/settings/legal/privacy"
              title="Privacy Policy"
              description="View our privacy policy to understand how securely handle data."
              icon={
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              }
            />
            <LandlordSettingsItem
              title="Delete Account"
              description="Permanently close your account and remove your personal information from our platform. This action is irreversible."
              onClick={() => { setDeleteAccountOpen(true); setDeleteError(null) }}
              icon={
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              }
            />
          </LandlordSettingsGroup>
        </div>


        {deleteAccountOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4">
            <div className="w-full max-w-lg rounded-xl bg-white p-5 shadow-xl">
              <div className="flex items-start justify-between gap-3 px-1 pt-1">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-red-50 text-red-400">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8h.01M12 12h.01M12 16h.01M5.93 19h12.14c1.54 0 2.5-1.67 1.73-3L13.73 5c-.77-1.33-2.69-1.33-3.46 0L4.2 16c-.77 1.33.19 3 1.73 3z" />
                  </svg>
                </div>
                <h2 className="pt-0.5 text-base font-medium text-gray-900">Delete Account?</h2>
                <button
                  type="button"
                  onClick={() => setDeleteAccountOpen(false)}
                  className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                  aria-label="Close delete account dialog"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="px-1 pb-1 pt-4">
                <p className="text-[1.7rem] font-semibold leading-tight text-gray-900">
                  Are you sure you want to delete your Rental City account?
                </p>
                <p className="mt-4 text-lg leading-8 text-gray-700">
                  If you choose to delete this user account, all of the associated data will be lost.
                </p>
                <p className="mt-5 text-base font-semibold uppercase tracking-wide text-gray-900">
                  THIS ACTION CAN NOT BE UNDONE.
                </p>

                {deleteError ? <p className="mt-4 text-sm text-red-600">{deleteError}</p> : null}

                <div className="mt-7 space-y-3">
                  <button
                    type="button"
                    onClick={handleDeleteAccount}
                    disabled={deletingAccount}
                    className="w-full rounded-lg bg-[#ef4444] py-3 text-sm font-medium text-white hover:bg-[#dc2626] disabled:opacity-50"
                  >
                    {deletingAccount ? 'Deleting...' : 'Delete Account'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteAccountOpen(false)}
                    className="w-full rounded-lg bg-slate-900 py-3 text-sm font-medium text-white hover:bg-slate-800"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-5 py-6">
      {/* Account */}
      <SectionCard
        title="Account"
        icon={
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        }
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Email Address</p>
              <p className="font-medium text-gray-900">{user?.email}</p>
            </div>
            <Link
              to="/account/settings/change-email"
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Change Email
            </Link>
          </div>
          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
            <div>
              <p className="text-sm text-gray-500">Password</p>
              <p className="font-medium text-gray-900">••••••••••••</p>
            </div>
            <Link
              to="/account/settings/change-password"
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Change Password
            </Link>
          </div>
        </div>
      </SectionCard>

      {/* Application Fee */}
      <SectionCard
        title="Application Fee"
        icon={
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0-9v1m0 8v-1m0 0c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        }
      >
        <div className="p-4 bg-gray-50 rounded-lg mb-4">
          <p className="text-sm text-gray-600 mb-1">Current Fee: $125.00</p>
          <p className="text-sm text-gray-500">Covers all applications for a 6 month time period.</p>
        </div>
        <Link
          to="/account/settings/payment-history"
          className="inline-flex px-4 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800"
        >
          View Charges
        </Link>
      </SectionCard>

      {/* Payment Method */}
      <SectionCard
        title="Payment Method"
        icon={
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
          </svg>
        }
      >
        <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg mb-4">
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-gray-500">VISA</span>
            <div>
              <p className="font-medium text-gray-900">•••••••••••• 4242</p>
              <p className="text-sm text-gray-500">Expires 12/2027</p>
            </div>
          </div>
          <button type="button" className="p-2 text-gray-400 hover:text-gray-600" aria-label="Payment options">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
            </svg>
          </button>
        </div>
        <button
          type="button"
          className="w-full py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          + Add Payment Method
        </button>
      </SectionCard>

      {/* Application History */}
      <SectionCard
        title="Application History"
        icon={
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        }
      >
        <div className="space-y-3 mb-4">
          {loadingHistory ? (
            <p className="text-sm text-gray-500">Loading...</p>
          ) : applicationHistory.length === 0 ? (
            <p className="text-sm text-gray-500">No applications yet.</p>
          ) : (
            applicationHistory.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3"
              >
                <div>
                  <p className="font-medium text-gray-900">{item.property}</p>
                  <p className="text-sm text-gray-500">Applied on {item.appliedDate}</p>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-sm font-medium ${
                    item.status === 'Approved' ? 'bg-gray-100 text-gray-700' : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {item.status}
                </span>
              </div>
            ))
          )}
        </div>
        <button
          type="button"
          className="w-full py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          View All History
        </button>
      </SectionCard>

      {/* Support */}
      <SectionCard
        title="Support"
        icon={
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        }
      >
        <div className="space-y-3">
          <Link to="/account/settings/support" className="flex gap-3 rounded-lg border border-gray-200 p-4 hover:bg-gray-50">
            <svg className="w-5 h-5 text-gray-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <div>
              <p className="font-medium text-gray-900">Contact Support</p>
              <p className="text-sm text-gray-500">Get help from our team</p>
            </div>
          </Link>
          <Link to="/account/settings/legal/terms" className="flex gap-3 rounded-lg border border-gray-200 p-4 hover:bg-gray-50">
            <svg className="w-5 h-5 text-gray-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <div>
              <p className="font-medium text-gray-900">Terms of Service</p>
              <p className="text-sm text-gray-500">View our terms and conditions to better understand the platform.</p>
            </div>
          </Link>
          <Link to="/account/settings/legal/privacy" className="flex gap-3 rounded-lg border border-gray-200 p-4 hover:bg-gray-50">
            <svg className="w-5 h-5 text-gray-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <div>
              <p className="font-medium text-gray-900">Privacy Policy</p>
              <p className="text-sm text-gray-500">View our privacy policy to understand how we securely handle data.</p>
            </div>
          </Link>
          <button
            type="button"
            onClick={() => { setDeleteAccountOpen(true); setDeleteError(null) }}
            className="w-full flex gap-3 rounded-lg border border-gray-200 p-4 text-left hover:bg-gray-50"
          >
            <svg className="w-5 h-5 text-gray-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            <div>
              <p className="font-medium text-gray-900">Delete Account</p>
              <p className="text-sm text-gray-500">Permanently close your account and remove your personal information from our platform. This action is irreversible.</p>
            </div>
          </button>
        </div>
      </SectionCard>

      {deleteAccountOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4">
            <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between gap-4 px-5 pt-5">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-50 text-red-400">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M5.93 19h12.14c1.54 0 2.5-1.67 1.73-3L13.73 5c-.77-1.33-2.69-1.33-3.46 0L4.2 16c-.77 1.33.19 3 1.73 3z" />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-gray-900">Delete Account?</h2>
              </div>
              <button
                type="button"
                onClick={() => setDeleteAccountOpen(false)}
                className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                aria-label="Close delete account dialog"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="px-5 pb-5 pt-4">
              <p className="text-[1.75rem] font-semibold leading-tight text-gray-900">
                Are you sure you want to delete your Rental City account?
              </p>
              <p className="mt-5 text-lg leading-8 text-gray-700">
                If you choose to delete this user account, all of the associated data will be lost.
              </p>
              <p className="mt-5 text-base font-semibold uppercase tracking-wide text-gray-900">
                This action can not be undone.
              </p>

              {deleteError ? <p className="mt-4 text-sm text-red-600">{deleteError}</p> : null}

              <div className="mt-8 space-y-3">
                <button
                  type="button"
                  onClick={handleDeleteAccount}
                  disabled={deletingAccount}
                  className="w-full rounded-xl bg-red-500 py-3 text-base font-medium text-white hover:bg-red-600 disabled:opacity-50"
                >
                  {deletingAccount ? 'Deleting...' : 'Delete Account'}
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteAccountOpen(false)}
                  className="w-full rounded-xl bg-slate-900 py-3 text-base font-medium text-white hover:bg-slate-800"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
