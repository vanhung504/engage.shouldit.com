import {
  pgTable, pgEnum, text, timestamp,
  integer, boolean, unique, index, jsonb, numeric
} from 'drizzle-orm/pg-core'
import { createId } from '@paralleldrive/cuid2'

// ─── Enums ────────────────────────────────────────────────────────────────────

export const subscriberStatusEnum = pgEnum('subscriber_status',
  ['ACTIVE', 'UNSUBSCRIBED', 'BOUNCED', 'COMPLAINED'])

export const eventTypeEnum = pgEnum('event_type', [
  'SUBSCRIBED', 'AFFILIATE_CLICK', 'EMAIL_OPENED',
  'EMAIL_CLICKED', 'SURVEY_ANSWERED', 'PRO_UPGRADED', 'UNSUBSCRIBED'
])

export const enrollmentStatusEnum = pgEnum('enrollment_status',
  ['ACTIVE', 'PAUSED', 'COMPLETED', 'CANCELLED'])

export const pageTypeEnum = pgEnum('page_type', ['review', 'best'])

// Gate condition evaluated at send time against subscriber attributes.
// If the condition fails, the step is skipped.
export const conditionKeyEnum = pgEnum('condition_key', [
  'not_pro',               // send only if subscriber has not upgraded to Pro
  'has_clicked_amazon',    // send only if subscriber has clicked an affiliate link
  'has_use_case_tag',      // send only if subscriber has completed the use-case quiz
  'price_status_all_time_low', // send only when price is at or near historical low (≤ low * 1.03)
  'price_status_good',         // send only when price is good
  'price_status_fair',         // send only when price is fair
  'price_status_high',         // send only when price is high
])

// ─── Subscribers ──────────────────────────────────────────────────────────────

// Người dùng đã opt-in. resendContactId dùng để sync với Resend audience.
export const subscribers = pgTable('subscribers', {
  id:              text('id').primaryKey().$defaultFn(() => createId()),
  email:           text('email').notNull().unique(),
  status:          subscriberStatusEnum('status').default('ACTIVE').notNull(),
  resendContactId: text('resend_contact_id').unique(),
  meta:            jsonb('meta').$type<{ member_tier?: string; engagement?: 'active' }>().notNull().default({}),
  createdAt:       timestamp('created_at').defaultNow().notNull(),
  updatedAt:       timestamp('updated_at').defaultNow().notNull(),
})

// Audit log mọi hành động của subscriber theo thời gian.
// Khác tags (snapshot hiện tại), events là lịch sử đầy đủ — dùng cho analytics,
// tính conversion rate, debug, re-engagement logic.
// AFFILIATE_CLICK: ghi khi subscriber click affiliate link → dùng để check
//   "đã schedule day-21 checkin chưa?" (enrollIfNotEnrolled crosssell_survey).
//   Anonymous click (chưa opt-in) không track — chấp nhận được vì không có subscriberId.
export const events = pgTable('events', {
  id:            text('id').primaryKey().$defaultFn(() => createId()),
  subscriberId:  text('subscriber_id').notNull().references(() => subscribers.id),
  type:          eventTypeEnum('type').notNull(),
  metadata:      text('metadata'), // JSON string, tùy event type
  resendEmailId: text('resend_email_id'), // links EMAIL_OPENED/EMAIL_CLICKED back to send logs
  createdAt:     timestamp('created_at').defaultNow().notNull(),
}, (t) => [
  index('events_sub_type_idx').on(t.subscriberId, t.type),
  index('events_type_time_idx').on(t.type, t.createdAt),
])

// ─── Email Sequences ───────────────────────────────────────────────────────────

// Trạng thái hiện tại của một subscriber trong một sequence.
// step = index trong mảng steps đã sắp xếp theo position.
// nextSendAt = thời điểm gửi step tiếp theo (enrolledAt + dayOffset của step đó).
export const sequenceEnrollments = pgTable('sequence_enrollments', {
  id:           text('id').primaryKey().$defaultFn(() => createId()),
  subscriberId: text('subscriber_id').notNull().references(() => subscribers.id),
  sequenceId:   text('sequence_id').notNull(),
  productId:    text('product_id'),
  meta:         jsonb('meta').$type<Record<string, string>>().notNull().default({}),
  step:         integer('step').default(0).notNull(),
  status:       enrollmentStatusEnum('status').default('ACTIVE').notNull(),
  enrolledAt:   timestamp('enrolled_at').defaultNow().notNull(),
  nextSendAt:   timestamp('next_send_at'),
  completedAt:  timestamp('completed_at'),
}, (t) => [
  unique().on(t.subscriberId, t.sequenceId),
  index('enrollments_status_time_idx').on(t.status, t.nextSendAt),
])

