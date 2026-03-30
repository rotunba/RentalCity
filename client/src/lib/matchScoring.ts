import type { TenantDimensionScores } from './tenantScoring'
import type { LandlordPreferences } from './landlordPreferences'

/** Set to false to revert: strict alignment only, no floor for flexible landlord + safe tenant */
const BOOST_SAFE_TENANT_FOR_FLEXIBLE_LANDLORD = true

export type TenantHistoryFlags = {
  evictionRecencyMonths: number | null // null means never
  bankruptcyRecencyMonths: number | null // null means never
  lateFeesLastTwoYears: number | null // approximate count
}

export type MatchDimensions = {
  affordability: number // 0–10
  stability: number // 0–10
  risk: number // 0–10
  lifestyle: number // 0–10
  policy: number // 0–10
}

export type MatchScoreResult = {
  eligible: boolean
  reasons: string[]
  dimensions: MatchDimensions
  overall: number // 0–100
}

export function computeMatchScore(
  tenant: TenantDimensionScores,
  landlord: LandlordPreferences,
  tenantHistory: TenantHistoryFlags,
): MatchScoreResult {
  const reasons: string[] = []
  let eligible = true

  // Hard eligibility checks based on landlord policy and tenant history
  if (landlord.maxEvictionRecencyMonths === null && tenantHistory.evictionRecencyMonths !== null) {
    eligible = false
    reasons.push('Landlord does not accept prior evictions.')
  } else if (
    landlord.maxEvictionRecencyMonths != null &&
    tenantHistory.evictionRecencyMonths != null &&
    tenantHistory.evictionRecencyMonths <= landlord.maxEvictionRecencyMonths
  ) {
    // allowed
  } else if (
    landlord.maxEvictionRecencyMonths != null &&
    tenantHistory.evictionRecencyMonths != null &&
    tenantHistory.evictionRecencyMonths > landlord.maxEvictionRecencyMonths
  ) {
    // eviction is older than landlord window – treat as acceptable
  }

  if (landlord.maxBankruptcyRecencyMonths === null && tenantHistory.bankruptcyRecencyMonths !== null) {
    eligible = false
    reasons.push('Landlord does not accept prior bankruptcy.')
  }

  if (
    landlord.maxLateFeesLastTwoYears != null &&
    landlord.maxLateFeesLastTwoYears !== Number.POSITIVE_INFINITY &&
    tenantHistory.lateFeesLastTwoYears != null &&
    tenantHistory.lateFeesLastTwoYears > landlord.maxLateFeesLastTwoYears
  ) {
    eligible = false
    reasons.push('Too many late payments for this landlord’s policy.')
  }

  if (!eligible) {
    return {
      eligible: false,
      reasons,
      dimensions: { affordability: 0, stability: 0, risk: 0, lifestyle: 0, policy: 0 },
      overall: 0,
    }
  }

  // Dimension compatibility scores (0–10)
  const affordability = tenant.affordability
  const stability = tenant.stability

  // Risk: align tenant risk level (10 - paymentRisk) with landlord tolerance (high tol = accepts riskier tenants)
  const tenantRiskLevel = 10 - tenant.paymentRisk
  let risk = Math.max(0, 10 - Math.abs(tenantRiskLevel - landlord.riskToleranceScore))

  // Lifestyle compatibility compares tenant lifestyle with landlord conflict style
  const lifestyleGap = Math.abs(tenant.lifestyle - landlord.conflictStyleScore)
  const lifestyle = Math.max(0, 10 - lifestyleGap)

  // Policy: tenant safety (paymentRisk) should match landlord strictness (high strict = wants safe tenant)
  let policy = Math.max(0, 10 - Math.abs(tenant.paymentRisk - landlord.policyStrictnessScore))

  // Optional: floor for flexible landlord + safe tenant (don't over-penalize; set BOOST_* = false to revert)
  if (BOOST_SAFE_TENANT_FOR_FLEXIBLE_LANDLORD && landlord.riskToleranceScore >= 7 && tenant.paymentRisk >= 8) {
    risk = Math.max(risk, 5)
    policy = Math.max(policy, 5)
  }

  const dimensions: MatchDimensions = {
    affordability,
    stability,
    risk,
    lifestyle,
    policy,
  }

  // Overall match score (0–100) with suggested weights
  const overall0to1 =
    0.35 * (affordability / 10) +
    0.25 * (stability / 10) +
    0.2 * (risk / 10) +
    0.1 * (lifestyle / 10) +
    0.1 * (policy / 10)

  const overall = Math.round(overall0to1 * 100)

  return {
    eligible: true,
    reasons,
    dimensions,
    overall,
  }
}

