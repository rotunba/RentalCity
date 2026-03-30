#!/usr/bin/env node
/**
 * Apply one .sql file to an existing database (avoids full db:migrate replay).
 *
 * Requires: SUPABASE_DB_URL or DATABASE_URL (Session mode URI from Supabase Dashboard)
 *
 *   npm run db:apply-sql
 *   npm run db:apply-sql -- supabase/migrations/other.sql
 */
import { config } from 'dotenv'
config({ path: '.env.development.local' })
config({ path: '.env.local' })
config()

import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join, resolve } from 'path'
import pg from 'pg'

const __dirname = dirname(fileURLToPath(import.meta.url))
const repoRoot = join(__dirname, '..')

const dbUrl = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL
if (!dbUrl) {
  console.error('Missing SUPABASE_DB_URL or DATABASE_URL')
  console.error('Supabase → Project Settings → Database → Connection string (URI)')
  process.exit(1)
}

const defaultFile = join(
  repoRoot,
  'supabase/migrations/20260331150000_tenant_ratings_and_profiles_read_for_reviews.sql',
)
const arg = process.argv[2]
const sqlPath = resolve(repoRoot, arg ?? defaultFile)

let sql
try {
  sql = readFileSync(sqlPath, 'utf-8')
} catch (e) {
  console.error('Could not read:', sqlPath)
  console.error(e.message)
  process.exit(1)
}

const client = new pg.Client({ connectionString: dbUrl })
try {
  await client.connect()
  console.log('Applying:', sqlPath)
  await client.query(sql)
  console.log('OK')
} catch (err) {
  console.error('Failed:', err.message)
  process.exit(1)
} finally {
  await client.end()
}
