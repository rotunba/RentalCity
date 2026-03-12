#!/usr/bin/env node
/**
 * Apply onboarding-related migrations to an existing DB safely.
 * Requires: SUPABASE_DB_URL or DATABASE_URL
 */
import { config } from 'dotenv'
config({ path: '.env.development.local' })
config({ path: '.env.local' })
config()

import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import pg from 'pg'

const __dirname = dirname(fileURLToPath(import.meta.url))

const dbUrl = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL
if (!dbUrl) {
  console.error('Missing SUPABASE_DB_URL or DATABASE_URL')
  process.exit(1)
}

const landlordSurveyCompleted = readFileSync(
  join(__dirname, '../supabase/migrations/20250310000002_landlord_survey_completed.sql'),
  'utf-8',
)
const tenantSurveyCompleted = readFileSync(
  join(__dirname, '../supabase/migrations/20250312000001_tenant_survey_completed.sql'),
  'utf-8',
)

const client = new pg.Client({ connectionString: dbUrl })

async function run() {
  try {
    await client.connect()
    console.log('Running landlord survey completed migration...')
    await client.query(landlordSurveyCompleted)
    console.log('Landlord survey completed OK')

    console.log('Running tenant survey completed migration...')
    await client.query(tenantSurveyCompleted)
    console.log('Tenant survey completed OK')

    console.log('Onboarding migrations complete.')
  } catch (err) {
    console.error('Onboarding migration failed:', err.message)
    process.exit(1)
  } finally {
    await client.end()
  }
}

run()

