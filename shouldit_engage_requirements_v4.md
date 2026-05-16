# engage.shouldit.com — Requirements Document
> Project: `shouldit-engage`
> Stack: Next.js 14, Drizzle ORM, Supabase PostgreSQL, Resend
> Hosting: Vercel
> Date: May 2026
> Status: Final v4 — ready for implementation

---

## 0. Before Writing Any Code

Read in this order:
1. `RULES.md` — simplicity first, no overengineering
2. `CLAUDE.md` — TypeScript, early returns, Vitest tests
3. This file

---

## 1. System Overview

```
shouldit.com (Next.js — self-hosted)
  ├── /api/member-status     ← NEW: wraps existing Keystone GraphQL client
  └── <script src="https://engage.shouldit.com/widget.js">
              │
              └── POST https://engage.shouldit.com/api/subscribe
                                    │
                            Supabase PostgreSQL
                            (managed, pooled, engage's own DB)
                                    │
                            Resend API
                            (email sending + contacts)

member.shouldit.com (KeystoneJS)
  └── No changes. Not touched directly by engage.
```

### Project responsibilities

| Domain | Status | Stack | Hosting |
|---|---|---|---|
| `shouldit.com` | Existing — add 1 file only | Next.js | Self-hosted |
| `member.shouldit.com` | Existing — no changes | KeystoneJS + GraphQL | Self-hosted |
| `engage.shouldit.com` | **New project** | Next.js 14 + Drizzle + Resend | Vercel |

---

## 2. Database — Supabase PostgreSQL + Drizzle

### Why Drizzle over Prisma
- Already used in existing project — no new learning
- 7KB bundle vs Prisma's 560KB — critical for Vercel cold starts
- Cleaner Supabase integration — single `DATABASE_URL`, no `directUrl` workaround needed
- Aligns with RULES.md: simpler, lighter, less abstraction

### Supabase setup
```bash
# 1. Create project at supabase.com → name: "shouldit-engage"
# 2. Settings → Database → copy Connection string (pooled mode, port 6543)
# → DATABASE_URL
```

### Dependencies
```bash
npm install drizzle-orm postgres @paralleldrive/cuid2
npm install -D drizzle-kit
```

### Drizzle config
```typescript
// drizzle.config.ts
import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './src/db/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
})
```

### Schema
```typescript
// src/db/schema.ts

import {
  pgTable, pgEnum, text, timestamp,
  integer, unique, index
} from 'drizzle-orm/pg-core'
import { createId } from '@paralleldrive/cuid2'

export const subscriberStatusEnum = pgEnum('subscriber_status',
  ['ACTIVE', 'UNSUBSCRIBED', 'BOUNCED', 'COMPLAINED'])

export const eventTypeEnum = pgEnum('event_type', [
  'SUBSCRIBED', 'AFFILIATE_CLICK', 'EMAIL_OPENED',
  'EMAIL_CLICKED', 'SURVEY_ANSWERED', 'PRO_UPGRADED', 'UNSUBSCRIBED'
])

export const enrollmentStatusEnum = pgEnum('enrollment_status',
  ['ACTIVE', 'PAUSED', 'COMPLETED', 'CANCELLED'])

export const subscribers = pgTable('subscribers', {
  id:              text('id').primaryKey().$defaultFn(() => createId()),
  email:           text('email').notNull().unique(),
  status:          subscriberStatusEnum('status').default('ACTIVE').notNull(),
  resendContactId: text('resend_contact_id').unique(),
  createdAt:       timestamp('created_at').defaultNow().notNull(),
  updatedAt:       timestamp('updated_at').defaultNow().notNull(),
})

export const tags = pgTable('tags', {
  id:           text('id').primaryKey().$defaultFn(() => createId()),
  subscriberId: text('subscriber_id').notNull().references(() => subscribers.id),
  key:          text('key').notNull(),
  value:        text('value').notNull(),
  createdAt:    timestamp('created_at').defaultNow().notNull(),
}, (t) => ({
  uniq:      unique().on(t.subscriberId, t.key, t.value),
  keyValIdx: index('tags_key_value_idx').on(t.key, t.value),
}))

export const events = pgTable('events', {
  id:           text('id').primaryKey().$defaultFn(() => createId()),
  subscriberId: text('subscriber_id').notNull().references(() => subscribers.id),
  type:         eventTypeEnum('type').notNull(),
  metadata:     text('metadata'), // JSON.stringify — keep simple
  createdAt:    timestamp('created_at').defaultNow().notNull(),
}, (t) => ({
  subTypeIdx:  index('events_sub_type_idx').on(t.subscriberId, t.type),
  typeTimeIdx: index('events_type_time_idx').on(t.type, t.createdAt),
}))

export const sequenceEnrollments = pgTable('sequence_enrollments', {
  id:           text('id').primaryKey().$defaultFn(() => createId()),
  subscriberId: text('subscriber_id').notNull().references(() => subscribers.id),
  sequenceId:   text('sequence_id').notNull(),
  step:         integer('step').default(0).notNull(),
  status:       enrollmentStatusEnum('status').default('ACTIVE').notNull(),
  enrolledAt:   timestamp('enrolled_at').defaultNow().notNull(),
  nextSendAt:   timestamp('next_send_at'),
  completedAt:  timestamp('completed_at'),
}, (t) => ({
  uniq:          unique().on(t.subscriberId, t.sequenceId),
  statusTimeIdx: index('enrollments_status_time_idx').on(t.status, t.nextSendAt),
}))

export const affiliateClicks = pgTable('affiliate_clicks', {
  id:           text('id').primaryKey().$defaultFn(() => createId()),
  subscriberId: text('subscriber_id'),
  email:        text('email'),
  productSlug:  text('product_slug').notNull(),
  category:     text('category').notNull(),
  pageUrl:      text('page_url').notNull(),
  clickedAt:    timestamp('clicked_at').defaultNow().notNull(),
}, (t) => ({
  emailTimeIdx: index('clicks_email_time_idx').on(t.email, t.clickedAt),
}))
```

