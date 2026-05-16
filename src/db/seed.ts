import { db } from './index'
import {
  categories, pagePlacements, optInConfigs, sequenceSteps,
} from './schema'

async function main() {
// Guard: skip if already seeded
const existing = await db.select().from(categories).limit(1)
if (existing.length > 0) {
  console.log('DB already seeded. Skipping.')
  process.exit(0)
}

// ─── Helpers ────────────────────────────────────────────────────────────────

const p = (text: string) =>
  `<p style="font-size:16px;line-height:1.6;color:#111;margin:0 0 16px">${text}</p>`

const btn = (href: string, label: string) =>
  `<a href="${href}" style="background:#111;color:#fff;padding:12px 24px;border-radius:6px;font-size:14px;font-weight:600;text-decoration:none;display:inline-block">${label}</a>`

const tip = (text: string) =>
  `<p style="font-size:11px;font-weight:600;color:#9ca3af;letter-spacing:0.08em;text-transform:uppercase;margin:0 0 6px">One thing to know before you buy</p>` +
  `<p style="font-size:15px;line-height:1.6;color:#374151;background:#f9fafb;border-radius:6px;padding:12px 16px;margin:0 0 20px">${text}</p>`

const sign = `<p style="font-size:15px;color:#6b7280;margin:24px 0 0">— The shouldit team</p>`

// ─── Body HTML per sequence step ────────────────────────────────────────────

const bodies: Record<string, string> = {

  'blenders-buying-d0': [
    p('<strong>{{product_name}}</strong> scored <strong>{{score}}/10</strong> across our full test suite — smoothie, frozen fruit, almond butter, protein shake, crushed ice.'),
    p("Here's what the tests showed:"),
    p('{{product_verdict}}'),
    p('At {{current_price}}, {{value_statement}}'),
    tip('{{test_tip}}'),
    p("We'll let you know if the price drops."),
    btn('{{review_url}}', 'See full test results →'),
    sign,
  ].join('\n'),

  'blenders-buying-d2': [
    p('<strong>{{current_price}}</strong> is its standard retail price.'),
    p("It's dropped to <strong>{{low_price}}</strong> before — usually around Prime Day (July) and Black Friday (November). Outside those windows, it rarely dips more than 10–15%."),
    p("Our read: if it's at {{current_price}} right now, it's a fair price. Don't wait for a deal that might not come for months."),
    p("We'll email you if it drops below {{low_price}}. Otherwise, {{current_price}} is as good as it gets outside sale season."),
    btn('{{affiliate_url}}', 'Check current price →'),
    sign,
  ].join('\n'),

  'blenders-buying-d4': [
    p('If the {{product_name}} just arrived — one thing worth knowing from our testing:'),
    p('{{test_tip}}'),
    p('Also: first blend — run water + a drop of dish soap at full speed for 30 seconds. Cleans the blade assembly before first use.'),
    p("That's it. Enjoy it."),
    sign,
    p('<em>P.S. If something\'s not right with it, reply here. We\'ll try to help.</em>'),
  ].join('\n'),

  'blenders-buying-d7': [
    p('shouldit Pro ($4.99/month):'),
    `<p style="font-size:16px;line-height:1.8;color:#111;margin:0 0 16px">
      → Price tracking on any product we've reviewed. Set your target price. We email you when it hits. We also tell you if it's actually a good deal — or if it'll go lower before the holidays.<br><br>
      → Save and compare products side by side. Build your shortlist from our tested picks.<br><br>
      → Custom ratings. Weight the criteria that matter to you. Noise matters more than power in your apartment? Your rankings will reflect that.
    </p>`,
    btn('https://shouldit.com/pro?ref=email', 'Try Pro free for 14 days →'),
    p("The weekly email is always free. This is for if you want more."),
    sign,
  ].join('\n'),

  'blenders-research-d0': [
    p('{{product_name}} scored {{score}}/10 overall.'),
    `<p style="font-size:16px;line-height:1.8;color:#111;margin:0 0 16px">
      Here's where it landed across each test:<br><br>
      Smoothie: {{smoothie_result}}<br>
      Frozen fruit: {{frozen_result}}<br>
      Almond butter: {{almond_result}}<br>
      Protein shake: {{protein_result}}<br>
      Cleanup: {{cleanup_result}}
    </p>`,
    p('{{product_verdict}}'),
    p("Not sure if it's right for you? Reply and tell us what you blend most. We'll give you a straight answer."),
    btn('{{review_url}}', 'See full review →'),
    sign,
  ].join('\n'),

  'blenders-research-d2': [
    p('Three things most people get wrong — from testing 45+ models:'),
    `<p style="font-size:16px;line-height:1.8;color:#111;margin:0 0 16px">
      1. <strong>Higher wattage ≠ better blender.</strong><br>
      We've tested 1200W blenders that struggled with frozen fruit and 700W models that crushed ice easily. Blade design and jar geometry matter more. Wattage is marketing.<br><br>
      2. <strong>More expensive ≠ longer lasting.</strong><br>
      We've seen $400 blenders develop bearing noise in 6 months. Brand matters more than price tier for motor longevity.<br><br>
      3. <strong>You probably don't need a big jar.</strong><br>
      Most people blend for 1–2 people. 48oz is unnecessary — and harder to clean. Personal-size models win on convenience for solo use.
    </p>`,
    p("The one thing that actually matters: blade quality and seal design. Determines leaking, real blending vs chopping, and how long it lasts. We check this in every review."),
    sign,
  ].join('\n'),

  'blenders-research-d4': [
    p("If you're still comparing options — one question helps us point you in the right direction:"),
    p('<strong>What do you blend most?</strong>'),
    `<p style="font-size:16px;line-height:2;color:#111;margin:0 0 16px">
      <a href="https://engage.shouldit.com/api/survey?sid={{sid}}&answer=smoothies-daily" style="color:#111">🥤 Daily smoothies</a><br>
      <a href="https://engage.shouldit.com/api/survey?sid={{sid}}&answer=nut-butters-soups" style="color:#111">🥜 Nut butters and soups</a><br>
      <a href="https://engage.shouldit.com/api/survey?sid={{sid}}&answer=frozen-drinks" style="color:#111">🧊 Frozen drinks</a><br>
      <a href="https://engage.shouldit.com/api/survey?sid={{sid}}&answer=a-bit-of-everything" style="color:#111">🔀 A bit of everything</a>
    </p>`,
    p("Click your answer. We'll send you our recommendation for your specific use case."),
    sign,
  ].join('\n'),

  'blenders-research-d7': [
    p('You said you mostly blend {{use_case}}.'),
    p('Based on that — and our test results — here\'s our pick:'),
    p('<strong>{{recommended_product}}</strong> — {{recommended_price}}<br>{{value_statement}}'),
    p('{{product_verdict}}'),
    btn('{{review_url}}', 'See our full review →'),
    p("If that's not quite right, reply and tell us more. We'll give you a straight answer."),
    sign,
  ].join('\n'),

  'deal-d0': [
    p('You asked us to watch the {{product_name}}. We\'re on it.'),
    `<p style="font-size:15px;line-height:1.8;color:#374151;background:#f9fafb;border-radius:6px;padding:12px 16px;margin:0 0 20px">
      Current price: {{current_price}}<br>
      Lowest in 12 months: {{low_price}}<br>
      Price status: {{price_status}}
    </p>`,
    p("We'll email you the moment it drops."),
    sign,
  ].join('\n'),

  'deal-d3': [
    p('While you\'re waiting for the price on the {{product_name}} — a quick reminder of why we picked it.'),
    p('{{product_verdict}}'),
    p("At {{low_price}}, it'll be a straightforward buy. We'll let you know when it gets there."),
    sign,
  ].join('\n'),

  'power-d0': [
    p('Full scoreboard, as requested:'),
    btn('https://shouldit.com/blenders?ref=email#scoreboard', 'See full scoreboard →'),
    `<p style="font-size:15px;line-height:1.8;color:#374151;background:#f9fafb;border-radius:6px;padding:12px 16px;margin:16px 0 20px">
      Top 5 quick summary:<br>
      1. Vitamix 5200 — 9.6/10<br>
      2. Vitamix E310 — 9.4/10<br>
      3. NutriBullet Full-Size — 9.1/10<br>
      4. Ninja SS151 TWISTi — 8.8/10<br>
      5. Ninja AMZ493BRN — 8.2/10
    </p>`,
    p("The gap between #1 and #3 is real but smaller than the price difference suggests. Full breakdown at the link above."),
    sign,
  ].join('\n'),

  'power-d2': [
    p("Here's exactly how we test — same protocol for every blender:"),
    `<p style="font-size:15px;line-height:1.8;color:#374151;background:#f9fafb;border-radius:6px;padding:12px 16px;margin:0 0 20px">
      <strong>SMOOTHIE</strong><br>
      Mix: kale, apple, pineapple, banana, milk<br>
      Goal: smooth, homogeneous texture / Time limit: 4 minutes<br>
      We measure: consistency, time to blend, residue<br><br>
      <strong>FROZEN FRUIT</strong><br>
      Mix: mango, strawberry, pineapple, plain milk<br>
      Goal: ice cream-like texture / Time limit: 5 minutes<br>
      We measure: texture, chunks remaining, speed<br><br>
      <strong>ALMOND BUTTER</strong><br>
      100g raw almonds, no liquid<br>
      We measure: time, smoothness, motor strain<br><br>
      <strong>PROTEIN SHAKE</strong><br>
      Standard whey protein + milk<br>
      We measure: lump-free result, foam, cleanup time<br><br>
      <strong>CRUSHED ICE</strong><br>
      200g ice cubes<br>
      We measure: consistency, time, noise level (dB)
    </p>`,
    p("Same ingredients. Same quantities. Same room temperature. No shortcuts. No brand sees our scores before we publish."),
    sign,
  ].join('\n'),

  'power-d5': [
    p('If you liked the blender scoreboard — shouldit Pro gives you access to all of it, across every category we\'ve tested.'),
    `<p style="font-size:16px;line-height:1.8;color:#111;margin:0 0 16px">
      shouldit Pro ($4.99/month):<br><br>
      → Full test data on 200+ products<br>
      → Price tracking — we alert you when prices drop<br>
      → Custom ratings — weight the criteria you actually care about<br>
      → Save and compare across categories
    </p>`,
    btn('https://shouldit.com/pro?ref=email', 'Try Pro free for 14 days →'),
    p("No commitment. Cancel anytime."),
    sign,
  ].join('\n'),

  'crosssell-survey': [
    p("It's been about a month since you were looking at {{category}}s."),
    p("Hope it's working well."),
    p("<strong>Quick question — what's next on your list?</strong>"),
    `<p style="font-size:16px;line-height:2;color:#111;margin:0 0 16px">
      <a href="https://engage.shouldit.com/api/survey?sid={{sid}}&answer=coffee" style="color:#111">☕ Coffee maker / espresso</a><br>
      <a href="https://engage.shouldit.com/api/survey?sid={{sid}}&answer=air-fryer" style="color:#111">💨 Air fryer</a><br>
      <a href="https://engage.shouldit.com/api/survey?sid={{sid}}&answer=water-filter" style="color:#111">💧 Water filter</a><br>
      <a href="https://engage.shouldit.com/api/survey?sid={{sid}}&answer=other" style="color:#111">🔧 Something else</a>
    </p>`,
    p("Click your answer — we'll send you what we've found."),
    sign,
    p("<em>P.S. If your purchase didn't work out, reply and tell us what happened. We'll try to help.</em>"),
  ].join('\n'),

  'reengagement': [
    p("We noticed you haven't opened our emails in a while."),
    p("That's fine — maybe the timing was off, or we missed the mark on what you were looking for."),
    p("We'd rather know where we stand:"),
    `<p style="font-size:16px;margin:0 0 24px">
      <a href="https://engage.shouldit.com/api/reengagement?sid={{sid}}&action=keep" style="background:#111;color:#fff;padding:10px 20px;border-radius:6px;font-size:14px;font-weight:600;text-decoration:none;display:inline-block;margin-right:12px">Yes, keep sending →</a>
      <a href="https://engage.shouldit.com/unsubscribe?sid={{sid}}" style="color:#6b7280;font-size:14px">Unsubscribe</a>
    </p>`,
    p("If you stay: next time we email you, it'll be about something we just finished testing. No filler."),
    sign,
  ].join('\n'),
}

// ─── Step definitions ────────────────────────────────────────────────────────

type StepDef = {
  sequenceId:   string
  position:     number
  dayOffset:    number
  subject:      string
  previewText:  string
  templateId:   string
  conditionKey?: 'not_pro' | 'has_clicked_amazon' | 'has_use_case_tag'
}

const stepDefs: StepDef[] = [
  // blenders_buying
  { sequenceId: 'blenders_buying', position: 0, dayOffset: 0,
    subject:    'The {{product_name}} scored {{score}}/10 in our tests. Here\'s what that means in practice.',
    previewText:'We tested it against 44 others. Here\'s the short version.',
    templateId: 'blenders-buying-d0' },
  { sequenceId: 'blenders_buying', position: 1, dayOffset: 2,
    subject:    'Is {{current_price}} a good price for the {{product_name}} right now?',
    previewText:'Here\'s what the price history actually shows.',
    templateId: 'blenders-buying-d2' },
  { sequenceId: 'blenders_buying', position: 2, dayOffset: 4,
    subject:    'One thing to know before you unbox the {{product_name}}',
    previewText:'From 3 years of testing. Takes 30 seconds to read.',
    templateId: 'blenders-buying-d4' },
  { sequenceId: 'blenders_buying', position: 3, dayOffset: 7,
    subject:    'One more thing shouldit can do for you',
    previewText:'Free forever is fine. But here\'s what Pro gets you.',
    templateId: 'blenders-buying-d7', conditionKey: 'not_pro' },

  // blenders_research
  { sequenceId: 'blenders_research', position: 0, dayOffset: 0,
    subject:    '{{product_name}} vs 44 other blenders — here\'s how it ranked',
    previewText:'Full test results. Smoothie, frozen fruit, noise, cleanup.',
    templateId: 'blenders-research-d0' },
  { sequenceId: 'blenders_research', position: 1, dayOffset: 2,
    subject:    '3 blender myths our testing debunked',
    previewText:'Wattage isn\'t what you think it is.',
    templateId: 'blenders-research-d2' },
  { sequenceId: 'blenders_research', position: 2, dayOffset: 4,
    subject:    'Still deciding? Tell us how you blend.',
    previewText:'We\'ll match you with the right model. Takes 30 seconds.',
    templateId: 'blenders-research-d4' },
  { sequenceId: 'blenders_research', position: 3, dayOffset: 7,
    subject:    'Our pick for {{use_case}} — based on 45 tests',
    previewText:'{{recommended_product}} at {{recommended_price}}. Here\'s why.',
    templateId: 'blenders-research-d7', conditionKey: 'not_pro' },

  // deal_hunter
  { sequenceId: 'deal_hunter', position: 0, dayOffset: 0,
    subject:    'Price history for the {{product_name}}',
    previewText:'Here\'s what the price has done over the last 12 months.',
    templateId: 'deal-d0' },
  { sequenceId: 'deal_hunter', position: 1, dayOffset: 3,
    subject:    'While you wait — why the {{product_name}} is our pick',
    previewText:'The test results, quickly.',
    templateId: 'deal-d3' },

  // power_user
  { sequenceId: 'power_user', position: 0, dayOffset: 0,
    subject:    'Full scoreboard — all 45 blenders ranked',
    previewText:'Every model, every test, every score.',
    templateId: 'power-d0' },
  { sequenceId: 'power_user', position: 1, dayOffset: 2,
    subject:    'How we run our blender tests',
    previewText:'Behind the numbers. Every test, every measurement.',
    templateId: 'power-d2' },
  { sequenceId: 'power_user', position: 2, dayOffset: 5,
    subject:    'All the test data — unlocked with shouldit Pro',
    previewText:'Full scores on 200+ products. Price tracking. Custom ratings.',
    templateId: 'power-d5', conditionKey: 'not_pro' },

  // crosssell_survey
  { sequenceId: 'crosssell_survey', position: 0, dayOffset: 30,
    subject:    "How's the {{product_name}} working out?",
    previewText:'One question. Takes 5 seconds.',
    templateId: 'crosssell-survey' },

  // reengagement
  { sequenceId: 'reengagement', position: 0, dayOffset: 0,
    subject:    'Still useful?',
    previewText:"We'd rather you unsubscribe than ignore us.",
    templateId: 'reengagement' },
]

// ─── Placements + opt-in configs ────────────────────────────────────────────

type PlacementDef = {
  pageType: 'review' | 'best'
  position: number
  label:    string
  intent:   string
  title:    string
  subtitle: string
  cta:      string
  trust?:   string
}

const blendersPlacements: PlacementDef[] = [
  // Review page
  { pageType: 'review', position: 0, label: 'P1 — After verdict', intent: 'research',
    title:    'We tested this against 44 other blenders.',
    subtitle: 'Get the full comparison — how the {{product_name}} scored on every test vs our #1 pick and budget alternatives.',
    cta:      'See full scores →',
    trust:    'No spam. Unsubscribe anytime. One email with the data.' },
  { pageType: 'review', position: 1, label: 'P2 — After buy button', intent: 'deal',
    title:    'Not the right price yet?',
    subtitle: 'The {{product_name}} has dropped to {{low_price}} before. We\'ll tell you when it hits a real deal — and whether it\'s worth waiting for.',
    cta:      'Alert me →',
    trust:    'We only email when there\'s a genuine price drop. Not every sale.' },
  { pageType: 'review', position: 2, label: 'P3 — End of article', intent: 'research',
    title:    'Still not sure if this is the right blender for you?',
    subtitle: 'We tested 45 models. Tell us what you blend most — we\'ll send you our honest pick for your exact use case. Takes 30 seconds.',
    cta:      'Find my blender →',
    trust:    'Free. No account needed. We reply with one recommendation, not a newsletter.' },

  // Best page
  { pageType: 'best', position: 0, label: 'P1 — After pick', intent: 'buying',
    title:    'Is {{current_price}} a good price for the {{product_name}} right now?',
    subtitle: 'It\'s dropped to {{low_price}} before. We track price history — we\'ll tell you if now is a good time to buy, or if you should wait.',
    cta:      'Check the price history →',
    trust:    'One email. No spam. We tell you if it\'s worth buying now or not.' },
  { pageType: 'best', position: 1, label: 'P2 — Scoreboard gate', intent: 'data',
    title:    'See how all 45 blenders scored',
    subtitle: 'Full test scores across every metric — smoothie, frozen fruit, noise, cleanup, durability. Free, no account needed.',
    cta:      'Unlock scores →',
    trust:    undefined },
  { pageType: 'best', position: 2, label: 'P3 — Quiz', intent: 'buying',
    title:    'Which blender is actually right for you?',
    subtitle: 'What do you blend most? 60-second quiz.',
    cta:      'Get my pick →',
    trust:    'We send one email with our recommendation. Not a newsletter unless you want it.' },
  { pageType: 'best', position: 3, label: 'P4 — End of article', intent: 'buying',
    title:    'Made your decision? One more thing.',
    subtitle: 'We test new blenders every few months. We\'ll tell you if something better comes out at your price point — or if a deal on your pick is worth waiting for.',
    cta:      'Keep me posted →',
    trust:    'Max one email per month. Unsubscribe anytime.' },
]

// ─── Seed ────────────────────────────────────────────────────────────────────

console.log('Seeding blenders category…')

const [blenders] = await db.insert(categories).values({
  slug: 'blenders',
  name: 'Blenders',
}).returning()

for (const def of blendersPlacements) {
  const [placement] = await db.insert(pagePlacements).values({
    categoryId: blenders.id,
    pageType:   def.pageType,
    position:   def.position,
    label:      def.label,
  }).returning()

  await db.insert(optInConfigs).values({
    placementId: placement.id,
    intent:      def.intent,
    title:       def.title,
    subtitle:    def.subtitle,
    cta:         def.cta,
    trust:       def.trust ?? null,
  })
}

console.log(`Inserted ${blendersPlacements.length} placements with opt-in configs.`)

for (const step of stepDefs) {
  const html = bodies[step.templateId]
  if (!html) {
    console.warn(`No body HTML for templateId: ${step.templateId} — skipping`)
    continue
  }
  await db.insert(sequenceSteps).values({
    sequenceId:   step.sequenceId,
    position:     step.position,
    dayOffset:    step.dayOffset,
    subject:      step.subject,
    previewText:  step.previewText,
    bodyHtml:     html,
    conditionKey: step.conditionKey ?? null,
  })
}

console.log(`Inserted ${stepDefs.length} sequence steps.`)
console.log('Seed complete.')
process.exit(0)
}

main().catch(err => { console.error(err); process.exit(1) })
