# Reboot Earth

> Reboot your e-waste. Reboot the Earth.

An e-waste collection platform for the SDG 11 (Sustainable Cities & Communities) competition, with SDG 12 (Responsible Consumption & Production) as secondary.

## Overview

Reboot Earth connects users with authorised recycling partners. Users add e-waste items, book doorstep pickups, track collections, chat with the admin, earn wallet cash and points, and receive recycling certificates.

## Tech Stack

- **Frontend**: React + TypeScript + Vite + Tailwind CSS
- **Backend**: Supabase (Auth, Postgres, Storage, Realtime, Edge Functions)
- **Icons**: lucide-react
- **Maps** (planned): Leaflet
- **Auth**: Email/password + Google OAuth

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Installation

```bash
npm install
npm run dev
```

### Environment Variables

The following are pre-configured in `.env` (do not change unless you know what you are doing):

- `VITE_SUPABASE_URL` — Supabase project URL
- `VITE_SUPABASE_ANON_KEY` — Supabase anon/public key

For edge functions (AI chatbot, photo analysis), additional secrets are configured via Supabase:
- `AI_API_KEY` — API key for the AI/vision service (Step 7+)

### Admin Account

The admin email is `snehasutar2802@gmail.com`. This email is automatically assigned the `admin` role via a database trigger on signup — no manual configuration needed. The admin sets her own password or uses Google login.

## Build Order

This app is being built in stages:

1. **Step 1** (current): Design system, public pages, signup/login, roles & RLS, seed data
2. Accepted list, price list, add items (manual), pickup basket
3. Pickup booking and tracking
4. Admin panel (requests, edit, messages, grading, rates, lists, handover)
5. User messages and notifications
6. Wallet, dashboard, certificate
7. AI chatbot
8. AI photo analysis and hazard alerts
9. Polish: animations, confetti, QR codes, facts, extras

## Database Schema

### Tables (Step 1)

| Table | Purpose |
|-------|---------|
| `profiles` | User data with role (user/admin), points, wallet |
| `rates` | Per-category e-waste pricing |
| `grade_factors` | A/B/C/Hazardous value multipliers |
| `accepted_items` | Accepted / special / not-accepted lists |
| `facts` | Rotating "Did you know?" facts |
| `faqs` | FAQ entries |
| `badges` | Achievement badges |
| `zones` | Service areas |
| `settings` | Key-value app settings |
| `activity_logs` | Admin audit trail |

### Security

- Row Level Security (RLS) enabled on every table
- Users can read/write only their own profile data
- Admins can read/write all data (via `is_admin()` SQL function)
- Public tables (rates, accepted_items, facts, faqs, badges, zones, settings) are readable by everyone
- Admin-only writes on rates, grade_factors, accepted_items, zones, settings, activity_logs
- Admin role auto-assigned by database trigger on profile creation

## Scripts

- `npm run dev` — Start dev server
- `npm run build` — Production build
- `npm run typecheck` — TypeScript type checking
- `npm run lint` — ESLint
- `npm run preview` — Preview production build
