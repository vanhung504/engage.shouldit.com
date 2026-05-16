# engage.shouldit.com — Admin UI Requirements
> Addendum to: `shouldit_engage_requirements_v4.md`
> Scope: DB-driven sequences + Admin management UI
> Status: Ready for implementation
> Date: May 2026

---

## 0. Context

This file extends v4. Goal: move `sequences.ts` (hardcoded TypeScript) to the database, and build an admin UI to manage opt-in placements and email sequences per category — no redeploy needed to add or edit content.

---

## 1. Breaking Changes from v4

| Component | v4 (old) | Admin (new) |
|---|---|---|
| Sequence definitions | `src/config/sequences.ts` | DB table `sequence_steps` |
| `determineSequence()` | Reads TypeScript config | DB query by `category + intent` |
| Email body content | Hardcoded React Email `.tsx` | Body HTML stored in DB, React Email kept as wrapper |
| `interpolate.ts` | Static variable map | Runtime resolver calling `/api/product-meta` |
| Adding a new category | Edit code + redeploy | Admin UI → clone from blenders template |

`sequences.ts` is kept as **seed data only** for the first migration run. After that, it is no longer read at runtime and should be deleted.

---

## 2. Files to Delete After Migration

| File | Action |
|---|---|
| `src/config/sequences.ts` | Delete after seed script runs successfully |
| `src/lib/interpolate.ts` | Delete — fully replaced by new runtime resolver |

The seed script (`src/db/seed.ts`) imports from `sequences.ts` once, writes to DB, then `sequences.ts` is no longer needed.

---

## 3. DB Schema — New Tables

Add to `src/db/schema.ts`:

```typescript
export const pageTypeEnum = pgEnum('page_type', ['review', 'best'])

export const conditionKeyEnum = pgEnum('condition_key', [
  'not_pro',
  'has_clicked_amazon',
  'has_use_case_tag',
])

// Product categories: blenders, knife-sharpeners, toaster-ovens...
export const categories = pgTable('categories', {
  id:        text('id').primaryKey().$defaultFn(() => createId()),
  slug:      text('slug').notNull().unique(),   // "blenders"
  name:      text('name').notNull(),            // "Blenders"
  active:    boolean('active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// Opt-in placements per category + page type, ordered
export const pagePlacements = pgTable('page_placements', {
  id:         text('id').primaryKey().$defaultFn(() => createId()),
  categoryId: text('category_id').notNull().references(() => categories.id),
  pageType:   pageTypeEnum('page_type').notNull(),   // 'review' | 'best'
  position:   integer('position').notNull(),          // drag-drop order
  label:      text('label').notNull(),               // "P1 — After verdict"
  active:     boolean('active').default(true).notNull(),
  createdAt:  timestamp('created_at').defaultNow().notNull(),
  updatedAt:  timestamp('updated_at').defaultNow().notNull(),
}, (t) => ({
  catPageIdx: index('placements_cat_page_idx').on(t.categoryId, t.pageType),
  uniqPos:    unique().on(t.categoryId, t.pageType, t.position),
}))

// Copy for each opt-in (title, subtitle, CTA, trust + intent)
export const optInConfigs = pgTable('opt_in_configs', {
  id:          text('id').primaryKey().$defaultFn(() => createId()),
  placementId: text('placement_id').notNull().references(() => pagePlacements.id).unique(),
  intent:      text('intent').notNull(),   // 'buying' | 'research' | 'deal' | 'data'
  title:       text('title').notNull(),    // supports {{variable}}
  subtitle:    text('subtitle').notNull(), // supports {{variable}}
  cta:         text('cta').notNull(),      // "Check the price history →"
  trust:       text('trust'),             // optional
  updatedAt:   timestamp('updated_at').defaultNow().notNull(),
})

// Email sequence steps — replaces sequences.ts
export const sequenceSteps = pgTable('sequence_steps', {
  id:           text('id').primaryKey().$defaultFn(() => createId()),
  sequenceId:   text('sequence_id').notNull(),  // "blenders_buying", "deal_hunter"
  position:     integer('position').notNull(),   // drag-drop order within sequence
  dayOffset:    integer('day_offset').notNull(), // 0, 2, 4, 7...
  subject:      text('subject').notNull(),       // supports {{variable}}
  previewText:  text('preview_text').notNull(),  // supports {{variable}}
  bodyHtml:     text('body_html').notNull(),     // HTML body, supports {{variable}}
  conditionKey: conditionKeyEnum('condition_key'),  // null = always send
  active:       boolean('active').default(true).notNull(),
  createdAt:    timestamp('created_at').defaultNow().notNull(),
  updatedAt:    timestamp('updated_at').defaultNow().notNull(),
}, (t) => ({
  seqPosIdx: index('steps_seq_pos_idx').on(t.sequenceId, t.position),
}))
```