### DB client singleton
```typescript
// src/db/index.ts
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

const client = postgres(process.env.DATABASE_URL!)
export const db = drizzle(client, { schema })
```

### Migration commands
```bash
npx drizzle-kit generate   # generate migration files
npx drizzle-kit migrate    # apply to Supabase
```

---

## 3. API Routes — engage.shouldit.com

### Constants (no magic numbers per CLAUDE.md)
```typescript
// src/lib/constants.ts
export const GRADUATION_OPEN_COUNT = 2
export const REENGAGEMENT_DAYS     = 60
export const CROSSSELL_DELAY_DAYS  = 30
export const DAY21_CHECKIN_DAYS    = 21
```

---

### 3.1 `POST /api/subscribe`

**Request:**
```typescript
{
  email: string
  tags: {
    category?:    string   // "blenders" | "coffee-makers" | "air-fryers" | ...
    intent?:      string   // "buying" | "research" | "deal" | "data"
    product_slug?: string  // "nutribullet-znbf30500z"
    entry_point?: string   // "best_page_after_pick1" | "review_inline" |
                           // "scoreboard_gate" | "quiz" | "end_of_article" | "exit_intent"
    use_case?:    string   // "smoothies" | "nut-butters" | "family" | "budget"
    price_target?: number
  }
  metadata?: {
    page_url:     string
    product_name?: string
  }
}
```

**Logic:**
```
1. Validate email format — return 400 if invalid
2. Check existing subscriber by email
   → Found: merge new tags only → return { success: true, isNew: false }
3. Call shouldit.com/api/member-status (non-blocking — never fail subscribe if this errors)
   → Pro: add tag { key: 'member_tier', value: 'pro' }
4. Insert subscriber
5. Insert tags
6. Insert SUBSCRIBED event
7. Sync to Resend contacts
8. determineSequence(tags) → create SequenceEnrollment, nextSendAt = now()
9. Return { success: true, isNew: true }
```

**Response:**
```typescript
{ success: true,  isNew: true  }   // new subscriber
{ success: true,  isNew: false }   // already exists, tags merged
{ success: false, error: string }  // validation error
```

---

### 3.2 `POST /api/track-click`

**Request:**
```typescript
{
  email?:      string
  productSlug: string
  category:    string
  pageUrl:     string
}
```

**Logic:**
```
1. Insert AffiliateClick row
2. If email → find subscriber → insert AFFILIATE_CLICK event
3. Add tag { key: 'clicked_amazon', value: productSlug }
4. If no day-21 checkin scheduled → schedule it (nextSendAt = now + 21 days)
```

---

### 3.3 `POST /api/survey`

