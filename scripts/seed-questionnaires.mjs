#!/usr/bin/env node
/**
 * Seed landlord and tenant questionnaire answers to test match scoring.
 * Run after scripts/seed.mjs (creates users). Uses same env vars.
 *
 * Landlord sets: strict, moderate, flexible (policy strictness, risk tolerance)
 * Tenant sets: high_score, medium_score, low_score (overall 0-100)
 *
 * Run: node scripts/seed-questionnaires.mjs
 */

import { config } from 'dotenv'
config({ path: '.env.development.local' })
config({ path: '.env.local' })
config()
import { createClient } from '@supabase/supabase-js'

const url = process.env.VITE_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !serviceKey) {
  console.error('Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(url, serviceKey, { auth: { persistSession: false } })

// Landlord answer sets (question id -> choice id or array of ids for multi)
// Order: management_style, ownership_duration, criminal_record_policy, thirty_percent_rule,
// eviction_policy, require_rental_insurance, maintenance_frequency, average_tenant_stay,
// bankruptcy_policy, employment_history_requirement, late_payment_policy, conflict_handling_style
const LANDLORD_ANSWER_SETS = {
  strict: {
    management_style: 'a',
    ownership_duration: 'd',
    criminal_record_policy: [],
    thirty_percent_rule: 'a',
    eviction_policy: [],
    require_rental_insurance: 'a',
    maintenance_frequency: 'b',
    average_tenant_stay: 'd',
    bankruptcy_policy: [],
    employment_history_requirement: 'd',
    late_payment_policy: ['a'],
    conflict_handling_style: 'c',
  },
  moderate: {
    management_style: 'a',
    ownership_duration: 'c',
    criminal_record_policy: ['a', 'b'],
    thirty_percent_rule: 'a',
    eviction_policy: ['b', 'c'],
    require_rental_insurance: 'a',
    maintenance_frequency: 'a',
    average_tenant_stay: 'c',
    bankruptcy_policy: ['c', 'd'],
    employment_history_requirement: 'b',
    late_payment_policy: ['b'],
    conflict_handling_style: 'a',
  },
  flexible: {
    management_style: 'b',
    ownership_duration: 'a',
    criminal_record_policy: ['a', 'b', 'c', 'd'],
    thirty_percent_rule: 'b',
    eviction_policy: ['e'],
    require_rental_insurance: 'b',
    maintenance_frequency: 'd',
    average_tenant_stay: 'a',
    bankruptcy_policy: ['e'],
    employment_history_requirement: 'a',
    late_payment_policy: ['e'],
    conflict_handling_style: 'a',
  },
}

// Precomputed landlord scores from deriveLandlordPreferences logic
const LANDLORD_SCORES = {
  strict: { policy_strictness: 9, risk_tolerance: 1, conflict_style: 9 },
  moderate: { policy_strictness: 5, risk_tolerance: 5, conflict_style: 10 },
  flexible: { policy_strictness: 1, risk_tolerance: 9, conflict_style: 10 },
}

// Tenant answer sets + rent/income for affordability. Dimension scores precomputed.
const TENANT_ANSWER_SETS = {
  high_score: {
    answers: {
      previous_landlord_duration: 'd',
      employment_duration: 'd',
      late_fees_last_two_years: 'e',
      twenty_four_hour_notice: 'a',
      household_size: 'a',
      bedrooms_needed: 'b',
      rental_budget: 'd',
      emergency_funds: 'a',
      eviction_history: 'e',
      late_frequency_reported: 'd',
      rental_insurance_acceptance: 'a',
      bankruptcy_history: 'e',
      conflict_reaction: 'a',
    },
    rent: 1850,
    monthly_income: 7000,
    stability_score: 10,
    payment_risk_score: 10,
    affordability_score: 10,
    lifestyle_score: 10,
    space_fit_score: 10,
    overall_score: 92,
  },
  medium_score: {
    answers: {
      previous_landlord_duration: 'b',
      employment_duration: 'b',
      late_fees_last_two_years: 'a',
      twenty_four_hour_notice: 'a',
      household_size: 'a',
      bedrooms_needed: 'a',
      rental_budget: 'c',
      emergency_funds: 'b',
      eviction_history: 'e',
      late_frequency_reported: 'a',
      rental_insurance_acceptance: 'a',
      bankruptcy_history: 'e',
      conflict_reaction: 'b',
    },
    rent: 1575,
    monthly_income: 5500,
    stability_score: 4,
    payment_risk_score: 7.4,
    affordability_score: 7,
    lifestyle_score: 9.3,
    space_fit_score: 10,
    overall_score: 68,
  },
  low_score: {
    answers: {
      previous_landlord_duration: 'a',
      employment_duration: 'a',
      late_fees_last_two_years: 'd',
      twenty_four_hour_notice: 'b',
      household_size: 'd',
      bedrooms_needed: 'b',
      rental_budget: 'e',
      emergency_funds: 'c',
      eviction_history: 'a',
      late_frequency_reported: 'c',
      rental_insurance_acceptance: 'b',
      bankruptcy_history: 'a',
      conflict_reaction: 'd',
    },
    rent: 2250,
    monthly_income: 4200,
    stability_score: 1,
    payment_risk_score: 2.8,
    affordability_score: 0,
    lifestyle_score: 5.7,
    space_fit_score: 6,
    overall_score: 28,
  },
}

async function main() {
  console.log('Seeding questionnaire answer sets for match testing...')

  const TEST_PASSWORD = 'TestPassword123!'
  const { data: users } = await supabase.auth.admin.listUsers({ perPage: 100 })
  let landlord = users?.users?.find((u) => u.email === 'landlord@test.rentalcity.com')
  let landlord2 = users?.users?.find((u) => u.email === 'landlord2@test.rentalcity.com')
  const tenant = users?.users?.find((u) => u.email === 'tenant@test.rentalcity.com')
  const declinedTenant = users?.users?.find((u) => u.email === 'declined@test.rentalcity.com')
  const lockedTenant = users?.users?.find((u) => u.email === 'locked@test.rentalcity.com')
  const unlockedTenant = users?.users?.find((u) => u.email === 'unlocked@test.rentalcity.com')

  if (!landlord || !tenant) {
    console.error('Run scripts/seed.mjs first to create landlord and tenant users.')
    process.exit(1)
  }

  if (!landlord2) {
    const { data: ld2, error: e2 } = await supabase.auth.admin.createUser({
      email: 'landlord2@test.rentalcity.com',
      password: TEST_PASSWORD,
      email_confirm: true,
    })
    if (e2) {
      console.warn('Could not create landlord2:', e2.message)
    } else {
      landlord2 = ld2.user
      await supabase.from('profiles').upsert({ id: landlord2.id, role: 'landlord', display_name: 'Flexible Landlord' }, { onConflict: 'id' })
      console.log('Created landlord2@test.rentalcity.com')
    }
  }

  // Landlord 1: strict profile
  await supabase.from('landlord_questionnaire').upsert(
    {
      user_id: landlord.id,
      answers: LANDLORD_ANSWER_SETS.strict,
      policy_strictness_score: LANDLORD_SCORES.strict.policy_strictness,
      risk_tolerance_score: LANDLORD_SCORES.strict.risk_tolerance,
      conflict_style_score: LANDLORD_SCORES.strict.conflict_style,
    },
    { onConflict: 'user_id' }
  )
  console.log('Landlord (strict): policy_strictness=9, risk_tolerance=1')

  // Landlord 2: flexible profile
  if (landlord2) {
    await supabase.from('landlord_questionnaire').upsert(
      {
        user_id: landlord2.id,
        answers: LANDLORD_ANSWER_SETS.flexible,
        policy_strictness_score: LANDLORD_SCORES.flexible.policy_strictness,
        risk_tolerance_score: LANDLORD_SCORES.flexible.risk_tolerance,
        conflict_style_score: LANDLORD_SCORES.flexible.conflict_style,
      },
      { onConflict: 'user_id' }
    )
    await supabase.from('profiles').update({ landlord_survey_completed_at: new Date().toISOString() }).eq('id', landlord2.id)
    console.log('Landlord2 (flexible): policy_strictness=1, risk_tolerance=9')
  }

  // Tenants: different score tiers
  const tenantMappings = [
    { user: tenant, set: 'high_score', label: 'tenant@test (high)' },
    { user: declinedTenant, set: 'medium_score', label: 'declined@test (medium)' },
    { user: lockedTenant, set: 'low_score', label: 'locked@test (low)' },
    { user: unlockedTenant, set: 'high_score', label: 'unlocked@test (high)' },
  ]

  for (const { user, set, label } of tenantMappings) {
    if (!user) continue
    const data = TENANT_ANSWER_SETS[set]
    await supabase.from('tenant_questionnaire').upsert(
      {
        user_id: user.id,
        answers: data.answers,
        stability_score: data.stability_score,
        payment_risk_score: data.payment_risk_score,
        affordability_score: data.affordability_score,
        lifestyle_score: data.lifestyle_score,
        space_fit_score: data.space_fit_score,
        overall_score: data.overall_score,
      },
      { onConflict: 'user_id' }
    )
    console.log(`${label}: overall_score=${data.overall_score}`)
  }

  await supabase.from('profiles').update({ landlord_survey_completed_at: new Date().toISOString() }).eq('id', landlord.id)
  for (const { user } of tenantMappings) {
    if (user) {
      await supabase.from('profiles').update({ tenant_survey_completed_at: new Date().toISOString() }).eq('id', user.id)
    }
  }

  console.log('Questionnaire seed complete. Use different tenant logins to see high/medium/low scores vs landlord.')
  console.log('To seed alternative landlord profiles, edit LANDLORD_ANSWER_SETS and re-run with different landlord user.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
