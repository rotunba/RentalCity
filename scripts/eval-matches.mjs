#!/usr/bin/env node
/**
 * Evaluate match scoring across seeded landlord/tenant questionnaire data.
 * Prints results for optimization (no UI). Run after db:seed and db:seed-questionnaires.
 *
 * Usage: node scripts/eval-matches.mjs
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

/** Set to false to revert: strict alignment only */
const BOOST_SAFE_TENANT_FOR_FLEXIBLE_LANDLORD = true

function hasChoice(answer, id) {
  if (!answer) return false
  if (Array.isArray(answer)) return answer.includes(id)
  return answer === id
}

function landlordAnswersToPrefs(answers) {
  let maxEviction = null
  const ev = answers?.eviction_policy
  if (hasChoice(ev, 'e') || hasChoice(ev, 'd')) maxEviction = 48
  else if (hasChoice(ev, 'c')) maxEviction = 36
  else if (hasChoice(ev, 'b')) maxEviction = 24
  else if (hasChoice(ev, 'a')) maxEviction = 12

  let maxBankruptcy = null
  const bk = answers?.bankruptcy_policy
  if (hasChoice(bk, 'e') || hasChoice(bk, 'd')) maxBankruptcy = 48
  else if (hasChoice(bk, 'c')) maxBankruptcy = 36
  else if (hasChoice(bk, 'b')) maxBankruptcy = 24
  else if (hasChoice(bk, 'a')) maxBankruptcy = 12

  let maxLateFees = 0
  const lt = answers?.late_payment_policy
  if (hasChoice(lt, 'e')) maxLateFees = Infinity
  else if (hasChoice(lt, 'd')) maxLateFees = 4
  else if (hasChoice(lt, 'c')) maxLateFees = 3
  else if (hasChoice(lt, 'b')) maxLateFees = 2
  else if (hasChoice(lt, 'a')) maxLateFees = 1

  let conflictStyle = 5
  switch (answers?.conflict_handling_style) {
    case 'a': conflictStyle = 10; break
    case 'c': conflictStyle = 9; break
    case 'b': conflictStyle = 6; break
    case 'd': conflictStyle = 2; break
  }

  return {
    maxEvictionRecencyMonths: maxEviction,
    maxBankruptcyRecencyMonths: maxBankruptcy,
    maxLateFeesLastTwoYears: maxLateFees,
    conflictStyleScore: conflictStyle,
    policyStrictnessScore: answers?.policy_strictness_score ?? 5,
    riskToleranceScore: answers?.risk_tolerance_score ?? 5,
  }
}

function tenantAnswersToHistory(answers) {
  const ev = answers?.eviction_history
  let evictionMonths = null
  if (ev && ev !== 'e') {
    if (ev === 'a') evictionMonths = 12
    else if (ev === 'b') evictionMonths = 24
    else if (ev === 'c') evictionMonths = 36
    else if (ev === 'd') evictionMonths = 48
  }

  const bk = answers?.bankruptcy_history
  let bankruptcyMonths = null
  if (bk && bk !== 'e') {
    if (bk === 'a') bankruptcyMonths = 12
    else if (bk === 'b') bankruptcyMonths = 24
    else if (bk === 'c') bankruptcyMonths = 36
    else if (bk === 'd') bankruptcyMonths = 48
  }

  const lt = answers?.late_fees_last_two_years
  let lateFees = null
  if (lt === 'e') lateFees = 0
  else if (lt === 'a') lateFees = 1
  else if (lt === 'b') lateFees = 2
  else if (lt === 'c') lateFees = 3
  else if (lt === 'd') lateFees = 4

  return { evictionRecencyMonths: evictionMonths, bankruptcyRecencyMonths: bankruptcyMonths, lateFeesLastTwoYears: lateFees }
}