**Request:**
```typescript
{
  subscriberId: string   // from email link ?sid= param
  answer:       string   // "coffee-makers" | "air-fryers" | "water-filters" | "other"
}
```

**Logic:**
```
1. Verify subscriberId exists → 404 if not
2. Insert SURVEY_ANSWERED event
3. Add tags: { category: answer }, { intent: 'research' }
4. enrollIfNotEnrolled(subscriberId, `${answer}_research`)
```

---

### 3.4 `POST /api/member-upgraded`

```typescript
// Header: x-api-key: {ENGAGE_API_SECRET}
{ email: string, tier: 'pro' }
```

**Logic:**
```
1. Verify x-api-key → 401 if wrong
2. Find subscriber → if not found, return { success: true } (silent, non-error)
3. Add tag { key: 'member_tier', value: 'pro' }
4. Insert PRO_UPGRADED event
5. Cancel pending Pro upsell enrollment steps
```

---

### 3.5 `POST /api/webhooks/resend`
Verify Resend webhook signature before any processing.

| Event | Action |
|---|---|
| `email.opened` | Insert EMAIL_OPENED → graduation check |
| `email.clicked` | Insert EMAIL_CLICKED |
| `email.bounced` | status = BOUNCED, cancel all enrollments |
| `email.complained` | status = COMPLAINED, cancel all enrollments |
| `contact.unsubscribed` | status = UNSUBSCRIBED, cancel all enrollments |

**Graduation check** (on every open):
```typescript
// src/lib/graduation.ts
import { GRADUATION_OPEN_COUNT } from './constants'

// If opens >= GRADUATION_OPEN_COUNT and not already tagged → add engagement:active
```

---

### 3.6 `GET /api/widget-config`
No auth required. Returns public config only.
```typescript
{ apiUrl: 'https://engage.shouldit.com/api', enabled: true }
```

---

### 3.7 `GET /api/admin/subscribers`
Header: `x-admin-key: {ADMIN_SECRET}`
Paginated. Returns subscribers with tag counts + enrollment status.

---

### 3.8 Cron jobs

```json
// vercel.json
{
  "crons": [
    { "path": "/api/jobs/send-sequences", "schedule": "0 * * * *" },
    { "path": "/api/jobs/reengagement",   "schedule": "0 9 * * *" },
    { "path": "/api/jobs/sync-resend",    "schedule": "0 2 * * *" }
  ]
}
```

All cron routes verify: `Authorization: Bearer {CRON_SECRET}`

**send-sequences** (every hour):
```
1. Find enrollments WHERE status='ACTIVE' AND nextSendAt <= now()
2. For each enrollment:
   a. Get sequence steps from config
   b. If no steps left → COMPLETED → enrollIfNotEnrolled crosssell_survey
   c. Check step condition (e.g. skip if already Pro)
   d. Render template → send via Resend
   e. Advance step → update nextSendAt
```

**reengagement** (daily 9am UTC):
```
Find subscribers:
  - No EMAIL_OPENED event in last REENGAGEMENT_DAYS days
  - Not in reengagement sequence
→ enrollIfNotEnrolled(id, 'reengagement')
```

**sync-resend** (daily 2am UTC):
```
Pull unsubscribes from Resend → update local status = UNSUBSCRIBED
```

---

## 4. Endpoint to Add on shouldit.com

One new file in the **existing shouldit.com** Next.js project:

```typescript
// shouldit.com/app/api/member-status/route.ts

export async function GET(request: Request) {
  const apiKey = request.headers.get('x-api-key')
  if (apiKey !== process.env.ENGAGE_API_SECRET) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const email = searchParams.get('email')
  if (!email) {
    return Response.json({ error: 'email required' }, { status: 400 })
  }

  try {
    // Use existing GraphQL client already in shouldit.com
    const data = await memberGraphQL(`
      query GetMemberByEmail($email: String!) {
        user(where: { email: $email }) {
          id
          memberTier
        }
      }
    `, { email })

    if (!data?.user) {
      return Response.json({ error: 'Not found' }, { status: 404 })
    }

    return Response.json({
      tier: data.user.memberTier ?? 'free',
      memberId: data.user.id,
    })
  } catch {
    // Non-blocking — engage never fails because of this
    return Response.json({ error: 'Service error' }, { status: 500 })
  }
}
```

---

## 5. Sequence Routing

