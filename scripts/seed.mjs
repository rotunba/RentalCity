#!/usr/bin/env node
/**
 * Seed script for dummy data (properties, applications, payments, notifications).
 * Requires: VITE_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 * Run: node scripts/seed.mjs
 */

import { config } from 'dotenv'
config({ path: '.env.development.local' })
config({ path: '.env.local' })
config()
import { createClient } from '@supabase/supabase-js'

const url = process.env.VITE_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !serviceKey) {
  console.error('Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Add them to .env.local')
  process.exit(1)
}

const supabase = createClient(url, serviceKey, { auth: { persistSession: false } })

const TEST_PASSWORD = 'TestPassword123!'

async function main() {
  console.log('Seeding dummy data...')

  // Create or get test users
  let landlordId, tenantId, declinedTenantId, lockedTenantId, unlockedTenantId

  const { data: existingUsers } = await supabase.auth.admin.listUsers({ perPage: 100 })
  const landlordUser = existingUsers?.users?.find((u) => u.email === 'landlord@test.rentalcity.com')
  const tenantUser = existingUsers?.users?.find((u) => u.email === 'tenant@test.rentalcity.com')
  const declinedTenantUser = existingUsers?.users?.find((u) => u.email === 'declined@test.rentalcity.com')
  const lockedTenantUser = existingUsers?.users?.find((u) => u.email === 'locked@test.rentalcity.com')
  const unlockedTenantUser = existingUsers?.users?.find((u) => u.email === 'unlocked@test.rentalcity.com')

  if (landlordUser) {
    landlordId = landlordUser.id
    console.log('Landlord user exists:', landlordUser.email)
  } else {
    const { data: ld, error: le } = await supabase.auth.admin.createUser({
      email: 'landlord@test.rentalcity.com',
      password: TEST_PASSWORD,
      email_confirm: true,
    })
    if (le) {
      console.error('Failed to create landlord:', le.message)
      console.error('')
      console.error('Create users manually in Supabase Dashboard > Authentication > Users > Add user')
      console.error('Then run: npm run db:seed')
      console.error('Use emails: landlord@test.rentalcity.com and tenant@test.rentalcity.com')
      process.exit(1)
    }
    landlordId = ld.user.id
    console.log('Created landlord:', ld.user.email)
  }

  if (tenantUser) {
    tenantId = tenantUser.id
    console.log('Tenant user exists:', tenantUser.email)
  } else {
    const { data: td, error: te } = await supabase.auth.admin.createUser({
      email: 'tenant@test.rentalcity.com',
      password: TEST_PASSWORD,
      email_confirm: true,
    })
    if (te) {
      console.error('Failed to create tenant:', te.message)
      console.error('')
      console.error('Create users manually in Supabase Dashboard > Authentication > Users > Add user')
      console.error('Then run: npm run db:seed')
      console.error('Use emails: landlord@test.rentalcity.com and tenant@test.rentalcity.com')
      process.exit(1)
    }
    tenantId = td.user.id
    console.log('Created tenant:', td.user.email)
  }

  if (declinedTenantUser) {
    declinedTenantId = declinedTenantUser.id
    console.log('Declined tenant user exists:', declinedTenantUser.email)
  } else {
    const { data: dd, error: de } = await supabase.auth.admin.createUser({
      email: 'declined@test.rentalcity.com',
      password: TEST_PASSWORD,
      email_confirm: true,
    })
    if (de) {
      console.error('Failed to create declined tenant:', de.message)
    } else {
      declinedTenantId = dd.user.id
      console.log('Created declined tenant:', dd.user.email)
    }
  }

  if (lockedTenantUser) {
    lockedTenantId = lockedTenantUser.id
    console.log('Locked tenant user exists:', lockedTenantUser.email)
  } else {
    const { data: dl, error: dlErr } = await supabase.auth.admin.createUser({
      email: 'locked@test.rentalcity.com',
      password: TEST_PASSWORD,
      email_confirm: true,
    })
    if (dlErr) {
      console.error('Failed to create locked tenant:', dlErr.message)
    } else {
      lockedTenantId = dl.user.id
      console.log('Created locked tenant:', dl.user.email)
    }
  }

  if (unlockedTenantUser) {
    unlockedTenantId = unlockedTenantUser.id
    console.log('Unlocked tenant user exists:', unlockedTenantUser.email)
  } else {
    const { data: du, error: duErr } = await supabase.auth.admin.createUser({
      email: 'unlocked@test.rentalcity.com',
      password: TEST_PASSWORD,
      email_confirm: true,
    })
    if (duErr) {
      console.error('Failed to create unlocked tenant:', duErr.message)
    } else {
      unlockedTenantId = du.user.id
      console.log('Created unlocked tenant:', du.user.email)
    }
  }

  // Ensure profiles exist
  const profileRows = [
    { id: landlordId, role: 'landlord', display_name: 'Test Landlord' },
    { id: tenantId, role: 'tenant', display_name: 'Test Tenant' },
  ]
  if (declinedTenantId) {
    profileRows.push({ id: declinedTenantId, role: 'tenant', display_name: 'Declined Tenant' })
  }
  if (lockedTenantId) {
    profileRows.push({ id: lockedTenantId, role: 'tenant', display_name: 'Locked Tenant' })
  }
  if (unlockedTenantId) {
    profileRows.push({ id: unlockedTenantId, role: 'tenant', display_name: 'Unlocked Tenant' })
  }
  await supabase.from('profiles').upsert(profileRows, { onConflict: 'id' })

  // Properties
  const { data: props } = await supabase
    .from('properties')
    .select('id')
    .eq('landlord_id', landlordId)
    .limit(1)

  let propertyId
  if (props?.length) {
    propertyId = props[0].id
    console.log('Property exists:', propertyId)
  } else {
    const { data: p, error: pe } = await supabase
      .from('properties')
      .insert({
        landlord_id: landlordId,
        address_line1: '123 Oak Street, Apt 4B',
        city: 'Rochester',
        state: 'NY',
        postal_code: '14616',
        country: 'US',
        bedrooms: 2,
        bathrooms: 2,
        sqft: 1200,
        monthly_rent_cents: 145000,
        deposit_cents: 290000,
        description: 'Spacious apartment with modern amenities.',
        status: 'active',
        title: '123 Oak Street, Apt 4B',
        amenities: ['pet_friendly', 'parking', 'laundry'],
        photo_labels: ['living_room', 'kitchen', 'bedroom'],
      })
      .select('id')
      .single()
    if (pe) {
      console.error('Failed to create property:', pe.message)
      process.exit(1)
    }
    propertyId = p.id
    console.log('Created property:', propertyId)

    // Extra properties for HomePage / browsing
    await supabase.from('properties').insert([
      {
        landlord_id: landlordId,
        address_line1: '456 Pine Avenue, Unit 2A',
        city: 'Rochester',
        state: 'NY',
        postal_code: '14616',
        bedrooms: 1,
        bathrooms: 1,
        sqft: 750,
        monthly_rent_cents: 120000,
        status: 'active',
        title: '456 Pine Avenue, Unit 2A',
        amenities: ['gym', 'balcony'],
        photo_labels: ['living_room'],
      },
      {
        landlord_id: landlordId,
        address_line1: '789 Maple Drive, Suite 1C',
        city: 'Buffalo',
        state: 'NY',
        postal_code: '14224',
        bedrooms: 3,
        bathrooms: 2,
        sqft: 1800,
        monthly_rent_cents: 180000,
        status: 'active',
        title: '789 Maple Drive, Suite 1C',
        amenities: ['pet_friendly', 'yard', 'parking'],
        photo_labels: ['living_room', 'bedroom'],
      },
    ])
  }

  // Applications
  const { data: apps } = await supabase
    .from('applications')
    .select('id')
    .eq('tenant_id', tenantId)
    .eq('property_id', propertyId)
    .limit(1)

  let appId
  if (apps?.length) {
    appId = apps[0].id
    console.log('Application exists:', appId)
  } else {
    const { data: a, error: ae } = await supabase
      .from('applications')
      .insert({
        tenant_id: tenantId,
        property_id: propertyId,
        status: 'approved',
        message: 'I am interested in this property.',
      })
      .select('id')
      .single()
    if (ae) {
      console.error('Failed to create application:', ae.message)
      process.exit(1)
    }
    appId = a.id
    console.log('Created application:', appId)
  }

  // Declined-tenant application (rejected)
  if (declinedTenantId && propertyId) {
    const { data: existingDeclined } = await supabase
      .from('applications')
      .select('id')
      .eq('tenant_id', declinedTenantId)
      .eq('property_id', propertyId)
      .limit(1)
    if (!existingDeclined?.length) {
      await supabase.from('applications').insert({
        tenant_id: declinedTenantId,
        property_id: propertyId,
        status: 'rejected',
        message: 'I was really hoping to rent this place. Please reconsider.',
      })
      console.log('Created declined tenant application (rejected)')
    }
  }

  // Locked-tenant application (pending, no unlocked_at)
  if (lockedTenantId && propertyId) {
    const { data: existingLocked } = await supabase
      .from('applications')
      .select('id')
      .eq('tenant_id', lockedTenantId)
      .eq('property_id', propertyId)
      .limit(1)
    if (!existingLocked?.length) {
      await supabase.from('applications').insert({
        tenant_id: lockedTenantId,
        property_id: propertyId,
        status: 'pending',
        message: 'Interested in viewing this unit. Flexible on move-in.',
      })
      console.log('Created locked tenant application (pending)')
    }
  }

  // Unlocked-tenant application (pending + unlocked_at so landlord can accept/decline)
  if (unlockedTenantId && propertyId) {
    const { data: existingUnlocked } = await supabase
      .from('applications')
      .select('id')
      .eq('tenant_id', unlockedTenantId)
      .eq('property_id', propertyId)
      .limit(1)
    if (!existingUnlocked?.length) {
      await supabase.from('applications').insert({
        tenant_id: unlockedTenantId,
        property_id: propertyId,
        status: 'pending',
        unlocked_at: new Date().toISOString(),
        message: 'Would love to rent here. Happy to provide references.',
      })
      console.log('Created unlocked tenant application (pending + unlocked_at)')
    }
  }

  // Payments (tenant application fee)
  const { data: existingPayments } = await supabase
    .from('payments')
    .select('id')
    .eq('application_id', appId)
    .limit(1)

  if (!existingPayments?.length) {
    await supabase.from('payments').insert([
      { application_id: appId, payer_id: tenantId, amount_cents: 2500, status: 'succeeded', description: 'Application Fee' },
      { application_id: appId, payer_id: tenantId, amount_cents: 2500, status: 'expired', description: 'Application Fee' },
    ])
    console.log('Created tenant payments')

    // Landlord payments (match unlock style - use description, payer_id = landlord)
    await supabase.from('payments').insert([
      { application_id: appId, payer_id: landlordId, amount_cents: 2999, status: 'succeeded', description: 'Match Unlock - Premium Tenant Profile' },
      { application_id: appId, payer_id: landlordId, amount_cents: 1999, status: 'succeeded', description: 'Background Check Access' },
      { application_id: appId, payer_id: landlordId, amount_cents: 4999, status: 'succeeded', description: 'Premium Listing Boost' },
      { application_id: appId, payer_id: landlordId, amount_cents: 2999, status: 'failed', description: 'Match Unlock - Premium Tenant Profile' },
    ])
    console.log('Created landlord payments')
  }

  // Notifications (link + property_id so "View Property" goes to the specific property)
  await supabase.from('notifications').insert([
    { user_id: tenantId, title: 'Application Approved', body: 'Your application for 123 Oak Street has been approved.', type: 'application_approved', link: '/applications' },
    { user_id: tenantId, title: 'New Match', body: 'A new property matches your preferences.', type: 'property_match', link: `/property/${propertyId}`, property_id: propertyId },
    { user_id: tenantId, title: 'Message', body: "Sarah Johnson sent you a message about the property at 456 Pine Avenue. She'd like to schedule a viewing.", type: 'message', link: '/messages' },
    { user_id: landlordId, title: 'New Application', body: 'A new application for 123 Oak Street.', type: 'application_update', link: '/matches' },
  ])
  console.log('Inserted notifications')

  // Message threads and messages
  const { data: existingThreads } = await supabase
    .from('message_threads')
    .select('id')
    .eq('tenant_id', tenantId)
    .eq('property_id', propertyId)
    .limit(1)

  if (!existingThreads?.length) {
    const { data: thread, error: threadErr } = await supabase
      .from('message_threads')
      .insert({
        tenant_id: tenantId,
        landlord_id: landlordId,
        property_id: propertyId,
        application_id: appId,
      })
      .select('id')
      .single()

    if (threadErr) {
      console.error('Failed to create message thread:', threadErr.message)
    } else {
      const threadId = thread.id
      await supabase.from('messages').insert([
        { thread_id: threadId, sender_id: tenantId, body: 'Hi! I applied for 123 Oak Street and wanted to introduce myself.' },
        { thread_id: threadId, sender_id: landlordId, body: 'Hello! Thanks for your interest. I’d be happy to answer any questions about the property.' },
        { thread_id: threadId, sender_id: tenantId, body: 'When would be a good time to schedule a viewing?' },
        { thread_id: threadId, sender_id: landlordId, body: 'I have availability this weekend. Saturday 2pm or Sunday 10am work for me. Which is better for you?' },
        { thread_id: threadId, sender_id: tenantId, body: 'Saturday at 2pm works great. See you then!' },
      ])
      console.log('Created message thread and 5 messages')
    }
  }

  console.log('Seeding complete.')
  console.log('Match states seeded: Locked (pending), Unlocked (pending+unlocked_at), Accepted (approved), Declined (rejected).')
  console.log('Test logins: landlord@test.rentalcity.com / tenant@test.rentalcity.com with password:', TEST_PASSWORD)
  console.log('Run npm run db:migrate first if you have not applied the application unlocked_at migration.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