// Từng email trong một sequence. sequenceId là string tự do (vd: 'blenders_buying').
// dayOffset tính từ enrolledAt. conditionKey kiểm tra tại send time — nếu fail thì skip step này.
export const sequenceSteps = pgTable('sequence_steps', {
  id:           text('id').primaryKey().$defaultFn(() => createId()),
  sequenceId:   text('sequence_id').notNull(),
  position:     integer('position').notNull(),
  dayOffset:    integer('day_offset').notNull(),
  subject:      text('subject').notNull(),
  previewText:  text('preview_text').notNull(),
  bodyHtml:     text('body_html').notNull(),
  conditionKey: conditionKeyEnum('condition_key'),
  active:       boolean('active').default(true).notNull(),
  createdAt:    timestamp('created_at').defaultNow().notNull(),
  updatedAt:    timestamp('updated_at').defaultNow().notNull(),
}, (t) => [
  index('steps_seq_pos_idx').on(t.sequenceId, t.position),
])

// Log từng email sequence đã gửi. resendEmailId dùng để webhook Resend
// map event opened/clicked về đúng step và enrollment cụ thể.
export const sequenceSendLog = pgTable('sequence_send_log', {
  id:            text('id').primaryKey().$defaultFn(() => createId()),
  enrollmentId:  text('enrollment_id').notNull().references(() => sequenceEnrollments.id),
  stepId:        text('step_id').notNull().references(() => sequenceSteps.id),
  sentAt:        timestamp('sent_at').defaultNow().notNull(),
  resendEmailId: text('resend_email_id'),
}, (t) => [
  index('send_log_resend_id_idx').on(t.resendEmailId),
  index('send_log_enrollment_idx').on(t.enrollmentId),
])


// ─── Admin — Opt-in Configs ───────────────────────────────────────────────────

