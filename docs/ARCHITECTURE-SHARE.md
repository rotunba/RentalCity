# Rental City – Architecture Overview

Tenant–landlord matching platform. **Stack:** Supabase (Postgres, Auth, Storage, Realtime), React + Vite, Express (Stripe, MailerSend, Maps).

---

## MVP vs Scalable to Millions

| | MVP | Scale |
|---|-----|-------|
| **Stack** | React, Express, Supabase Cloud | + CDN, load balancer, Redis, read replicas, queues |
| **Goal** | Validate product, early users | High traffic, global scale |

---

## MVP Architecture

![MVP Architecture](../assets/rentalcity-mvp-architecture.png)

**3 components:** React SPA, Express API (single instance), Supabase Cloud.

| Layer | Component |
|-------|-----------|
| Frontend | React + Vite |
| Backend | Express (Stripe, MailerSend, Maps) |
| Data | Supabase (Auth, Postgres, Storage, Realtime) |

**Data flow:** Auth & CRUD → SPA → Supabase (direct). Integrations → SPA → Express → external APIs. Messaging → SPA → Supabase Realtime (direct).

**Deploy:** SPA (Vercel/Netlify), API (Railway/Render), Supabase Cloud.

---

## Scalable to Millions

![Scalable Architecture](../assets/rentalcity-architecture-scalability.png)

**Add:** CDN, load balancer, multiple API instances, Redis (sessions, cache), Postgres read replicas, connection pooling, queue workers for async jobs.

**Bottlenecks & mitigations:** DB connections → pooler; write capacity → partitioning; Realtime → room-based subscriptions; external APIs → rate limiting + queues.

---

## Supabase: Direct vs Via Backend

| Path | Use Case |
|------|----------|
| **Direct** (SPA → Supabase) | Auth, CRUD, Realtime, Storage — user JWT + RLS |
| **Indirect** (SPA → API → Supabase) | Stripe, MailerSend, Maps — server uses service role, secrets stay server-side |

Backend is only used when server-side secrets or elevated privileges are needed.

---

## Supabase: Cloud vs Self-Hosted

**Recommendation: Supabase Cloud** for MVP and early scale.

| | Cloud | Self-hosted |
|---|-------|-------------|
| Who runs it | Supabase | You |
| Setup | Minutes | Hours |

Self-host only for compliance, data residency, or very high scale where cost dominates.

---

## Database & RLS

**Core tables:** profiles, tenant_preferences, properties, applications, messages, notifications, reports, tenant_ratings, payments.

**RLS:** Tenants (own data, read active properties); Landlords (own properties + applications); Admins (full access).

---

## Auth Flow

1. Supabase Auth sign up/in → 2. Trigger creates `profiles` row → 3. Role set at onboarding → 4. JWT to backend when needed.