### Migration Seed

After `drizzle-kit migrate`, run a one-time seed script:

```
src/db/seed.ts   ← runs once, then sequences.ts can be deleted
```

The seed creates the `blenders` category, then writes all placements, opt-in configs, and sequence steps from the existing data in `sequences.ts`.

Add a guard at the top of `seed.ts`:

```typescript
const existing = await db.select().from(categories).limit(1)
if (existing.length > 0) {
  console.log('DB already seeded. Skipping.')
  process.exit(0)
}
```

---

## 4. Runtime Changes

### 4.1 `src/app/api/jobs/send-sequences/route.ts`

```typescript
// Before:
const steps = sequences[enrollment.sequenceId]

// After:
const steps = await db.query.sequenceSteps.findMany({
  where: and(
    eq(sequenceSteps.sequenceId, enrollment.sequenceId),
    eq(sequenceSteps.active, true)
  ),
  orderBy: asc(sequenceSteps.position),
})
```

### 4.2 `src/lib/interpolate.ts` — rewrite as runtime resolver

```typescript
export async function resolveVariables(
  template: string,
  subscriberTags: Tag[]
): Promise<string> {
  const productSlug = subscriberTags.find(t => t.key === 'product_slug')?.value
  const useCase     = subscriberTags.find(t => t.key === 'use_case')?.value ?? ''
  const sid         = subscriberTags.find(t => t.key === 'sid')?.value ?? ''

  let vars: Record<string, string> = { use_case: useCase, sid }

  if (productSlug) {
    const meta = await fetchProductMeta(productSlug)  // calls shouldit.com/api/product-meta
    if (meta) {
      vars = {
        ...vars,
        product_name:    meta.name,
        current_price:   meta.currentPrice,
        low_price:       meta.historicalLow,
        price_status:    meta.priceStatus,
        score:           meta.score,
        review_url:      meta.reviewUrl,
        affiliate_url:   meta.affiliateUrl,
        value_statement: meta.valueStatement,
        product_verdict: meta.verdict,
        test_tip:        meta.testTip,
      }
    }
  }

  // If a variable is missing, keep the placeholder — never crash
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? `{{${key}}}`)
}
```

### 4.3 Email template body

Keep all existing React Email components (`Header.tsx`, `Footer.tsx`, `ProductCard.tsx`).

Add one new component:

```tsx
// src/emails/components/DynamicBody.tsx
export function DynamicBody({ html }: { html: string }) {
  return <div dangerouslySetInnerHTML={{ __html: html }} />
}
```

At send time: fetch `bodyHtml` from `sequenceSteps` → resolve variables → render inside `DynamicBody` → wrap with Header/Footer.

`src/lib/routing.ts` — no change needed. `determineSequence()` logic stays the same; only the step lookup moves to DB.

---

## 5. Admin API Routes

All routes: prefix `/api/admin/`. Auth: `x-admin-key: {ADMIN_SECRET}` header. One shared middleware, checked once.

### 5.1 Categories

```
GET   /api/admin/categories
      → [{ id, slug, name, active, placementCount }]

POST  /api/admin/categories
      body: { slug, name }
      → Clone full structure from "blenders":
        1. Create new category
        2. Clone page_placements (new categoryId)
        3. Clone opt_in_configs (placeholder copy with {{variables}})
        4. Clone sequence_steps (new sequenceId, e.g. "knife-sharpeners_buying")
      → { id, slug, name }

PATCH /api/admin/categories/:id
      body: { name?, active? }
```

### 5.2 Placements

```
GET    /api/admin/categories/:categoryId/placements
       → { review: Placement[], best: Placement[] }
       Each placement includes its opt_in_config

PATCH  /api/admin/placements/reorder
       body: { items: [{ id, position }] }
       → Bulk update positions in a single transaction

PATCH  /api/admin/placements/:id
       body: { label?, active? }

POST   /api/admin/placements
       body: { categoryId, pageType, label, position, optIn: { intent, title, subtitle, cta, trust } }

DELETE /api/admin/placements/:id
       → Cascade delete opt_in_config
```