function computeMatch(tenantDims, landlordPrefs, tenantHistory) {
  const reasons = []
  let eligible = true

  if (landlordPrefs.maxEvictionRecencyMonths === null && tenantHistory.evictionRecencyMonths !== null) {
    eligible = false
    reasons.push('Landlord does not accept prior evictions.')
  } else if (
    landlordPrefs.maxEvictionRecencyMonths != null &&
    tenantHistory.evictionRecencyMonths != null &&
    tenantHistory.evictionRecencyMonths > landlordPrefs.maxEvictionRecencyMonths
  ) {
    eligible = false
    reasons.push('Eviction outside landlord window.')
  }

  if (landlordPrefs.maxBankruptcyRecencyMonths === null && tenantHistory.bankruptcyRecencyMonths !== null) {
    eligible = false
    reasons.push('Landlord does not accept prior bankruptcy.')
  } else if (
    landlordPrefs.maxBankruptcyRecencyMonths != null &&
    tenantHistory.bankruptcyRecencyMonths != null &&
    tenantHistory.bankruptcyRecencyMonths > landlordPrefs.maxBankruptcyRecencyMonths
  ) {
    eligible = false
    reasons.push('Bankruptcy outside landlord window.')
  }

  if (
    landlordPrefs.maxLateFeesLastTwoYears != null &&
    landlordPrefs.maxLateFeesLastTwoYears !== Infinity &&
    tenantHistory.lateFeesLastTwoYears != null &&
    tenantHistory.lateFeesLastTwoYears > landlordPrefs.maxLateFeesLastTwoYears
  ) {
    eligible = false
    reasons.push('Too many late payments for landlord policy.')
  }

  if (!eligible) {
    return { eligible: false, reasons, overall: null, dimensions: null, weights: null, contributions: null }
  }

  const tenantRiskLevel = 10 - tenantDims.paymentRisk
  let risk = Math.max(0, 10 - Math.abs(tenantRiskLevel - landlordPrefs.riskToleranceScore))
  const lifestyleGap = Math.abs(tenantDims.lifestyle - landlordPrefs.conflictStyleScore)
  const lifestyle = Math.max(0, 10 - lifestyleGap)
  let policy = Math.max(0, 10 - Math.abs(tenantDims.paymentRisk - landlordPrefs.policyStrictnessScore))

  if (BOOST_SAFE_TENANT_FOR_FLEXIBLE_LANDLORD && landlordPrefs.riskToleranceScore >= 7 && tenantDims.paymentRisk >= 8) {
    risk = Math.max(risk, 5)
    policy = Math.max(policy, 5)
  }

  const weights = { affordability: 0.35, stability: 0.25, risk: 0.2, lifestyle: 0.1, policy: 0.1 }
  const contrib = {
    affordability: (tenantDims.affordability / 10) * weights.affordability,
    stability: (tenantDims.stability / 10) * weights.stability,
    risk: (risk / 10) * weights.risk,
    lifestyle: (lifestyle / 10) * weights.lifestyle,
    policy: (policy / 10) * weights.policy,
  }
  const overall = Math.round((contrib.affordability + contrib.stability + contrib.risk + contrib.lifestyle + contrib.policy) * 100)

  return {
    eligible,
    reasons,
    overall,
    dimensions: { affordability: tenantDims.affordability, stability: tenantDims.stability, risk, lifestyle, policy },
    weights,
    contributions: contrib,
  }
}

