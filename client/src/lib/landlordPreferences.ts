import { landlordQuestions, type LandlordChoiceId, type LandlordQuestionId } from './landlordQuestionnaire'

export type LandlordAnswers = Record<LandlordQuestionId, LandlordChoiceId | LandlordChoiceId[] | null | undefined>

export type LandlordPreferences = {
  usesThirtyPercentRule: boolean
  requiresRentalInsurance: boolean
  minEmploymentYears: number | null
  maxEvictionRecencyMonths: number | null // null means no evictions allowed at all
  maxBankruptcyRecencyMonths: number | null // null means no bankruptcies allowed
  maxLateFeesLastTwoYears: number | null // null means no late fees allowed
  conflictStyleScore: number // 0–10, higher is calmer / more collaborative
  policyStrictnessScore: number // 0–10 (higher = stricter)
  riskToleranceScore: number // 0–10 (higher = more tolerant of tenant history)
}

function hasChoice(answer: LandlordChoiceId | LandlordChoiceId[] | null | undefined, id: LandlordChoiceId): boolean {
  if (!answer) return false
  if (Array.isArray(answer)) return answer.includes(id)
  return answer === id
}

export function deriveLandlordPreferences(answers: LandlordAnswers): LandlordPreferences {
  const thirtyPercent = answers['thirty_percent_rule'] === 'a'
  const requiresInsurance = answers['require_rental_insurance'] === 'a'

  let minEmploymentYears: number | null = null
  switch (answers['employment_history_requirement']) {
    case 'a':
      minEmploymentYears = 1
      break
    case 'b':
      minEmploymentYears = 2
      break
    case 'c':
      minEmploymentYears = 3
      break
    case 'd':
      minEmploymentYears = 4
      break
    default:
      minEmploymentYears = null
  }

  // Eviction policy – most restrictive accepted case
  let maxEvictionMonths: number | null = null
  const evictionAns = answers['eviction_policy']
  if (hasChoice(evictionAns, 'e')) {
    maxEvictionMonths = 48
  } else if (hasChoice(evictionAns, 'a')) {
    maxEvictionMonths = 12
  } else if (hasChoice(evictionAns, 'b')) {
    maxEvictionMonths = 24
  } else if (hasChoice(evictionAns, 'c')) {
    maxEvictionMonths = 36
  } else if (hasChoice(evictionAns, 'd')) {
    maxEvictionMonths = 48
  } else {
    // Did not select any – interpret as "no evictions allowed"
    maxEvictionMonths = null
  }

  // Bankruptcy policy – most restrictive accepted case
  let maxBankruptcyMonths: number | null = null
  const bankruptcyAns = answers['bankruptcy_policy']
  if (hasChoice(bankruptcyAns, 'e')) {
    maxBankruptcyMonths = 48
  } else if (hasChoice(bankruptcyAns, 'a')) {
    maxBankruptcyMonths = 12
  } else if (hasChoice(bankruptcyAns, 'b')) {
    maxBankruptcyMonths = 24
  } else if (hasChoice(bankruptcyAns, 'c')) {
    maxBankruptcyMonths = 36
  } else if (hasChoice(bankruptcyAns, 'd')) {
    maxBankruptcyMonths = 48
  } else {
    maxBankruptcyMonths = null
  }

  // Late fee policy
  let maxLateFees: number | null = null
  const lateAns = answers['late_payment_policy']
  if (hasChoice(lateAns, 'e')) {
    maxLateFees = Number.POSITIVE_INFINITY
  } else if (hasChoice(lateAns, 'a')) {
    maxLateFees = 1
  } else if (hasChoice(lateAns, 'b')) {
    maxLateFees = 2
  } else if (hasChoice(lateAns, 'c')) {
    maxLateFees = 3
  } else if (hasChoice(lateAns, 'd')) {
    maxLateFees = 4
  } else {
    maxLateFees = 0
  }

  // Conflict style score (0–10)
  let conflictStyleScore = 5
  switch (answers['conflict_handling_style']) {
    case 'a': // understand
      conflictStyleScore = 10
      break
    case 'c': // calm them down
      conflictStyleScore = 9
      break
    case 'b': // hang up, deal later
      conflictStyleScore = 6
      break
    case 'd': // yell back
      conflictStyleScore = 2
      break
    default:
      conflictStyleScore = 5
  }

  // Policy strictness: more requirements and shorter recency windows => higher strictness
  let strictness = 0
  if (thirtyPercent) strictness += 3
  if (requiresInsurance) strictness += 2
  if (minEmploymentYears && minEmploymentYears >= 2) strictness += 2
  if (maxEvictionMonths !== null && maxEvictionMonths <= 24) strictness += 2
  if (maxBankruptcyMonths !== null && maxBankruptcyMonths <= 24) strictness += 2
  if (maxLateFees !== null && maxLateFees <= 2) strictness += 1

  const policyStrictnessScore = Math.min(10, strictness)
  const riskToleranceScore = Math.max(0, 10 - policyStrictnessScore)

  // Reference landlordQuestions so the file is used and stays in sync
  void landlordQuestions

  return {
    usesThirtyPercentRule: thirtyPercent,
    requiresRentalInsurance: requiresInsurance,
    minEmploymentYears,
    maxEvictionRecencyMonths: maxEvictionMonths,
    maxBankruptcyRecencyMonths: maxBankruptcyMonths,
    maxLateFeesLastTwoYears: maxLateFees,
    conflictStyleScore,
    policyStrictnessScore,
    riskToleranceScore,
  }
}

