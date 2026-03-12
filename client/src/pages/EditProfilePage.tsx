import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/useAuth'
import { useProfileRole } from '../lib/useProfileRole'
import { supabase } from '../lib/supabase'

const AVATAR_BUCKET = 'avatars'

type ProfileRecord = {
  display_name: string | null
  avatar_url: string | null
  phone: string | null
  role?: string | null
} | null

const DEFAULTS = {
  fullName: 'Sarah Johnson',
  phoneNumber: '+1 (555) 123-4567',
  bio:
    "I'm a marketing professional looking for a quiet, pet-friendly place to call home. I work remotely most days and enjoy cooking, reading, and spending time with my cat, Luna. I'm a responsible tenant who values cleanliness and maintaining good relationships with landlords and neighbors.",
  leaseIntent: '',
  moveInAvailability: '2025-03-01',
  budgetMin: '2500',
  budgetMax: '3500',
}

function Field({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-gray-700">{label}</span>
      {children}
    </label>
  )
}

function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`h-11 w-full rounded-lg border border-gray-300 px-4 text-sm text-gray-900 outline-none transition focus:border-gray-500 focus:ring-2 focus:ring-gray-200 ${
        props.className ?? ''
      }`}
    />
  )
}

export function EditProfilePage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { role: profileRole, loading: roleLoading } = useProfileRole(user)
  const [profile, setProfile] = useState<ProfileRecord>(null)
  const [saving, setSaving] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [photoError, setPhotoError] = useState<string | null>(null)
  const [photoPreviewOpen, setPhotoPreviewOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [fullName, setFullName] = useState(DEFAULTS.fullName)
  const [phoneNumber, setPhoneNumber] = useState(DEFAULTS.phoneNumber)
  const [bio, setBio] = useState(DEFAULTS.bio)
  const [leaseIntent, setLeaseIntent] = useState(DEFAULTS.leaseIntent)
  const [moveInAvailability, setMoveInAvailability] = useState(DEFAULTS.moveInAvailability)
  const [budgetMin, setBudgetMin] = useState(DEFAULTS.budgetMin)
  const [budgetMax, setBudgetMax] = useState(DEFAULTS.budgetMax)
  const [firstName, setFirstName] = useState('Sarah')
  const [lastName, setLastName] = useState('Johnson')
  const [location, setLocation] = useState('San Francisco, CA')
  const [businessName, setBusinessName] = useState('Johnson Property Management LLC')
  const [businessType, setBusinessType] = useState('Limited Liability Company')
  const [businessAddress, setBusinessAddress] = useState('1234 Market Street, Suite 500, San Francisco, CA 94102')
  const [businessPhone, setBusinessPhone] = useState('(415) 555-0123')
  const [businessEmail, setBusinessEmail] = useState('info@johnsonproperties.com')
  const [website, setWebsite] = useState('www.johnsonproperties.com')
  const [personalPhone, setPersonalPhone] = useState('(415) 555-0198')
  const [personalEmail, setPersonalEmail] = useState('sarah.johnson@email.com')
  const [preferredContactMethod, setPreferredContactMethod] = useState('Email')
  const [emergencyContact, setEmergencyContact] = useState('Michael Johnson - (415) 555-0199')
  const [landlordBio, setLandlordBio] = useState(
    "I'm a professional property manager with over 6 years of experience in the San Francisco rental market. I believe in creating positive, long-term relationships with my tenants and maintaining high-quality living spaces. I'm responsive to maintenance requests and always available for any questions or concerns.",
  )

  useEffect(() => {
    async function loadProfile() {
      if (!user) return

      const { data } = await supabase
        .from('profiles')
        .select('display_name, avatar_url, phone')
        .eq('id', user.id)
        .maybeSingle()

      setProfile(data)
      setFullName(data?.display_name?.trim() || DEFAULTS.fullName)
      setPhoneNumber(data?.phone || DEFAULTS.phoneNumber)
    }

    loadProfile()
  }, [user])

  if (roleLoading || profileRole === null) {
    return (
      <div className="flex flex-1 items-center justify-center py-12">
        <span className="text-gray-500">Loading...</span>
      </div>
    )
  }

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !user) return

    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    if (!validTypes.includes(file.type)) {
      setPhotoError('Please select a JPEG, PNG, GIF, or WebP image.')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setPhotoError('Image must be under 5MB.')
      return
    }

    setUploadingPhoto(true)
    setPhotoError(null)

    const ext = file.name.split('.').pop() || 'jpg'
    const path = `${user.id}/avatar.${ext}`

    const { error: uploadError } = await supabase.storage
      .from(AVATAR_BUCKET)
      .upload(path, file, { upsert: true })

    if (uploadError) {
      setPhotoError(uploadError.message)
      setUploadingPhoto(false)
      e.target.value = ''
      return
    }

    const { data: urlData } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(path)
    const avatarUrl = urlData.publicUrl

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ avatar_url: avatarUrl })
      .eq('id', user.id)

    setUploadingPhoto(false)
    e.target.value = ''

    if (updateError) {
      setPhotoError(updateError.message)
      return
    }

    setProfile((p) => (p ? { ...p, avatar_url: avatarUrl } : null))
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!user) return

    setSaving(true)
    setError(null)

    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        display_name: fullName,
        phone: phoneNumber || null,
      })
      .eq('id', user.id)

    setSaving(false)

    if (updateError) {
      setError(updateError.message)
      return
    }

    navigate('/account')
  }

  if (profileRole === 'landlord') {
    return (
      <div className="space-y-6">
        <form onSubmit={handleSave}>
          <div className="mb-6 flex items-start justify-between gap-4">
            <h1 className="text-[2rem] font-medium text-gray-900">Edit Profile</h1>
            <div className="flex items-center gap-3">
              <Link
                to="/account"
                className="inline-flex items-center justify-center rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>

          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_220px]">
            <div className="space-y-5">
              <div className="rounded-xl border border-gray-200 bg-white p-5">
                <h2 className="mb-5 text-[1.45rem] font-medium text-gray-900">Profile Information</h2>
                <div className="grid gap-4 md:grid-cols-[72px_minmax(0,1fr)]">
                  <div className="flex flex-col items-center">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/gif,image/webp"
                      onChange={handlePhotoChange}
                      className="sr-only"
                      aria-label="Upload profile photo"
                    />
                    <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-full bg-gray-100 text-gray-600">
                      {profile?.avatar_url ? (
                        <button
                          type="button"
                          onClick={() => setPhotoPreviewOpen(true)}
                          className="h-14 w-14 overflow-hidden rounded-full focus:outline-none focus:ring-2 focus:ring-gray-400"
                        >
                          <img src={profile.avatar_url} alt={fullName} className="h-14 w-14 object-cover" />
                        </button>
                      ) : (
                        <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setPhotoError(null)
                        fileInputRef.current?.click()
                      }}
                      disabled={uploadingPhoto}
                      className="mt-3 text-sm text-gray-700 hover:text-gray-900 disabled:opacity-50"
                    >
                      {uploadingPhoto ? 'Uploading...' : 'Change Photo'}
                    </button>
                    {photoError ? (
                      <p className="mt-2 text-sm text-red-600">{photoError}</p>
                    ) : null}
                  </div>

                  <div className="space-y-4">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Field label="First Name">
                        <TextInput value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                      </Field>
                      <Field label="Last Name">
                        <TextInput value={lastName} onChange={(e) => setLastName(e.target.value)} />
                      </Field>
                    </div>

                    <Field label="Location">
                      <TextInput value={location} onChange={(e) => setLocation(e.target.value)} />
                    </Field>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-gray-200 bg-white p-5">
                <h2 className="mb-5 text-[1.45rem] font-medium text-gray-900">Business Information</h2>
                <div className="space-y-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field label="Business Name">
                      <TextInput value={businessName} onChange={(e) => setBusinessName(e.target.value)} />
                    </Field>
                    <Field label="Business Type">
                      <div className="relative">
                        <select
                          value={businessType}
                          onChange={(e) => setBusinessType(e.target.value)}
                          className="h-11 w-full appearance-none rounded-lg border border-gray-300 bg-white px-4 pr-10 text-sm text-gray-900 outline-none transition focus:border-gray-500 focus:ring-2 focus:ring-gray-200"
                        >
                          <option>Limited Liability Company</option>
                          <option>Sole Proprietorship</option>
                          <option>Corporation</option>
                        </select>
                        <svg className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </Field>
                  </div>

                  <Field label="Business Address">
                    <TextInput value={businessAddress} onChange={(e) => setBusinessAddress(e.target.value)} />
                  </Field>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field label="Business Phone">
                      <TextInput value={businessPhone} onChange={(e) => setBusinessPhone(e.target.value)} />
                    </Field>
                    <Field label="Business Email">
                      <TextInput value={businessEmail} onChange={(e) => setBusinessEmail(e.target.value)} />
                    </Field>
                  </div>

                  <Field label="Website">
                    <TextInput value={website} onChange={(e) => setWebsite(e.target.value)} />
                  </Field>
                </div>
              </div>

              <div className="rounded-xl border border-gray-200 bg-white p-5">
                <h2 className="mb-5 text-[1.45rem] font-medium text-gray-900">Contact Information</h2>
                <div className="space-y-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field label="Personal Phone">
                      <TextInput value={personalPhone} onChange={(e) => setPersonalPhone(e.target.value)} />
                    </Field>
                    <Field label="Personal Email">
                      <TextInput value={personalEmail} onChange={(e) => setPersonalEmail(e.target.value)} />
                    </Field>
                  </div>

                  <Field label="Preferred Contact Method">
                    <div className="relative">
                      <select
                        value={preferredContactMethod}
                        onChange={(e) => setPreferredContactMethod(e.target.value)}
                        className="h-11 w-full appearance-none rounded-lg border border-gray-300 bg-white px-4 pr-10 text-sm text-gray-900 outline-none transition focus:border-gray-500 focus:ring-2 focus:ring-gray-200"
                      >
                        <option>Email</option>
                        <option>Phone</option>
                        <option>Text</option>
                      </select>
                      <svg className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </Field>

                  <Field label="Emergency Contact">
                    <TextInput value={emergencyContact} onChange={(e) => setEmergencyContact(e.target.value)} />
                  </Field>
                </div>
              </div>

              <div className="rounded-xl border border-gray-200 bg-white p-5">
                <h2 className="mb-5 text-[1.45rem] font-medium text-gray-900">About Me</h2>
                <Field label="Bio Description">
                  <textarea
                    value={landlordBio}
                    onChange={(e) => setLandlordBio(e.target.value)}
                    rows={5}
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-gray-500 focus:ring-2 focus:ring-gray-200"
                  />
                </Field>
                <p className="mt-2 text-xs text-gray-400">500 characters remaining</p>
              </div>
            </div>

            <div className="space-y-5">
              <div className="rounded-xl border border-gray-200 bg-white p-5">
                <h2 className="mb-5 text-[1.35rem] font-medium text-gray-900">Profile Preview</h2>
                <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-8 text-center">
                  <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-white text-gray-500 shadow-sm">
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </div>
                  <p className="mt-4 text-sm text-gray-500">Preview how your profile appears to tenants</p>
                  <Link
                    to="/account/profile-preview"
                    className="mt-4 inline-block text-sm font-medium text-gray-800 hover:text-gray-900"
                  >
                    View Public Profile
                  </Link>
                </div>
              </div>

              <div className="rounded-xl border border-gray-200 bg-white p-5">
                <h2 className="mb-5 text-[1.35rem] font-medium text-gray-900">Profile Tips</h2>
                <div className="space-y-4 text-sm text-gray-600">
                  {[
                    'Complete all sections to improve your profile visibility',
                    'A detailed bio helps tenants understand your management style',
                    'Keep your contact information up to date for better communication',
                  ].map((tip) => (
                    <div key={tip} className="flex items-start gap-2.5">
                      <svg className="mt-0.5 h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>{tip}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-gray-200 bg-white p-5">
                <h2 className="mb-5 text-[1.35rem] font-medium text-gray-900">Profile Completion</h2>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Profile Completion</span>
                  <span className="text-gray-900">95%</span>
                </div>
                <div className="mt-4 h-2 rounded-full bg-gray-200">
                  <div className="h-2 w-[95%] rounded-full bg-gray-900" />
                </div>
                <p className="mt-4 text-xs text-gray-400">Complete your website URL to reach 100%</p>
              </div>
            </div>
          </div>

          {error ? <p className="mt-5 text-sm text-red-600">{error}</p> : null}

        </form>

        {photoPreviewOpen && profile?.avatar_url && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
            onClick={() => setPhotoPreviewOpen(false)}
          >
            <button
              type="button"
              onClick={() => setPhotoPreviewOpen(false)}
              className="absolute right-4 top-4 rounded-full bg-white/90 p-2 text-gray-600 hover:bg-white"
              aria-label="Close"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <img
              src={profile.avatar_url}
              alt={fullName}
              className="max-h-[90vh] max-w-full rounded-lg object-contain shadow-xl"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSave}>
        <div className="mb-6">
          <h1 className="text-[2rem] font-medium text-gray-900">My Profile</h1>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <div className="mb-6 flex items-start gap-4">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              onChange={handlePhotoChange}
              className="sr-only"
              aria-label="Upload profile photo"
            />
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-gray-100 text-gray-600">
              {profile?.avatar_url ? (
                <button
                  type="button"
                  onClick={() => setPhotoPreviewOpen(true)}
                  className="h-12 w-12 overflow-hidden rounded-full focus:outline-none focus:ring-2 focus:ring-gray-400"
                >
                  <img src={profile.avatar_url} alt={fullName} className="h-12 w-12 object-cover" />
                </button>
              ) : (
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <button
                type="button"
                onClick={() => {
                  setPhotoError(null)
                  fileInputRef.current?.click()
                }}
                disabled={uploadingPhoto}
                className="text-sm font-medium text-gray-600 hover:text-gray-900 disabled:opacity-50"
              >
                {uploadingPhoto ? 'Uploading...' : 'Change Photo'}
              </button>
              {photoError ? (
                <p className="mt-1 text-sm text-red-600">{photoError}</p>
              ) : null}
              <h2 className="mt-1 text-[1.75rem] font-medium text-gray-900">Edit Profile</h2>
              <p className="mt-1 text-sm text-gray-600">Update your personal information and preferences</p>
            </div>
          </div>

          <div className="space-y-5">
            <Field label="Full Name">
              <TextInput value={fullName} onChange={(e) => setFullName(e.target.value)} />
            </Field>

            <Field label="Phone Number">
              <div className="relative">
                <TextInput value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} className="pl-10" />
                <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h2.28a2 2 0 011.897 1.368l1.156 3.47a2 2 0 01-.455 2.11l-1.274 1.274a16 16 0 006.364 6.364l1.274-1.274a2 2 0 012.11-.455l3.47 1.156A2 2 0 0121 18.72V21a2 2 0 01-2 2h-1C9.716 23 1 14.284 1 3V2a2 2 0 012-2z" />
                </svg>
              </div>
            </Field>

            <Field label="Bio / About Me">
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={4}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-gray-500 focus:ring-2 focus:ring-gray-200"
              />
            </Field>

            <Field label="Lease Intent">
              <div className="relative">
                <select
                  value={leaseIntent}
                  onChange={(e) => setLeaseIntent(e.target.value)}
                  className="h-11 w-full appearance-none rounded-lg border border-gray-300 bg-white px-4 pr-10 text-sm text-gray-900 outline-none transition focus:border-gray-500 focus:ring-2 focus:ring-gray-200"
                >
                  <option value="">Select lease duration preference</option>
                  <option value="6-12">6-12 months</option>
                  <option value="12-24">12-24 months</option>
                  <option value="24+">24+ months</option>
                </select>
                <svg className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </Field>

            <Field label="Move-In Availability">
              <div className="relative">
                <TextInput
                  type="date"
                  value={moveInAvailability}
                  onChange={(e) => setMoveInAvailability(e.target.value)}
                  className="pl-10"
                />
                <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10m-11 9h12a2 2 0 002-2V7a2 2 0 00-2-2H6a2 2 0 00-2 2v11a2 2 0 002 2z" />
                </svg>
              </div>
            </Field>

            <div className="border-t border-gray-200 pt-5">
              <h3 className="mb-4 text-[1.75rem] font-medium text-gray-900">Additional Preferences</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Budget Range (Min)">
                  <div className="relative">
                    <TextInput value={budgetMin} onChange={(e) => setBudgetMin(e.target.value)} className="pl-8" />
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">$</span>
                  </div>
                </Field>
                <Field label="Budget Range (Max)">
                  <div className="relative">
                    <TextInput value={budgetMax} onChange={(e) => setBudgetMax(e.target.value)} className="pl-8" />
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">$</span>
                  </div>
                </Field>
              </div>
            </div>

            {error ? <p className="text-sm text-red-600">{error}</p> : null}

            <div className="flex items-center gap-3 pt-2">
              <Link
                to="/account"
                className="inline-flex items-center justify-center rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>

      </form>

      {photoPreviewOpen && profile?.avatar_url && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setPhotoPreviewOpen(false)}
        >
          <button
            type="button"
            onClick={() => setPhotoPreviewOpen(false)}
            className="absolute right-4 top-4 rounded-full bg-white/90 p-2 text-gray-600 hover:bg-white"
            aria-label="Close"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <img
            src={profile.avatar_url}
            alt={fullName}
            className="max-h-[90vh] max-w-full rounded-lg object-contain shadow-xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  )
}
