import { useState } from 'react'
import { Link } from 'react-router-dom'

function InputIcon({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
      {children}
    </span>
  )
}

function FormInput({
  id,
  type = 'text',
  value,
  onChange,
  placeholder,
  icon,
  className = '',
}: {
  id: string
  type?: string
  value: string
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void
  placeholder: string
  icon?: React.ReactNode
  className?: string
}) {
  return (
    <div className="relative">
      <input
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`w-full rounded-xl border border-gray-300 px-5 py-4 text-base text-gray-900 placeholder:text-gray-400 focus:border-gray-500 focus:ring-2 focus:ring-gray-200 ${icon ? 'pr-12' : ''} ${className}`}
      />
      {icon ? <InputIcon>{icon}</InputIcon> : null}
    </div>
  )
}

export function ApplicationFormPage() {
  const [step, setStep] = useState(1)
  const [fullName, setFullName] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [ssn, setSsn] = useState('')
  const [dateOfBirth, setDateOfBirth] = useState('')
  const [currentAddress, setCurrentAddress] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [zipCode, setZipCode] = useState('')
  const [previousAddress, setPreviousAddress] = useState('')
  const [landlordName, setLandlordName] = useState('')
  const [landlordEmail, setLandlordEmail] = useState('')
  const [landlordPhone, setLandlordPhone] = useState('')
  const [reasonForLeaving, setReasonForLeaving] = useState('')
  const [residenceStartDate, setResidenceStartDate] = useState('')
  const [residenceEndDate, setResidenceEndDate] = useState('')
  const [employerName, setEmployerName] = useState('')
  const [jobTitle, setJobTitle] = useState('')
  const [monthlyIncome, setMonthlyIncome] = useState('')
  const [employmentType, setEmploymentType] = useState('Full-time')
  const [employmentStartDate, setEmploymentStartDate] = useState('')
  const [employmentEndDate, setEmploymentEndDate] = useState('')
  const [currentPosition, setCurrentPosition] = useState(false)
  const [supervisorName, setSupervisorName] = useState('')
  const [supervisorPhone, setSupervisorPhone] = useState('')
  const [secondEmployerName, setSecondEmployerName] = useState('')
  const [secondJobTitle, setSecondJobTitle] = useState('')
  const [secondMonthlyIncome, setSecondMonthlyIncome] = useState('')
  const [secondEmploymentType, setSecondEmploymentType] = useState('Full-time')
  const [secondEmploymentStartDate, setSecondEmploymentStartDate] = useState('')
  const [secondEmploymentEndDate, setSecondEmploymentEndDate] = useState('')
  const [secondSupervisorName, setSecondSupervisorName] = useState('')
  const [secondSupervisorPhone, setSecondSupervisorPhone] = useState('')

  const isStepOne = step === 1
  const isStepTwo = step === 2
  const progressWidth = 'w-3/5'
  const progressLabel = '60% Complete'
  const containerWidthClass = isStepOne ? 'max-w-[540px]' : 'max-w-[780px]'

  return (
    <div className="px-4 py-8">
      <div className={containerWidthClass}>
        <div className="mb-6">
          <div className="mb-3 flex items-center justify-between gap-4">
            <p className="text-sm text-gray-700">Step {step} of 5</p>
            <p className="text-sm text-gray-500">{progressLabel}</p>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-gray-200">
            <div className={`h-full rounded-full bg-gray-900 ${progressWidth}`} />
          </div>
        </div>

        <div className="mb-7">
          <h1 className="mb-2 text-[2rem] font-semibold tracking-tight text-gray-900">
            {isStepOne ? 'Personal Information' : isStepTwo ? 'Rental History (3 Years)' : 'Employment History (5 Years)'}
          </h1>
          <p className="text-sm text-gray-600">
            {isStepOne
              ? 'Please provide your basic personal details to continue with your application.'
              : isStepTwo
                ? 'Please provide information about your previous residences in the last 3 years.'
                : 'Please provide your employment history for the past 5 years. Include all jobs, even part-time positions.'}
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 md:p-6">
          {isStepOne ? (
            <div className="space-y-5">
              <div>
                <label htmlFor="full-name" className="mb-2 block text-sm font-medium text-gray-800">
                  Full Name *
                </label>
                <FormInput
                  id="full-name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter your full legal name"
                  icon={
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  }
                />
              </div>

              <div>
                <label htmlFor="phone-number" className="mb-2 block text-sm font-medium text-gray-800">
                  Phone Number *
                </label>
                <FormInput
                  id="phone-number"
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="(555) 123-4567"
                  icon={
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h2.28a2 2 0 011.897 1.368l1.156 3.47a2 2 0 01-.455 2.11l-1.274 1.274a16 16 0 006.364 6.364l1.274-1.274a2 2 0 012.11-.455l3.47 1.156A2 2 0 0121 18.72V21a2 2 0 01-2 2h-1C9.716 23 1 14.284 1 3V2a2 2 0 012-2z" />
                    </svg>
                  }
                />
              </div>

              <div>
                <label htmlFor="ssn" className="mb-2 block text-sm font-medium text-gray-800">
                  Social Security Number *
                </label>
                <FormInput
                  id="ssn"
                  value={ssn}
                  onChange={(e) => setSsn(e.target.value)}
                  placeholder="XXX-XX-XXXX"
                  icon={
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  }
                />
                <p className="mt-2 text-xs text-gray-500">
                  Your SSN is encrypted and used only for background checks
                </p>
              </div>

              <div>
                <label htmlFor="date-of-birth" className="mb-2 block text-sm font-medium text-gray-800">
                  Date of Birth *
                </label>
                <FormInput
                  id="date-of-birth"
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  placeholder="mm/dd/yyyy"
                  icon={
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10m-11 9h12a2 2 0 002-2V7a2 2 0 00-2-2H6a2 2 0 00-2 2v11a2 2 0 002 2z" />
                    </svg>
                  }
                />
              </div>

              <div>
                <label htmlFor="current-address" className="mb-2 block text-sm font-medium text-gray-800">
                  Current Address *
                </label>
                <FormInput
                  id="current-address"
                  value={currentAddress}
                  onChange={(e) => setCurrentAddress(e.target.value)}
                  placeholder="Street address"
                  icon={
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a2 2 0 01-2.828 0l-4.243-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  }
                />
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <FormInput
                  id="city"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="City"
                />
                <FormInput
                  id="state"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  placeholder="State"
                />
              </div>

              <FormInput
                id="zip-code"
                value={zipCode}
                onChange={(e) => setZipCode(e.target.value)}
                placeholder="ZIP Code"
              />
            </div>
          ) : isStepTwo ? (
            <div className="rounded-2xl border border-gray-200 p-5 md:p-6">
              <div className="rounded-2xl border border-gray-200 p-4 md:p-5">
                <div className="mb-5 flex items-start justify-between gap-3">
                  <h2 className="text-[1.75rem] font-medium text-gray-900">Previous Residence #1</h2>
                  <button
                    type="button"
                    aria-label="Remove residence"
                    className="rounded-md p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>

                <div className="space-y-5">
                  <div>
                    <label htmlFor="previous-address" className="mb-2 block text-sm font-medium text-gray-800">
                      Address
                    </label>
                    <FormInput
                      id="previous-address"
                      value={previousAddress}
                      onChange={(e) => setPreviousAddress(e.target.value)}
                      placeholder="123 Main Street, City, State, ZIP"
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label htmlFor="landlord-name" className="mb-2 block text-sm font-medium text-gray-800">
                        Landlord Name
                      </label>
                      <FormInput
                        id="landlord-name"
                        value={landlordName}
                        onChange={(e) => setLandlordName(e.target.value)}
                        placeholder="Enter landlord's full name"
                      />
                    </div>
                    <div>
                      <label htmlFor="landlord-email" className="mb-2 block text-sm font-medium text-gray-800">
                        Landlord Email
                      </label>
                      <FormInput
                        id="landlord-email"
                        type="email"
                        value={landlordEmail}
                        onChange={(e) => setLandlordEmail(e.target.value)}
                        placeholder="landlord@email.com"
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label htmlFor="landlord-phone" className="mb-2 block text-sm font-medium text-gray-800">
                        Landlord Phone
                      </label>
                      <FormInput
                        id="landlord-phone"
                        type="tel"
                        value={landlordPhone}
                        onChange={(e) => setLandlordPhone(e.target.value)}
                        placeholder="(555) 123-4567"
                      />
                    </div>
                    <div>
                      <label htmlFor="reason-for-leaving" className="mb-2 block text-sm font-medium text-gray-800">
                        Reason for Leaving
                      </label>
                      <div className="relative">
                        <select
                          id="reason-for-leaving"
                          value={reasonForLeaving}
                          onChange={(e) => setReasonForLeaving(e.target.value)}
                          className="w-full appearance-none rounded-xl border border-gray-300 bg-white px-5 py-4 pr-12 text-base text-gray-900 focus:border-gray-500 focus:ring-2 focus:ring-gray-200"
                        >
                          <option value="">Select reason</option>
                          <option value="relocating">Relocating</option>
                          <option value="rent-increase">Rent increase</option>
                          <option value="needed-space">Needed more space</option>
                          <option value="other">Other</option>
                        </select>
                        <InputIcon>
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </InputIcon>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label htmlFor="residence-start-date" className="mb-2 block text-sm font-medium text-gray-800">
                        Start Date
                      </label>
                      <FormInput
                        id="residence-start-date"
                        value={residenceStartDate}
                        onChange={(e) => setResidenceStartDate(e.target.value)}
                        placeholder="mm/dd/yyyy"
                        icon={
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10m-11 9h12a2 2 0 002-2V7a2 2 0 00-2-2H6a2 2 0 00-2 2v11a2 2 0 002 2z" />
                          </svg>
                        }
                      />
                    </div>
                    <div>
                      <label htmlFor="residence-end-date" className="mb-2 block text-sm font-medium text-gray-800">
                        End Date
                      </label>
                      <FormInput
                        id="residence-end-date"
                        value={residenceEndDate}
                        onChange={(e) => setResidenceEndDate(e.target.value)}
                        placeholder="mm/dd/yyyy"
                        icon={
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10m-11 9h12a2 2 0 002-2V7a2 2 0 00-2-2H6a2 2 0 00-2 2v11a2 2 0 002 2z" />
                          </svg>
                        }
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-center">
                <button
                  type="button"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white px-5 py-3 text-base font-medium text-gray-700 hover:bg-gray-50"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add Another Residence
                </button>
              </div>

              <div className="mt-6 border-t border-gray-200 pt-6" />
            </div>
          ) : (
            <div className="space-y-5">
              <div className="rounded-2xl border border-gray-200 p-5 md:p-6">
                <div className="mb-5 flex items-start justify-between gap-3">
                  <h2 className="text-[1.75rem] font-medium text-gray-900">Job #1 (Current/Most Recent)</h2>
                  <button
                    type="button"
                    aria-label="Remove job"
                    className="rounded-md p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>

                <div className="space-y-5">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label htmlFor="employer-name" className="mb-2 block text-sm font-medium text-gray-800">
                        Employer Name
                      </label>
                      <FormInput
                        id="employer-name"
                        value={employerName}
                        onChange={(e) => setEmployerName(e.target.value)}
                        placeholder="Company name"
                      />
                    </div>
                    <div>
                      <label htmlFor="job-title" className="mb-2 block text-sm font-medium text-gray-800">
                        Job Title
                      </label>
                      <FormInput
                        id="job-title"
                        value={jobTitle}
                        onChange={(e) => setJobTitle(e.target.value)}
                        placeholder="Your position"
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label htmlFor="monthly-income" className="mb-2 block text-sm font-medium text-gray-800">
                        Monthly Income
                      </label>
                      <FormInput
                        id="monthly-income"
                        value={monthlyIncome}
                        onChange={(e) => setMonthlyIncome(e.target.value)}
                        placeholder="$ 5000"
                      />
                    </div>
                    <div>
                      <label htmlFor="employment-type" className="mb-2 block text-sm font-medium text-gray-800">
                        Employment Type
                      </label>
                      <div className="relative">
                        <select
                          id="employment-type"
                          value={employmentType}
                          onChange={(e) => setEmploymentType(e.target.value)}
                          className="w-full appearance-none rounded-xl border border-gray-300 bg-white px-5 py-4 pr-12 text-base text-gray-900 focus:border-gray-500 focus:ring-2 focus:ring-gray-200"
                        >
                          <option>Full-time</option>
                          <option>Part-time</option>
                          <option>Contract</option>
                          <option>Self-employed</option>
                        </select>
                        <InputIcon>
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </InputIcon>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label htmlFor="employment-start-date" className="mb-2 block text-sm font-medium text-gray-800">
                        Start Date
                      </label>
                      <FormInput
                        id="employment-start-date"
                        value={employmentStartDate}
                        onChange={(e) => setEmploymentStartDate(e.target.value)}
                        placeholder="mm/dd/yyyy"
                        icon={
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10m-11 9h12a2 2 0 002-2V7a2 2 0 00-2-2H6a2 2 0 00-2 2v11a2 2 0 002 2z" />
                          </svg>
                        }
                      />
                    </div>
                    <div>
                      <label htmlFor="employment-end-date" className="mb-2 block text-sm font-medium text-gray-800">
                        End Date
                      </label>
                      <FormInput
                        id="employment-end-date"
                        value={employmentEndDate}
                        onChange={(e) => setEmploymentEndDate(e.target.value)}
                        placeholder="mm/dd/yyyy"
                        icon={
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10m-11 9h12a2 2 0 002-2V7a2 2 0 00-2-2H6a2 2 0 00-2 2v11a2 2 0 002 2z" />
                          </svg>
                        }
                      />
                      <label className="mt-2 inline-flex items-center gap-2 text-sm text-gray-600">
                        <input
                          type="checkbox"
                          checked={currentPosition}
                          onChange={(e) => setCurrentPosition(e.target.checked)}
                          className="h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                        />
                        Current position
                      </label>
                    </div>
                  </div>

                  <div className="border-t border-gray-200 pt-4">
                    <h3 className="mb-4 text-sm font-medium text-gray-800">Contact Information</h3>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <label htmlFor="supervisor-name" className="mb-2 block text-sm font-medium text-gray-800">
                          Supervisor Name
                        </label>
                        <FormInput
                          id="supervisor-name"
                          value={supervisorName}
                          onChange={(e) => setSupervisorName(e.target.value)}
                          placeholder="Supervisor's full name"
                        />
                      </div>
                      <div>
                        <label htmlFor="supervisor-phone" className="mb-2 block text-sm font-medium text-gray-800">
                          Phone Number
                        </label>
                        <FormInput
                          id="supervisor-phone"
                          type="tel"
                          value={supervisorPhone}
                          onChange={(e) => setSupervisorPhone(e.target.value)}
                          placeholder="(555) 123-4567"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-gray-200 p-5 md:p-6">
                <div className="mb-5 flex items-start justify-between gap-3">
                  <h2 className="text-[1.75rem] font-medium text-gray-900">Job #2</h2>
                  <button
                    type="button"
                    aria-label="Remove second job"
                    className="rounded-md p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>

                <div className="space-y-5">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label htmlFor="second-employer-name" className="mb-2 block text-sm font-medium text-gray-800">
                        Employer Name
                      </label>
                      <FormInput
                        id="second-employer-name"
                        value={secondEmployerName}
                        onChange={(e) => setSecondEmployerName(e.target.value)}
                        placeholder="Company name"
                      />
                    </div>
                    <div>
                      <label htmlFor="second-job-title" className="mb-2 block text-sm font-medium text-gray-800">
                        Job Title
                      </label>
                      <FormInput
                        id="second-job-title"
                        value={secondJobTitle}
                        onChange={(e) => setSecondJobTitle(e.target.value)}
                        placeholder="Your position"
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label htmlFor="second-monthly-income" className="mb-2 block text-sm font-medium text-gray-800">
                        Monthly Income
                      </label>
                      <FormInput
                        id="second-monthly-income"
                        value={secondMonthlyIncome}
                        onChange={(e) => setSecondMonthlyIncome(e.target.value)}
                        placeholder="$ 4500"
                      />
                    </div>
                    <div>
                      <label htmlFor="second-employment-type" className="mb-2 block text-sm font-medium text-gray-800">
                        Employment Type
                      </label>
                      <div className="relative">
                        <select
                          id="second-employment-type"
                          value={secondEmploymentType}
                          onChange={(e) => setSecondEmploymentType(e.target.value)}
                          className="w-full appearance-none rounded-xl border border-gray-300 bg-white px-5 py-4 pr-12 text-base text-gray-900 focus:border-gray-500 focus:ring-2 focus:ring-gray-200"
                        >
                          <option>Full-time</option>
                          <option>Part-time</option>
                          <option>Contract</option>
                          <option>Self-employed</option>
                        </select>
                        <InputIcon>
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </InputIcon>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label htmlFor="second-employment-start-date" className="mb-2 block text-sm font-medium text-gray-800">
                        Start Date
                      </label>
                      <FormInput
                        id="second-employment-start-date"
                        value={secondEmploymentStartDate}
                        onChange={(e) => setSecondEmploymentStartDate(e.target.value)}
                        placeholder="mm/dd/yyyy"
                        icon={
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10m-11 9h12a2 2 0 002-2V7a2 2 0 00-2-2H6a2 2 0 00-2 2v11a2 2 0 002 2z" />
                          </svg>
                        }
                      />
                    </div>
                    <div>
                      <label htmlFor="second-employment-end-date" className="mb-2 block text-sm font-medium text-gray-800">
                        End Date
                      </label>
                      <FormInput
                        id="second-employment-end-date"
                        value={secondEmploymentEndDate}
                        onChange={(e) => setSecondEmploymentEndDate(e.target.value)}
                        placeholder="mm/dd/yyyy"
                        icon={
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10m-11 9h12a2 2 0 002-2V7a2 2 0 00-2-2H6a2 2 0 00-2 2v11a2 2 0 002 2z" />
                          </svg>
                        }
                      />
                    </div>
                  </div>

                  <div className="border-t border-gray-200 pt-4">
                    <h3 className="mb-4 text-sm font-medium text-gray-800">Contact Information</h3>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <label htmlFor="second-supervisor-name" className="mb-2 block text-sm font-medium text-gray-800">
                          Supervisor Name
                        </label>
                        <FormInput
                          id="second-supervisor-name"
                          value={secondSupervisorName}
                          onChange={(e) => setSecondSupervisorName(e.target.value)}
                          placeholder="Supervisor's full name"
                        />
                      </div>
                      <div>
                        <label htmlFor="second-supervisor-phone" className="mb-2 block text-sm font-medium text-gray-800">
                          Phone Number
                        </label>
                        <FormInput
                          id="second-supervisor-phone"
                          type="tel"
                          value={secondSupervisorPhone}
                          onChange={(e) => setSecondSupervisorPhone(e.target.value)}
                          placeholder="(555) 123-4567"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-center">
                <button
                  type="button"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white px-5 py-3 text-base font-medium text-gray-700 hover:bg-gray-50"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add Another Job
                </button>
              </div>
            </div>
          )}

          <div className="mt-10 flex items-center justify-between gap-4">
            {isStepOne ? (
              <>
                <Link
                  to="/applications/apply"
                  className="inline-flex min-w-[120px] items-center justify-center gap-2 rounded-xl border border-gray-300 px-5 py-3 text-base font-medium text-gray-700 hover:bg-gray-50"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Back
                </Link>
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="inline-flex min-w-[122px] items-center justify-center gap-2 rounded-xl bg-gray-900 px-5 py-3 text-base font-medium text-white hover:bg-gray-800"
                >
                  Continue
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </>
            ) : isStepTwo ? (
              <>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="inline-flex min-w-[92px] items-center justify-center rounded-xl border border-gray-300 px-5 py-3 text-base font-medium text-gray-700 hover:bg-gray-50"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="inline-flex min-w-[122px] items-center justify-center gap-2 rounded-xl bg-gray-900 px-5 py-3 text-base font-medium text-white hover:bg-gray-800"
                >
                  Continue
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="inline-flex min-w-[112px] items-center justify-center gap-2 rounded-xl border border-gray-300 px-5 py-3 text-base font-medium text-gray-700 hover:bg-gray-50"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Previous
                </button>
                <button
                  type="button"
                  className="inline-flex min-w-[122px] items-center justify-center gap-2 rounded-xl bg-gray-900 px-5 py-3 text-base font-medium text-white hover:bg-gray-800"
                >
                  Continue
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </>
            )}
          </div>

          {isStepOne ? (
            <div className="mt-6 rounded-xl bg-gray-50 px-4 py-4">
              <div className="flex items-start gap-3">
                <svg className="mt-0.5 h-4 w-4 shrink-0 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="text-sm font-medium text-gray-800">Need Help?</p>
                  <p className="mt-1 text-xs text-gray-600">
                    All information is securely encrypted and will only be used for your rental application and background verification.
                  </p>
                </div>
              </div>
            </div>
          ) : null}
        </div>

      </div>
    </div>
  )
}