```typescript
// src/lib/routing.ts

export function determineSequence(tags: Record<string, string>): string {
  if (tags.intent === 'deal') return 'deal_hunter'
  if (tags.intent === 'data') return 'power_user'

  const cat    = tags.category ?? 'general'
  const suffix = tags.intent === 'buying' ? 'buying' : 'research'
  return `${cat}_${suffix}`
}
```

---

## 6. Sequence Definitions

```typescript
// src/config/sequences.ts

import type { Tag } from '@/db/schema'

export type SequenceStep = {
  dayOffset:   number
  templateId:  string
  subject:     string
  previewText: string
  condition?:  (tags: Tag[]) => boolean
}

const isNotPro = (tags: Tag[]) =>
  !tags.some(t => t.key === 'member_tier' && t.value === 'pro')

export const sequences: Record<string, SequenceStep[]> = {

  blenders_buying: [
    { dayOffset: 0, templateId: 'blenders-buying-d0',
      subject:     "Our blender verdict — the one we'd actually buy",
      previewText: "We tested 45. Here's the winner." },
    { dayOffset: 2, templateId: 'blenders-buying-d2',
      subject:     "Is $124 a good price for the NutriBullet right now?",
      previewText: "It's dropped to $89 before. Here's the history." },
    { dayOffset: 4, templateId: 'blenders-buying-d4',
      subject:     "3 things to check before you unbox",
      previewText: "Quick tips from 3 years of blender testing." },
    { dayOffset: 7, templateId: 'blenders-buying-d7',
      subject:     "One more thing shouldit can do for you",
      previewText: "Free forever is fine. But here's what Pro gets you.",
      condition:   isNotPro },
  ],

  blenders_research: [
    { dayOffset: 0, templateId: 'blenders-research-d0',
      subject:     "How the NutriBullet scored vs 44 other blenders",
      previewText: "Full scores — smoothie, frozen fruit, noise, cleanup." },
    { dayOffset: 2, templateId: 'blenders-research-d2',
      subject:     "3 blender myths our testing debunked",
      previewText: "Wattage isn't what you think it is." },
    { dayOffset: 4, templateId: 'blenders-research-d4',
      subject:     "Still deciding? Tell us how you blend",
      previewText: "We'll match you with the right model." },
    { dayOffset: 7, templateId: 'blenders-research-d7',
      subject:     "Our final pick for your use case",
      previewText: "Based on what you told us.",
      condition:   isNotPro },
  ],

  deal_hunter: [
    { dayOffset: 0, templateId: 'deal-d0',
      subject:     "Price history for {{product_name}}",
      previewText: "Here's what the price has done over 12 months." },
    { dayOffset: 3, templateId: 'deal-d3',
      subject:     "While you wait — why it's our pick",
      previewText: "The test results, quickly." },
  ],

  power_user: [
    { dayOffset: 0, templateId: 'power-d0',
      subject:     "Full scoreboard — all 45 blenders ranked",
      previewText: "Every model, every test, every score." },
    { dayOffset: 2, templateId: 'power-d2',
      subject:     "How we built our test methodology",
      previewText: "Behind the scenes at the shouldit lab." },
    { dayOffset: 5, templateId: 'power-d5',
      subject:     "Unlock all test data — shouldit Pro",
      previewText: "Price tracking, custom ratings, full scores.",
      condition:   isNotPro },
  ],

  crosssell_survey: [
    { dayOffset: 30, templateId: 'crosssell-survey',
      subject:     "How's the {{product_name}} working out?",
      previewText: "One question. Takes 5 seconds." },
  ],

  reengagement: [
    { dayOffset: 0, templateId: 'reengagement',
      subject:     "Still useful?",
      previewText: "We'd rather you unsubscribe than ignore us." },
  ],

  // Extend here as shouldit adds categories:
  // 'coffee-makers_buying', 'coffee-makers_research'
  // 'air-fryers_buying', 'air-fryers_research'
  // 'water-filters_buying', 'water-filters_research'
}
```

---

## 7. Email Templates (React Email)

