#!/usr/bin/env node
/**
 * Run Supabase migrations via direct Postgres connection.
 * Requires: SUPABASE_DB_URL or DATABASE_URL
 * Get from: Supabase Dashboard > Project Settings > Database > Connection string (URI)
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
  console.error('Get it from: Supabase Dashboard > Project Settings > Database > Connection string (URI)')
  process.exit(1)
}

const migration1 = readFileSync(
  join(__dirname, '../supabase/migrations/20250225000001_initial_schema.sql'),
  'utf-8'
)
const migration2 = readFileSync(
  join(__dirname, '../supabase/migrations/20250225000002_rls_policies.sql'),
  'utf-8'
)
const migration3 = readFileSync(
  join(__dirname, '../supabase/migrations/20250302000001_tenant_preferences_extend.sql'),
  'utf-8'
)
const migration4 = readFileSync(
  join(__dirname, '../supabase/migrations/20250307000001_support_requests_and_tenant_ratings.sql'),
  'utf-8'
)
const migration5 = readFileSync(
  join(__dirname, '../supabase/migrations/20250307000002_property_metadata.sql'),
  'utf-8'
)
const migration6 = readFileSync(
  join(__dirname, '../supabase/migrations/20250307000003_message_thread_touch.sql'),
  'utf-8'
)
const migration7 = readFileSync(
  join(__dirname, '../supabase/migrations/20250307000004_related_profile_reads.sql'),
  'utf-8'
)
const migration8 = readFileSync(
  join(__dirname, '../supabase/migrations/20250310000001_application_unlocked_at.sql'),
  'utf-8'
)
const migration8b = readFileSync(
  join(__dirname, '../supabase/migrations/20250310000002_landlord_survey_completed.sql'),
  'utf-8'
)
const migration9 = readFileSync(
  join(__dirname, '../supabase/migrations/20250310000003_property_images_bucket.sql'),
  'utf-8'
)
const migration10 = readFileSync(
  join(__dirname, '../supabase/migrations/20250310000004_property_photo_urls.sql'),
  'utf-8'
)
const migration11 = readFileSync(
  join(__dirname, '../supabase/migrations/20250312000001_tenant_survey_completed.sql'),
  'utf-8'
)

const client = new pg.Client({ connectionString: dbUrl })

async function run() {
  try {
    await client.connect()
    console.log('Running initial schema...')
    await client.query(migration1)
    console.log('Initial schema OK')
    console.log('Running RLS policies...')
    await client.query(migration2)
    console.log('RLS policies OK')
    console.log('Running tenant_preferences extend...')
    await client.query(migration3)
    console.log('Tenant preferences extend OK')
    console.log('Running support requests and tenant ratings updates...')
    await client.query(migration4)
    console.log('Support requests and tenant ratings updates OK')
    console.log('Running property metadata updates...')
    await client.query(migration5)
    console.log('Property metadata updates OK')
    console.log('Running message thread touch updates...')
    await client.query(migration6)
    console.log('Message thread touch updates OK')
    console.log('Running related profile read updates...')
    await client.query(migration7)
    console.log('Related profile read updates OK')
    console.log('Running application unlocked_at...')
    await client.query(migration8)
    console.log('Application unlocked_at OK')
    console.log('Running landlord survey completed...')
    await client.query(migration8b)
    console.log('Landlord survey completed OK')
    console.log('Running property images bucket...')
    await client.query(migration9)
    console.log('Property images bucket OK')
    console.log('Running property photo_urls...')
    await client.query(migration10)
    console.log('Property photo_urls OK')
    console.log('Running tenant survey completed...')
    await client.query(migration11)
    console.log('Tenant survey completed OK')
    console.log('Migrations complete.')
  } catch (err) {
    console.error('Migration failed:', err.message)
    process.exit(1)
  } finally {
    await client.end()
  }
}

run()
