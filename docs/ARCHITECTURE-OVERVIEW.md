# Rental City – Architecture Overview

Tenant–landlord platform: React + Vite, Express, Supabase (Postgres, Auth, Storage, Realtime).

---

## MVP Architecture

![MVP Architecture](../assets/rentalcity-mvp-architecture.png)

3 components: React SPA, Express API, Supabase Cloud.

---

## Scalable to Millions

![Scalable Architecture](../assets/rentalcity-architecture-scalability.png)

Adds CDN, load balancer, Redis, read replicas, queues.

---

**Supabase access:** SPA → Supabase directly for auth & CRUD (user JWT + RLS). SPA → Express → Supabase for Stripe, MailerSend, Maps (server-side secrets).