```
src/emails/
  components/
    Header.tsx          // shouldit logo
    Footer.tsx          // unsubscribe + "no advertising. we buy everything we test."
    ProductCard.tsx     // product image, name, price, CTA
    SurveyOptions.tsx   // 4-option cross-sell survey
  sequences/
    blenders/
      buying-d0.tsx  buying-d2.tsx  buying-d4.tsx  buying-d7.tsx
      research-d0.tsx  research-d2.tsx  research-d4.tsx  research-d7.tsx
    deal/
      d0.tsx  d3.tsx
    power-user/
      d0.tsx  d2.tsx  d5.tsx
    shared/
      crosssell-survey.tsx
      reengagement.tsx
```

**Footer required text:**
```
We buy everything we test. No advertising. No sponsored content.
[Unsubscribe] · shouldit.com
```

**Template variables** (via `src/lib/interpolate.ts`):
- `{{product_name}}` — from `product_slug` tag
- `{{category}}` — from `category` tag
- `{{use_case}}` — from `use_case` tag
- `{{sid}}` — subscriber ID for survey links

---

## 8. Widget (`src/widget/`)

### Build
```json
// package.json scripts
{
  "build:widget": "esbuild src/widget/index.ts --bundle --minify --outfile=public/widget.js --target=es2018 --format=iife",
  "dev:widget":   "esbuild src/widget/index.ts --bundle --outfile=public/widget.js --target=es2018 --format=iife --watch"
}
```
Target: <15KB gzipped.

### Integration on shouldit.com
```html
<!-- Server-rendered per page -->
<script>
  window.ShouldItEmail = {
    apiUrl:       'https://engage.shouldit.com/api',
    category:     'blenders',
    intent:       'buying',
    productSlug:  'nutribullet-znbf30500z',  // optional
    productName:  'NutriBullet Full-Size',   // optional
    entryPoint:   'best_page_after_pick1',
  }
</script>
<script src="https://engage.shouldit.com/widget.js" async defer></script>
```

### Data attributes (in shouldit.com article HTML)
```html
<div data-si-inline="after-pick1"></div>
<div data-si-inline="end-of-article"></div>

<div data-si-gate="scoreboard">
  <!-- scoreboard content — widget blurs and gates -->
</div>

<a href="/buy/nutribullet/?ref=amazon"
   data-si-track="affiliate"
   data-si-product="nutribullet-znbf30500z">
  Buy on Amazon
</a>
```

### Inline banner copy per intent
| Intent | Headline | CTA |
|---|---|---|
| `buying` | "Is $124 a good price right now?" | "Check price history →" |
| `research` | "See how it scored vs 44 others" | "See full scores →" |
| `deal` | "Alert me if the price drops" | "Alert me →" |
| `data` | "See full test scores" | "Unlock scores →" |

### localStorage keys
```typescript
// src/widget/storage.ts
const KEYS = {
  subscribed:   'si_subscribed',  // 'true'
  email:        'si_email',
  subscriberId: 'si_sid',
  gates:        'si_gates',       // JSON string[]
  exitShown:    'si_exit_shown',  // sessionStorage
}
```

### Exit-intent rules
- Desktop: fire on `mouseleave` to top of viewport
- Mobile: fire on `popstate` (back-button intercept)
- Max once per session
- Skip if `si_subscribed === 'true'`

---

## 9. Environment Variables

### engage.shouldit.com (Vercel)
```bash
DATABASE_URL="postgresql://postgres.xxx:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true"

RESEND_API_KEY="re_..."
RESEND_AUDIENCE_ID="..."
RESEND_WEBHOOK_SECRET="..."

ENGAGE_API_SECRET="..."   # shared with shouldit.com
ADMIN_SECRET="..."
CRON_SECRET="..."

SHOULDIT_MEMBER_STATUS_URL="https://shouldit.com/api/member-status"
```

### shouldit.com (add only these 2)
```bash
ENGAGE_API_SECRET="..."   # same value
ENGAGE_API_URL="https://engage.shouldit.com/api"
```

---

## 10. Project Structure