### 5.3 Opt-in configs

```
PUT /api/admin/opt-in-configs/:placementId
    body: { intent, title, subtitle, cta, trust }
    → Upsert (update if exists, insert if not)
```

### 5.4 Sequence steps

```
GET    /api/admin/sequences/:sequenceId/steps
       → SequenceStep[]  (ordered by position)

POST   /api/admin/sequences/:sequenceId/steps
       body: { dayOffset, subject, previewText, bodyHtml, conditionKey?, position }

PATCH  /api/admin/sequence-steps/:id
       body: { dayOffset?, subject?, previewText?, bodyHtml?, conditionKey?, active? }

DELETE /api/admin/sequence-steps/:id

PATCH  /api/admin/sequences/:sequenceId/reorder
       body: { items: [{ id, position }] }
```

---

## 6. Admin UI

### Auth

Simple: login form → validate against `ADMIN_SECRET` env var → set `admin_token` cookie → middleware checks on every `/admin` route. No user management needed.

### Stack addition

```bash
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

### URL state

Use search params for navigation (`?view=edit-optin&placement=xyz`). Browser back button works correctly. No client-side router state.

### File structure

```
src/app/admin/
  layout.tsx          ← auth middleware + cookie check
  page.tsx            ← main page, category tabs
  components/
    PlacementsList.tsx
    EditOptIn.tsx
    EditSequence.tsx
    NewCategoryModal.tsx
    SequenceStepCard.tsx
    VariableChips.tsx
```

---

## 7. View Specs

### View 1 — Placements list (default)

```
[Blenders] [Knife sharpeners] [Toaster ovens]    [+ New category]
─────────────────────────────────────────────────────────────────

REVIEW PAGE                        BEST / ROUNDUP PAGE
⣿ P1 — After verdict  [research]  ⣿ P1 — After pick     [buying]
⣿ P2 — After buy btn  [deal]      ⣿ P2 — Scoreboard gate [data]
⣿ P3 — End of article [research]  ⣿ P3 — Quiz            [buying]
+ Add placement                    ⣿ P4 — End of article  [buying]
                                   + Add placement

EXIT INTENT — all pages ─────────────────────── [research]  [>]
```

- Drag handle (`⣿`) → reorder via `@dnd-kit/sortable`
- Click card → View 2
- Position saves immediately on drop (PATCH `/reorder`)
- Intent badge colors: buying=blue, research=green, deal=amber, data=gray

### View 2 — Edit opt-in

```
← Placements / P2 — After buy button                [deal]

Title
[Not the right price yet?                              ]