// Nhóm placements theo product category (blenders, vacuums...).
export const categories = pgTable('categories', {
  id:        text('id').primaryKey().$defaultFn(() => createId()),
  slug:      text('slug').notNull().unique(),
  name:      text('name').notNull(),
  active:    boolean('active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// Vị trí đặt opt-in form trên trang shouldit.com.
// pageType: 'review' (trang review 1 sản phẩm) | 'best' (trang roundup nhiều sản phẩm).
// position: thứ tự hiển thị trong admin, dùng để drag-and-drop.
export const pagePlacements = pgTable('page_placements', {
  id:         text('id').primaryKey().$defaultFn(() => createId()),
  categoryId: text('category_id').notNull().references(() => categories.id),
  pageType:   pageTypeEnum('page_type').notNull(),
  position:   integer('position').notNull(),
  label:      text('label').notNull(),
  active:     boolean('active').default(true).notNull(),
  createdAt:  timestamp('created_at').defaultNow().notNull(),
  updatedAt:  timestamp('updated_at').defaultNow().notNull(),
}, (t) => [
  index('placements_cat_page_idx').on(t.categoryId, t.pageType),
  unique().on(t.categoryId, t.pageType, t.position),
])

// Nội dung opt-in form cho từng placement: title, subtitle, CTA, trust line.
// intent quyết định sequence nào subscriber được enroll vào sau khi opt-in.
// previewVars: test values để preview trong admin UI, lưu vào DB để reuse.
export const optInConfigs = pgTable('opt_in_configs', {
  id:          text('id').primaryKey().$defaultFn(() => createId()),
  placementId: text('placement_id').notNull().references(() => pagePlacements.id).unique(),
  intent:      text('intent').notNull(),
  title:       text('title').notNull(),
  subtitle:    text('subtitle').notNull(),
  cta:         text('cta').notNull(),
  trust:       text('trust'),
  previewVars: jsonb('preview_vars').$type<Record<string, string>>(),
  updatedAt:   timestamp('updated_at').defaultNow().notNull(),
})

// ─── Price Alerts ─────────────────────────────────────────────────────────────

// Template email cho từng loại alert, theo category.
// alertType hiện tại: 'price_drop'. Unique per (categoryId, alertType).
export const alertTemplates = pgTable('alert_templates', {
  id:           text('id').primaryKey().$defaultFn(() => createId()),
  categoryId:   text('category_id').notNull().references(() => categories.id),
  alertType:    text('alert_type').notNull(),
  intent:       text('intent'),
  conditionKey: conditionKeyEnum('condition_key'),
  subject:      text('subject').notNull(),
  previewText:  text('preview_text').notNull(),
  bodyHtml:     text('body_html').notNull(),
  active:       boolean('active').default(true).notNull(),
  updatedAt:    timestamp('updated_at').defaultNow().notNull(),
}, (t) => [
  unique().on(t.categoryId, t.alertType, t.intent),
])

// Subscriber đã đăng ký nhận price drop alert cho một sản phẩm cụ thể.
// expiresAt = createdAt + 90 ngày — sau đó không gửi nữa (có thể đã mua hoặc không còn quan tâm).
// lastAlertSentAt / lastAlertPrice được tra từ alertSendLog thay vì lưu ở đây.
export const alertSubscriptions = pgTable('alert_subscriptions', {
  id:           text('id').primaryKey().$defaultFn(() => createId()),
  subscriberId: text('subscriber_id').notNull().references(() => subscribers.id),
  categoryId:   text('category_id').notNull().references(() => categories.id),
  productId:    text('product_id').notNull(),
  intent:               text('intent'),
  priceAtSubscription:  numeric('price_at_subscription'),
  expiresAt:            timestamp('expires_at').notNull(),
  active:       boolean('active').default(true).notNull(),
  createdAt:    timestamp('created_at').defaultNow().notNull(),
}, (t) => [
  unique().on(t.subscriberId, t.productId),
  index('alert_subs_expires_active_idx').on(t.expiresAt, t.active),
])

// Log từng price alert đã gửi. priceAtSend dùng để tính drop lần tiếp theo
// (phải giảm thêm ≥$5 so với lần gửi trước). resendEmailId để track open/click qua webhook.
export const alertSendLog = pgTable('alert_send_log', {
  id:            text('id').primaryKey().$defaultFn(() => createId()),
  subscriberId:  text('subscriber_id').notNull().references(() => subscribers.id),
  templateId:    text('template_id').notNull().references(() => alertTemplates.id),
  productId:     text('product_id').notNull(),
  priceAtSend:   numeric('price_at_send').notNull(),
  sentAt:        timestamp('sent_at').defaultNow().notNull(),
  resendEmailId: text('resend_email_id'),
}, (t) => [
  index('alert_log_resend_id_idx').on(t.resendEmailId),
  index('alert_log_subscriber_product_idx').on(t.subscriberId, t.productId),
])

// ─── Products ─────────────────────────────────────────────────────────────────

// Static product config managed via admin.
// meta stores editorial variables (product_name, score, sale_months, value_statement, etc.)
// Price stats (current_price, price_status, etc.) come from the external product API at send time.
// meta values can be a plain string or a per-price-status map { good: '...', fair: '...', high: '...' }
export type ProductMetaValue = string | Record<string, string>
export type ProductMetaEntry = { key: string; value: ProductMetaValue }

export const products = pgTable('products', {
  id:         text('id').primaryKey().$defaultFn(() => createId()),
  productId:  text('product_id').notNull().unique(),
  categoryId: text('category_id').notNull().references(() => categories.id),
  name:       text('name').notNull(),
  meta:       jsonb('meta').$type<ProductMetaEntry[]>().notNull().default([]),
  createdAt:  timestamp('created_at').defaultNow().notNull(),
  updatedAt:  timestamp('updated_at').defaultNow().notNull(),
}, (t) => [
  index('products_category_idx').on(t.categoryId),
])

// ─── Types ────────────────────────────────────────────────────────────────────

export type Subscriber         = typeof subscribers.$inferSelect
export type Event              = typeof events.$inferSelect
export type SequenceEnrollment = typeof sequenceEnrollments.$inferSelect
export type SequenceStep       = typeof sequenceSteps.$inferSelect
export type SequenceSendLog    = typeof sequenceSendLog.$inferSelect
export type Category           = typeof categories.$inferSelect
export type PagePlacement      = typeof pagePlacements.$inferSelect
export type OptInConfig        = typeof optInConfigs.$inferSelect
export type AlertTemplate      = typeof alertTemplates.$inferSelect
export type Product            = typeof products.$inferSelect
export type AlertSubscription  = typeof alertSubscriptions.$inferSelect
export type AlertSendLog       = typeof alertSendLog.$inferSelect
