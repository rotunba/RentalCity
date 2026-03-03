# Rental City

Tenant–landlord matching platform for rental properties. Built with Supabase, React, and a custom backend for integrations.

## User Types

- **Tenant**: Onboarding, leasing preferences, browse matches, apply, message landlords
- **Landlord**: Profile, property listings, tenant matches, messaging, reporting
- **Admin**: Dashboard, user management, moderation, system notifications

## Tech Stack

- **Database & Auth**: Supabase (Postgres, Auth, Storage, Realtime)
- **Custom Backend**: Node.js + Express (Plaid, SmartMove, Stripe, MailerSend)
- **Frontend**: React + Vite + TypeScript
- **Integrations**: Google Maps, Stripe, MailerSend, Termly, Plaid (optional), SmartMove (TBD)

## Quick Start

```bash
npm install
cp .env.example .env.local  # Add Supabase keys
npm run dev
```

## Project Structure

```
RentalCity/
├── client/          # React frontend
├── server/          # Custom backend (integrations, edge logic)
├── supabase/        # Migrations, Edge Functions
├── docs/            # Architecture, API specs
└── package.json
```

## Architecture

See [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) for full Supabase architecture, schema, and screen-mapped backend logic.

## Estimated Hours (from scope)

| Area | Hours |
|------|-------|
| User Types + Screen-Mapped Backend | 40 |
| Supabase Custom Backend | 10 |
| Google Maps | 15 |
| Plaid (optional) | 30 |
| SmartMove (TBD) | 30 |
| Stripe | 20 |
| MailerSend | 10 |
| Termly | 4 |
| Frontend | 20 |
| QA | 10–20 |