async function main() {
  const { data: landlords } = await supabase
    .from('landlord_questionnaire')
    .select('user_id, answers, policy_strictness_score, risk_tolerance_score, conflict_style_score')

  const { data: tenants } = await supabase
    .from('tenant_questionnaire')
    .select('user_id, answers, stability_score, payment_risk_score, affordability_score, lifestyle_score, space_fit_score, overall_score')

  if (!landlords?.length || !tenants?.length) {
    console.log('Run npm run db:seed-questionnaires first to seed questionnaire data.')
    process.exit(1)
  }

  const { data: profiles } = await supabase.from('profiles').select('id, display_name').in('id', [...landlords.map((l) => l.user_id), ...tenants.map((t) => t.user_id)])
  const names = Object.fromEntries((profiles || []).map((p) => [p.id, p.display_name || p.id.slice(0, 8)]))

  const allResults = []

  console.log('\n========== Match evaluation (detailed breakdown) ==========\n')

  for (const l of landlords) {
    const prefs = landlordAnswersToPrefs({
      ...l.answers,
      policy_strictness_score: l.policy_strictness_score,
      risk_tolerance_score: l.risk_tolerance_score,
    })
    const lName = names[l.user_id] || l.user_id.slice(0, 8)
    console.log(`\n--- Landlord: ${lName} (policy_strict=${prefs.policyStrictnessScore}, risk_tol=${prefs.riskToleranceScore}, conflict=${prefs.conflictStyleScore}) ---`)
    console.log(`    Eviction: ${prefs.maxEvictionRecencyMonths != null ? prefs.maxEvictionRecencyMonths + 'mo' : 'none'} | Bankruptcy: ${prefs.maxBankruptcyRecencyMonths != null ? prefs.maxBankruptcyRecencyMonths + 'mo' : 'none'} | Late fees max: ${prefs.maxLateFeesLastTwoYears === Infinity ? 'any' : prefs.maxLateFeesLastTwoYears}\n`)

    for (const t of tenants) {
      const history = tenantAnswersToHistory(t.answers)
      const dims = {
        stability: Number(t.stability_score) || 0,
        paymentRisk: Number(t.payment_risk_score) || 0,
        affordability: Number(t.affordability_score) || 0,
        lifestyle: Number(t.lifestyle_score) || 0,
      }
      const result = computeMatch(dims, prefs, history)
      const tName = names[t.user_id] || t.user_id.slice(0, 8)
      const tenantOverall = Number(t.overall_score) || 0

      allResults.push({ lName, tName, tenantOverall, ...result })

      console.log(`  × ${tName} (tenant_score=${tenantOverall})`)
      if (!result.eligible) {
        console.log(`      ineligible — ${result.reasons.join('; ')}`)
        console.log(`      tenant history:   eviction=${history.evictionRecencyMonths != null ? history.evictionRecencyMonths + 'mo' : 'none'}  bankruptcy=${history.bankruptcyRecencyMonths != null ? history.bankruptcyRecencyMonths + 'mo' : 'none'}  late_fees=${history.lateFeesLastTwoYears ?? '?'}`)
      } else {
        console.log(`      match overall: ${result.overall}`)
        console.log(`      dimensions (raw):  aff=${result.dimensions.affordability.toFixed(1)}  st=${result.dimensions.stability.toFixed(1)}  risk=${result.dimensions.risk.toFixed(1)}  life=${result.dimensions.lifestyle.toFixed(1)}  policy=${result.dimensions.policy.toFixed(1)}`)
        console.log(`      weights:           35%    25%    20%    10%    10%`)
        console.log(`      contribution:     ${(result.contributions.affordability * 100).toFixed(0)}%   ${(result.contributions.stability * 100).toFixed(0)}%   ${(result.contributions.risk * 100).toFixed(0)}%   ${(result.contributions.lifestyle * 100).toFixed(0)}%   ${(result.contributions.policy * 100).toFixed(0)}%  → sum=${(result.contributions.affordability + result.contributions.stability + result.contributions.risk + result.contributions.lifestyle + result.contributions.policy).toFixed(2)}`)
        console.log(`      tenant history:   eviction=${history.evictionRecencyMonths != null ? history.evictionRecencyMonths + 'mo' : 'none'}  bankruptcy=${history.bankruptcyRecencyMonths != null ? history.bankruptcyRecencyMonths + 'mo' : 'none'}  late_fees=${history.lateFeesLastTwoYears ?? '?'}`)
      }
      console.log('')
    }
  }

  console.log('\n========== Summary (eligible pairs by match overall desc) ==========\n')
  const eligibleResults = allResults.filter((r) => r.eligible)
  const ineligibleResults = allResults.filter((r) => !r.eligible)
  eligibleResults.sort((a, b) => b.overall - a.overall)
  for (const r of eligibleResults) {
    console.log(`  ✓  ${r.lName} × ${r.tName}:  match=${r.overall}  (tenant_score=${r.tenantOverall})`)
  }
  if (ineligibleResults.length) {
    console.log('\n  Ineligible (no score):')
    for (const r of ineligibleResults) {
      console.log(`  ✗  ${r.lName} × ${r.tName}:  ${r.reasons.join('; ')}`)
    }
  }
  console.log('\nDone. Tune weights in client/src/lib/matchScoring.ts (affordability 35%, stability 25%, risk 20%, lifestyle 10%, policy 10%).')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