```
shouldit-engage/
├── CLAUDE.md
├── RULES.md
├── drizzle.config.ts
├── vercel.json
├── package.json
├── src/
│   ├── db/
│   │   ├── schema.ts
│   │   ├── index.ts
│   │   └── migrations/
│   ├── app/
│   │   ├── api/
│   │   │   ├── subscribe/route.ts
│   │   │   ├── track-click/route.ts
│   │   │   ├── survey/route.ts
│   │   │   ├── member-upgraded/route.ts
│   │   │   ├── widget-config/route.ts
│   │   │   ├── webhooks/resend/route.ts
│   │   │   ├── jobs/
│   │   │   │   ├── send-sequences/route.ts
│   │   │   │   ├── reengagement/route.ts
│   │   │   │   └── sync-resend/route.ts
│   │   │   └── admin/subscribers/route.ts
│   │   ├── admin/page.tsx
│   │   └── layout.tsx
│   ├── config/
│   │   └── sequences.ts
│   ├── emails/
│   │   ├── components/
│   │   └── sequences/
│   ├── lib/
│   │   ├── constants.ts
│   │   ├── routing.ts
│   │   ├── tags.ts
│   │   ├── enrollment.ts
│   │   ├── graduation.ts
│   │   ├── interpolate.ts
│   │   ├── member-status.ts
│   │   └── resend.ts
│   └── widget/
│       ├── index.ts
│       ├── api.ts
│       ├── storage.ts
│       ├── styles.ts
│       └── components/
│           ├── inline-banner.ts
│           ├── scoreboard-gate.ts
│           ├── exit-intent.ts
│           └── quiz.ts
```

---

## 11. Implementation Order

### Phase 1 — Foundation
```
1.  create-next-app + install dependencies
2.  src/db/schema.ts
3.  drizzle.config.ts
4.  npx drizzle-kit generate && npx drizzle-kit migrate
5.  src/db/index.ts — DB client singleton
6.  src/lib/constants.ts
7.  src/lib/tags.ts — addTag, hasTag, getTags
8.  src/lib/routing.ts — determineSequence
9.  src/config/sequences.ts — blenders sequences first
10. src/lib/resend.ts — Resend client
```

### Phase 2 — Core API
```
11. src/lib/member-status.ts — fetch shouldit.com/api/member-status
12. src/lib/enrollment.ts — enrollIfNotEnrolled, advanceStep
13. src/lib/graduation.ts — checkGraduation
14. POST /api/subscribe
15. POST /api/webhooks/resend
16. GET  /api/widget-config
```

### Phase 3 — Email sending
```
17. Install react-email
18. src/emails/components/ — Header, Footer, ProductCard, SurveyOptions
19. src/lib/interpolate.ts
20. blenders_buying templates: d0, d2 first
21. POST /api/jobs/send-sequences
22. vercel.json cron config
23. Remaining sequence templates
```

### Phase 4 — Widget
```
24. esbuild config in package.json
25. src/widget/storage.ts
26. src/widget/api.ts
27. src/widget/styles.ts — scoped si- prefix CSS
28. src/widget/components/inline-banner.ts
29. src/widget/components/scoreboard-gate.ts
30. src/widget/components/exit-intent.ts
31. src/widget/index.ts — wire all components
```

### Phase 5 — Remaining + Tests
```
32. POST /api/track-click
33. POST /api/survey
34. POST /api/member-upgraded
35. GET  /api/admin/subscribers
36. POST /api/jobs/reengagement
37. POST /api/jobs/sync-resend
38. src/widget/components/quiz.ts
39. admin/page.tsx — basic table view
40. Vitest tests for all lib/* functions
```

### shouldit.com changes (alongside Phase 4)
```
41. app/api/member-status/route.ts — new file
42. Add widget <script> to layout.tsx
43. Add data-si-* attributes to article templates
44. Add member-upgraded hook to existing upgrade flow (fire and forget)
```

---

## 12. All Key Decisions

| Topic | Decision |
|---|---|
| ORM | **Drizzle** — lighter, already used in existing project, better Vercel cold start |
| Database | **Supabase PostgreSQL** — managed, pooled, free tier sufficient |
| Email | **Resend** — developer API, React Email support |
| Sequences | TypeScript config — no migrations needed to add/edit sequences |
| Widget | esbuild → vanilla JS, no React in browser bundle |
| Widget CSS | Scoped `si-` prefix, injected into `<head>` |
| Cron | Vercel Cron — zero infra |
| Service auth | `x-api-key` shared secret — simple, sufficient |
| Keystone | No direct access — only via `shouldit.com/api/member-status` |
| Member data | engage has its own DB — fully independent |

---

## 13. Out of Scope (v1)

- Price drop automation
- Weekly newsletter UI (use Resend Broadcasts manually)
- Subscriber preference center
- Analytics dashboard
- A/B testing
- Push notifications
- Categories beyond blenders (add to `sequences.ts` when ready)

---

*v4 — May 2026 — Final*