Subtitle
[The {{product_name}} has dropped to {{low_price}}     ]
[before. We'll tell you when it hits a real deal.      ]

CTA
[Alert me →                                            ]

Trust line
[We only email when there's a genuine price drop.      ]

Variables  (click to insert at cursor)
[{{product_name}}] [{{current_price}}] [{{low_price}}]
[{{score}}] [{{price_status}}] [{{category}}] [{{sid}}]
↳ Resolved at send time from /api/product-meta

[Save changes]  [Cancel]          Email sequence preview ↓
                                  ┌─────────────────────┐
                                  │ d0  Price history..  │
                                  │ d3  While you wait.. │
                                  └─────────────────────┘
                                  [Edit email sequence →]
```

- Variable chips: click inserts `{{variable}}` at cursor position in focused field
- Sequence preview panel: read-only summary
- Save: `PUT /api/admin/opt-in-configs/:placementId`

### View 3 — Edit sequence

```
← Back to opt-in / deal_hunter          trigger: intent = deal

⣿  Day 0   Price history for {{product_name}}       [Edit] [x]
            "Here's what the price has done..."

⣿  Day 3   While you wait — why {{product_name}}... [Edit] [x]
            "The test results, quickly."

[+ Add step]
```

- Drag handle → reorder (PATCH `/reorder`)
- [Edit] → inline expand with fields: `Day offset`, `Subject`, `Preview`, `Body HTML`, `Condition`
- `Condition` dropdown: `None | Only if not Pro | Only if clicked Amazon`
- `Body HTML`: `<textarea>` with monospace font — no WYSIWYG in v1
- [+ Add step]: appends new step; `dayOffset` defaults to last + 3

---

## 8. New Category Clone Flow

When "+ New category" is clicked:

```
1. Modal: enter Name ("Knife sharpeners") → slug auto-generated ("knife-sharpeners")
2. POST /api/admin/categories { slug, name }
3. Server clones full blenders structure:
   - 7 placements (3 review + 4 best)
   - opt_in_configs with generic placeholder copy
   - sequence_steps cloned as-is ({{variables}} already in subjects/body)
4. Redirect to new category tab
5. User edits copy to match the new category
```

Placeholder copy on clone:

```
title:    "Is {{current_price}} a good price for the {{product_name}} right now?"
subtitle: "It's dropped to {{low_price}} before. We track price history."
cta:      "Check the price history →"
trust:    "One email. No spam."
```

Sequence step subjects clone from blenders — they use `{{product_name}}`, `{{score}}` etc., so they adapt automatically when product-meta returns the correct data for the new category.

---

## 9. Variables Reference

All variables resolved at send time via `shouldit.com/api/product-meta`:

| Variable | Source |
|---|---|
| `{{product_name}}` | `product_meta.name` |
| `{{current_price}}` | `product_meta.currentPrice` |
| `{{low_price}}` | `product_meta.historicalLow` |
| `{{price_status}}` | `product_meta.priceStatus` |
| `{{score}}` | `product_meta.score` |
| `{{review_url}}` | `product_meta.reviewUrl` |
| `{{affiliate_url}}` | `product_meta.affiliateUrl` |
| `{{value_statement}}` | `product_meta.valueStatement` |
| `{{product_verdict}}` | `product_meta.verdict` |
| `{{test_tip}}` | `product_meta.testTip` |
| `{{use_case}}` | subscriber tag `use_case` |
| `{{sid}}` | subscriber ID |
| `{{category}}` | subscriber tag `category` |

If a variable cannot be resolved → keep `{{variable}}` in output, log a warning. Never throw.

---

## 10. Implementation Order

### Phase A — DB + Runtime (no UI, prerequisite)

```
1.  Add schema: categories, page_placements, opt_in_configs, sequence_steps
2.  npx drizzle-kit generate && drizzle-kit migrate
3.  src/db/seed.ts — import from sequences.ts into DB, with guard check
4.  Update send-sequences job → read sequenceSteps from DB
5.  Rewrite interpolate.ts → runtime resolver calling product-meta
6.  Test end-to-end: send email with DB data, variables resolve correctly
7.  Delete src/config/sequences.ts and old src/lib/interpolate.ts
```

### Phase B — Admin API

```
8.  src/app/api/admin/middleware.ts — ADMIN_SECRET check, reuse across routes
9.  GET/POST /api/admin/categories (including clone logic)
10. GET /api/admin/categories/:id/placements
11. PATCH /api/admin/placements/reorder
12. PUT /api/admin/opt-in-configs/:placementId
13. GET/POST /api/admin/sequences/:id/steps
14. PATCH/DELETE /api/admin/sequence-steps/:id
15. PATCH /api/admin/sequences/:id/reorder
16. PATCH /api/admin/placements/:id and POST /api/admin/placements
```

### Phase C — Admin UI

```
17. src/app/admin/layout.tsx — cookie auth + login form
18. src/app/admin/page.tsx — category tabs + URL search param state
19. PlacementsList.tsx + @dnd-kit/sortable
20. EditOptIn.tsx — form fields + variable chip insertion + sequence preview
21. EditSequence.tsx — step list + @dnd-kit + inline step editor
22. NewCategoryModal.tsx
23. VariableChips.tsx — shared component, insert at cursor on click
```

---

## 11. Out of Scope (v1)

- WYSIWYG email body editor (use raw HTML textarea)
- Live email preview in browser
- Revision history / undo
- Per-step A/B subject line testing
- Multi-user admin with role-based access
- Import/export category config as JSON

---

## 12. Key Decisions

| Topic | Decision |
|---|---|
| Sequence config storage | DB (`sequence_steps`) — `sequences.ts` used as seed data only, then deleted |
| Email body | HTML stored in DB — React Email keeps wrapper (Header/Footer) only |
| Variable resolution | Runtime — calls `/api/product-meta` at send time per subscriber |
| Condition system | Enum string (`not_pro`, `has_clicked_amazon`) — not arbitrary functions |
| Drag & drop | `@dnd-kit/core` + `@dnd-kit/sortable` |
| Admin auth | `ADMIN_SECRET` cookie — no user management |
| New category | Clone from blenders template — `{{variables}}` auto-adapt |
| URL state | Search params (`?view=&placement=`) — browser back works correctly |

---

*Addendum to shouldit_engage_requirements_v4.md — May 2026*
