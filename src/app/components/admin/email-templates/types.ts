// ─── SCR-ADM-045: Email Templates Management — Types & Mock Data ────────────

// ─── Template Category ──────────────────────────────────────────────────────

export type TemplateCategory = "Player" | "Provider" | "Coach" | "Admin" | "Payment";

export const TEMPLATE_CATEGORIES: TemplateCategory[] = [
  "Player",
  "Provider",
  "Coach",
  "Admin",
  "Payment",
];

export const CATEGORY_COLORS: Record<TemplateCategory, { bg: string; text: string; border: string }> = {
  Player:   { bg: "bg-blue-50",    text: "text-blue-700",    border: "border-blue-200" },
  Provider: { bg: "bg-amber-50",   text: "text-amber-700",   border: "border-amber-200" },
  Coach:    { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
  Admin:    { bg: "bg-gray-50",    text: "text-gray-600",    border: "border-gray-200" },
  Payment:  { bg: "bg-purple-50",  text: "text-purple-700",  border: "border-purple-200" },
};

// ─── Template Status ────────────────────────────────────────────────────────

export type TemplateStatus = "Active" | "Inactive";

// ─── Dynamic Variable ───────────────────────────────────────────────────────

export interface DynamicVariable {
  name: string;
  description: string;
  sampleValue: string;
}

// ─── Email Template Record ──────────────────────────────────────────────────

export interface EmailTemplate {
  id: string;
  eventType: string;
  category: TemplateCategory;
  subjectEN: string;
  subjectAR: string;
  bodyEN: string;
  bodyAR: string;
  hasEN: boolean;
  hasAR: boolean;
  status: TemplateStatus;
  lastModified: string; // ISO datetime
  modifiedBy: string;
  variables: DynamicVariable[];
}

// ─── Variable Sets by Category ──────────────────────────────────────────────

const COMMON_VARS: DynamicVariable[] = [
  { name: "platform_name", description: "Platform name (Playzoon)", sampleValue: "Playzoon" },
  { name: "support_email", description: "Platform support email address", sampleValue: "support@playzoon.com" },
  { name: "current_year", description: "Current calendar year", sampleValue: "2026" },
];

const PLAYER_VARS: DynamicVariable[] = [
  { name: "player_name", description: "Full name of the player", sampleValue: "Ahmed Al-Rashid" },
  { name: "player_email", description: "Player's email address", sampleValue: "ahmed@email.com" },
  ...COMMON_VARS,
];

const BOOKING_VARS: DynamicVariable[] = [
  ...PLAYER_VARS,
  { name: "booking_id", description: "Unique booking identifier", sampleValue: "BK-20260301-0042" },
  { name: "booking_date", description: "Date of the booking", sampleValue: "March 15, 2026" },
  { name: "booking_time", description: "Time slot of the booking", sampleValue: "6:00 PM - 7:00 PM" },
  { name: "facility_name", description: "Name of the facility", sampleValue: "Al Wahda Sports Club" },
  { name: "court_name", description: "Name of the court/field", sampleValue: "Court A" },
  { name: "sport_type", description: "Type of sport booked", sampleValue: "Padel" },
  { name: "amount", description: "Booking total amount (SAR)", sampleValue: "150.00 SAR" },
];

const PROVIDER_VARS: DynamicVariable[] = [
  { name: "provider_name", description: "Full name of the service provider", sampleValue: "Al Wahda Sports Club" },
  { name: "provider_email", description: "Provider's email address", sampleValue: "info@alwahda.com" },
  ...COMMON_VARS,
];

const PAYMENT_VARS: DynamicVariable[] = [
  ...COMMON_VARS,
  { name: "transaction_id", description: "Unique transaction identifier", sampleValue: "TXN-20260301-8912" },
  { name: "amount", description: "Transaction amount (SAR)", sampleValue: "150.00 SAR" },
  { name: "payment_method", description: "Payment method used", sampleValue: "Visa ending in 4242" },
  { name: "payment_date", description: "Date of the transaction", sampleValue: "March 10, 2026" },
];

const PAYOUT_VARS: DynamicVariable[] = [
  ...PROVIDER_VARS,
  { name: "payout_id", description: "Unique payout identifier", sampleValue: "PO-20260301-0015" },
  { name: "payout_amount", description: "Payout amount (SAR)", sampleValue: "4,250.00 SAR" },
  { name: "payout_date", description: "Expected payout date", sampleValue: "March 20, 2026" },
  { name: "bank_name", description: "Provider's bank name", sampleValue: "Saudi National Bank" },
];

const ADMIN_VARS: DynamicVariable[] = [
  { name: "admin_name", description: "Name of the admin user", sampleValue: "Khalid Admin" },
  ...COMMON_VARS,
];

const COACH_VARS: DynamicVariable[] = [
  { name: "coach_name", description: "Full name of the coach", sampleValue: "Omar Coach" },
  { name: "coach_email", description: "Coach's email address", sampleValue: "omar@email.com" },
  ...COMMON_VARS,
];

// ─── Mock Email Templates ───────────────────────────────────────────────────

export const MOCK_EMAIL_TEMPLATES: EmailTemplate[] = [
  // ── Player Templates ──
  {
    id: "tpl-001",
    eventType: "Booking Confirmation",
    category: "Player",
    subjectEN: "Your booking at {{facility_name}} is confirmed!",
    subjectAR: "تم تأكيد حجزك في {{facility_name}}!",
    bodyEN: `<h2>Booking Confirmed</h2>
<p>Dear {{player_name}},</p>
<p>Your booking has been successfully confirmed. Here are the details:</p>
<table style="width:100%;border-collapse:collapse;">
  <tr><td style="padding:8px;border:1px solid #ddd;"><strong>Booking ID</strong></td><td style="padding:8px;border:1px solid #ddd;">{{booking_id}}</td></tr>
  <tr><td style="padding:8px;border:1px solid #ddd;"><strong>Facility</strong></td><td style="padding:8px;border:1px solid #ddd;">{{facility_name}}</td></tr>
  <tr><td style="padding:8px;border:1px solid #ddd;"><strong>Court</strong></td><td style="padding:8px;border:1px solid #ddd;">{{court_name}}</td></tr>
  <tr><td style="padding:8px;border:1px solid #ddd;"><strong>Date</strong></td><td style="padding:8px;border:1px solid #ddd;">{{booking_date}}</td></tr>
  <tr><td style="padding:8px;border:1px solid #ddd;"><strong>Time</strong></td><td style="padding:8px;border:1px solid #ddd;">{{booking_time}}</td></tr>
  <tr><td style="padding:8px;border:1px solid #ddd;"><strong>Amount</strong></td><td style="padding:8px;border:1px solid #ddd;">{{amount}}</td></tr>
</table>
<p>See you at the court!</p>
<p>Best regards,<br/>{{platform_name}} Team</p>`,
    bodyAR: `<h2>تم تأكيد الحجز</h2>
<p>عزيزي {{player_name}},</p>
<p>تم تأكيد حجزك بنجاح. إليك التفاصيل:</p>
<p>رقم الحجز: {{booking_id}}<br/>المنشأة: {{facility_name}}<br/>التاريخ: {{booking_date}}<br/>المبلغ: {{amount}}</p>
<p>نراك هناك!</p>`,
    hasEN: true,
    hasAR: true,
    status: "Active",
    lastModified: "2026-03-08T14:22:00Z",
    modifiedBy: "Khalid Admin",
    variables: BOOKING_VARS,
  },
  {
    id: "tpl-002",
    eventType: "Booking Cancellation",
    category: "Player",
    subjectEN: "Your booking {{booking_id}} has been cancelled",
    subjectAR: "تم إلغاء حجزك {{booking_id}}",
    bodyEN: `<h2>Booking Cancelled</h2>
<p>Dear {{player_name}},</p>
<p>Your booking <strong>{{booking_id}}</strong> at {{facility_name}} on {{booking_date}} has been cancelled.</p>
<p>If a refund is applicable, it will be processed within 3-5 business days.</p>
<p>Best regards,<br/>{{platform_name}} Team</p>`,
    bodyAR: `<h2>تم إلغاء الحجز</h2><p>عزيزي {{player_name}},</p><p>تم إلغاء حجزك.</p>`,
    hasEN: true,
    hasAR: true,
    status: "Active",
    lastModified: "2026-03-07T09:15:00Z",
    modifiedBy: "Sara Admin",
    variables: BOOKING_VARS,
  },
  {
    id: "tpl-003",
    eventType: "Welcome Email",
    category: "Player",
    subjectEN: "Welcome to {{platform_name}}!",
    subjectAR: "!{{platform_name}} مرحباً بك في",
    bodyEN: `<h2>Welcome to Playzoon!</h2>
<p>Dear {{player_name}},</p>
<p>Welcome to Playzoon! Your account has been created successfully.</p>
<p>Start exploring facilities and book your favourite courts now.</p>
<p>Happy playing!</p>`,
    bodyAR: `<h2>مرحباً بك في بلازون!</h2><p>عزيزي {{player_name}},</p><p>مرحباً بك! تم إنشاء حسابك بنجاح.</p>`,
    hasEN: true,
    hasAR: true,
    status: "Active",
    lastModified: "2026-02-20T11:00:00Z",
    modifiedBy: "Khalid Admin",
    variables: PLAYER_VARS,
  },
  {
    id: "tpl-004",
    eventType: "Password Reset",
    category: "Player",
    subjectEN: "Reset your {{platform_name}} password",
    subjectAR: "إعادة تعيين كلمة المرور",
    bodyEN: `<h2>Password Reset Request</h2>
<p>Dear {{player_name}},</p>
<p>We received a request to reset your password. Click the link below to set a new password:</p>
<p><a href="{{reset_link}}">Reset Password</a></p>
<p>This link expires in 24 hours. If you did not request this, please ignore this email.</p>`,
    bodyAR: "",
    hasEN: true,
    hasAR: false,
    status: "Active",
    lastModified: "2026-02-15T08:45:00Z",
    modifiedBy: "Khalid Admin",
    variables: [...PLAYER_VARS, { name: "reset_link", description: "Password reset URL", sampleValue: "https://playzoon.com/reset?token=abc123" }],
  },
  {
    id: "tpl-005",
    eventType: "Booking Reminder",
    category: "Player",
    subjectEN: "Reminder: Your booking tomorrow at {{facility_name}}",
    subjectAR: "تذكير: حجزك غداً في {{facility_name}}",
    bodyEN: `<h2>Booking Reminder</h2>
<p>Dear {{player_name}},</p>
<p>Just a friendly reminder that your booking is coming up tomorrow:</p>
<p><strong>{{facility_name}}</strong> — {{court_name}}<br/>{{booking_date}} at {{booking_time}}</p>
<p>Don't forget to bring your gear!</p>`,
    bodyAR: `<h2>تذكير بالحجز</h2><p>عزيزي {{player_name}},</p><p>تذكير بأن حجزك غداً.</p>`,
    hasEN: true,
    hasAR: true,
    status: "Active",
    lastModified: "2026-03-01T16:30:00Z",
    modifiedBy: "Sara Admin",
    variables: BOOKING_VARS,
  },
  {
    id: "tpl-006",
    eventType: "Wallet Top-Up Confirmation",
    category: "Player",
    subjectEN: "Wallet top-up successful — {{amount}} added",
    subjectAR: "تمت إضافة {{amount}} إلى محفظتك",
    bodyEN: `<h2>Wallet Top-Up Successful</h2>
<p>Dear {{player_name}},</p>
<p>Your wallet has been topped up with <strong>{{amount}}</strong>.</p>
<p>Your new wallet balance is <strong>{{wallet_balance}}</strong>.</p>`,
    bodyAR: "",
    hasEN: true,
    hasAR: false,
    status: "Active",
    lastModified: "2026-02-28T13:10:00Z",
    modifiedBy: "Khalid Admin",
    variables: [...PLAYER_VARS, { name: "wallet_balance", description: "Current wallet balance (SAR)", sampleValue: "350.00 SAR" }],
  },
  {
    id: "tpl-007",
    eventType: "Review Request",
    category: "Player",
    subjectEN: "How was your experience at {{facility_name}}?",
    subjectAR: "كيف كانت تجربتك في {{facility_name}}؟",
    bodyEN: `<h2>Rate Your Experience</h2>
<p>Dear {{player_name}},</p>
<p>We hope you enjoyed your session at {{facility_name}}. We'd love to hear your feedback!</p>
<p><a href="{{review_link}}">Leave a Review</a></p>`,
    bodyAR: `<h2>قيم تجربتك</h2><p>عزيزي {{player_name}},</p><p>نتمنى أنك استمتعت بتجربتك.</p>`,
    hasEN: true,
    hasAR: true,
    status: "Active",
    lastModified: "2026-02-25T10:00:00Z",
    modifiedBy: "Sara Admin",
    variables: [...BOOKING_VARS, { name: "review_link", description: "Review submission URL", sampleValue: "https://playzoon.com/review/BK-0042" }],
  },

  // ── Provider Templates ──
  {
    id: "tpl-008",
    eventType: "New Booking Received",
    category: "Provider",
    subjectEN: "New booking received — {{booking_id}}",
    subjectAR: "حجز جديد — {{booking_id}}",
    bodyEN: `<h2>New Booking</h2>
<p>Dear {{provider_name}},</p>
<p>You have received a new booking:</p>
<p>Booking ID: {{booking_id}}<br/>Player: {{player_name}}<br/>Date: {{booking_date}}<br/>Time: {{booking_time}}<br/>Court: {{court_name}}</p>`,
    bodyAR: `<h2>حجز جديد</h2><p>عزيزي {{provider_name}},</p><p>لديك حجز جديد.</p>`,
    hasEN: true,
    hasAR: true,
    status: "Active",
    lastModified: "2026-03-06T11:30:00Z",
    modifiedBy: "Khalid Admin",
    variables: [...PROVIDER_VARS, ...BOOKING_VARS.filter(v => !COMMON_VARS.some(c => c.name === v.name))],
  },
  {
    id: "tpl-009",
    eventType: "Provider Registration Approved",
    category: "Provider",
    subjectEN: "Your provider account has been approved!",
    subjectAR: "تمت الموافقة على حسابك كمزود خدمة!",
    bodyEN: `<h2>Account Approved</h2>
<p>Dear {{provider_name}},</p>
<p>Congratulations! Your provider account on Playzoon has been approved. You can now log in to the Provider Portal and start managing your facilities.</p>`,
    bodyAR: `<h2>تمت الموافقة</h2><p>عزيزي {{provider_name}},</p><p>تهانينا! تم الموافقة على حسابك.</p>`,
    hasEN: true,
    hasAR: true,
    status: "Active",
    lastModified: "2026-02-18T09:00:00Z",
    modifiedBy: "Sara Admin",
    variables: PROVIDER_VARS,
  },
  {
    id: "tpl-010",
    eventType: "Provider Registration Rejected",
    category: "Provider",
    subjectEN: "Update on your provider application",
    subjectAR: "تحديث بشأن طلب التسجيل",
    bodyEN: `<h2>Application Update</h2>
<p>Dear {{provider_name}},</p>
<p>Unfortunately, your provider application has not been approved at this time. Reason: {{rejection_reason}}</p>
<p>Please contact us at {{support_email}} if you have questions.</p>`,
    bodyAR: "",
    hasEN: true,
    hasAR: false,
    status: "Active",
    lastModified: "2026-02-18T09:15:00Z",
    modifiedBy: "Sara Admin",
    variables: [...PROVIDER_VARS, { name: "rejection_reason", description: "Reason for rejection", sampleValue: "Incomplete documentation" }],
  },
  {
    id: "tpl-011",
    eventType: "Booking Cancellation (Provider)",
    category: "Provider",
    subjectEN: "Booking {{booking_id}} cancelled by player",
    subjectAR: "تم إلغاء الحجز {{booking_id}} من قبل اللاعب",
    bodyEN: `<h2>Booking Cancelled</h2>
<p>Dear {{provider_name}},</p>
<p>Booking <strong>{{booking_id}}</strong> has been cancelled by the player.</p>
<p>Date: {{booking_date}}<br/>Court: {{court_name}}</p>`,
    bodyAR: "",
    hasEN: true,
    hasAR: false,
    status: "Active",
    lastModified: "2026-03-05T15:45:00Z",
    modifiedBy: "Khalid Admin",
    variables: [...PROVIDER_VARS, ...BOOKING_VARS.filter(v => !COMMON_VARS.some(c => c.name === v.name))],
  },
  {
    id: "tpl-012",
    eventType: "Monthly Revenue Report",
    category: "Provider",
    subjectEN: "Your monthly revenue report — {{report_month}}",
    subjectAR: "تقرير الإيرادات الشهرية",
    bodyEN: `<h2>Monthly Revenue Report</h2>
<p>Dear {{provider_name}},</p>
<p>Here is your revenue summary for {{report_month}}:</p>
<p>Total Revenue: {{total_revenue}}<br/>Total Bookings: {{total_bookings}}<br/>Commission: {{commission_amount}}</p>`,
    bodyAR: "",
    hasEN: true,
    hasAR: false,
    status: "Inactive",
    lastModified: "2026-01-15T10:00:00Z",
    modifiedBy: "Khalid Admin",
    variables: [...PROVIDER_VARS, { name: "report_month", description: "Report month/year", sampleValue: "February 2026" }, { name: "total_revenue", description: "Total revenue (SAR)", sampleValue: "12,500.00 SAR" }, { name: "total_bookings", description: "Total number of bookings", sampleValue: "87" }, { name: "commission_amount", description: "Total commission deducted (SAR)", sampleValue: "1,250.00 SAR" }],
  },

  // ── Coach Templates ──
  {
    id: "tpl-013",
    eventType: "New Training Session Booked",
    category: "Coach",
    subjectEN: "New training session booked — {{booking_id}}",
    subjectAR: "حجز جلسة تدريب جديدة",
    bodyEN: `<h2>New Training Session</h2>
<p>Dear {{coach_name}},</p>
<p>A new training session has been booked with you:</p>
<p>Player: {{player_name}}<br/>Date: {{booking_date}}<br/>Time: {{booking_time}}</p>`,
    bodyAR: `<h2>جلسة تدريب جديدة</h2><p>عزيزي {{coach_name}},</p><p>تم حجز جلسة تدريب جديدة معك.</p>`,
    hasEN: true,
    hasAR: true,
    status: "Active",
    lastModified: "2026-03-04T12:00:00Z",
    modifiedBy: "Khalid Admin",
    variables: [...COACH_VARS, ...BOOKING_VARS.filter(v => !COMMON_VARS.some(c => c.name === v.name))],
  },
  {
    id: "tpl-014",
    eventType: "Coach Verification Approved",
    category: "Coach",
    subjectEN: "Your coach profile has been verified!",
    subjectAR: "تم التحقق من ملفك الشخصي كمدرب!",
    bodyEN: `<h2>Profile Verified</h2>
<p>Dear {{coach_name}},</p>
<p>Your coach profile on Playzoon has been verified. You are now visible to players looking for training sessions.</p>`,
    bodyAR: `<h2>تم التحقق</h2><p>عزيزي {{coach_name}},</p><p>تم التحقق من ملفك الشخصي.</p>`,
    hasEN: true,
    hasAR: true,
    status: "Active",
    lastModified: "2026-02-22T14:00:00Z",
    modifiedBy: "Sara Admin",
    variables: COACH_VARS,
  },

  // ── Admin Templates ──
  {
    id: "tpl-015",
    eventType: "Sub-Admin Account Created",
    category: "Admin",
    subjectEN: "Your admin account has been created",
    subjectAR: "تم إنشاء حساب المسؤول الخاص بك",
    bodyEN: `<h2>Admin Account Created</h2>
<p>Dear {{admin_name}},</p>
<p>An administrator account has been created for you on Playzoon Admin Panel. Please use the link below to set your password:</p>
<p><a href="{{setup_link}}">Set Password</a></p>`,
    bodyAR: "",
    hasEN: true,
    hasAR: false,
    status: "Active",
    lastModified: "2026-02-10T08:00:00Z",
    modifiedBy: "Khalid Admin",
    variables: [...ADMIN_VARS, { name: "setup_link", description: "Account setup URL", sampleValue: "https://admin.playzoon.com/setup?token=xyz789" }],
  },
  {
    id: "tpl-016",
    eventType: "System Alert Notification",
    category: "Admin",
    subjectEN: "System Alert: {{alert_type}}",
    subjectAR: "تنبيه النظام",
    bodyEN: `<h2>System Alert</h2>
<p>Dear {{admin_name}},</p>
<p>A system alert has been triggered:</p>
<p>Type: {{alert_type}}<br/>Details: {{alert_message}}<br/>Timestamp: {{alert_time}}</p>`,
    bodyAR: "",
    hasEN: true,
    hasAR: false,
    status: "Active",
    lastModified: "2026-03-01T07:00:00Z",
    modifiedBy: "Khalid Admin",
    variables: [...ADMIN_VARS, { name: "alert_type", description: "Type of system alert", sampleValue: "High Server Load" }, { name: "alert_message", description: "Alert details", sampleValue: "CPU usage exceeded 90% for 5 minutes" }, { name: "alert_time", description: "Alert timestamp", sampleValue: "March 1, 2026 07:00 AM" }],
  },
  {
    id: "tpl-017",
    eventType: "Daily Report Summary",
    category: "Admin",
    subjectEN: "Daily Platform Report — {{report_date}}",
    subjectAR: "التقرير اليومي للمنصة",
    bodyEN: `<h2>Daily Report</h2>
<p>Dear {{admin_name}},</p>
<p>Here is your daily summary for {{report_date}}:</p>
<p>New Players: {{new_players}}<br/>New Bookings: {{new_bookings}}<br/>Revenue: {{daily_revenue}}</p>`,
    bodyAR: "",
    hasEN: true,
    hasAR: false,
    status: "Inactive",
    lastModified: "2026-01-20T06:00:00Z",
    modifiedBy: "Khalid Admin",
    variables: [...ADMIN_VARS, { name: "report_date", description: "Report date", sampleValue: "March 10, 2026" }, { name: "new_players", description: "New player registrations", sampleValue: "23" }, { name: "new_bookings", description: "New bookings count", sampleValue: "156" }, { name: "daily_revenue", description: "Daily revenue (SAR)", sampleValue: "8,450.00 SAR" }],
  },

  // ── Payment Templates ──
  {
    id: "tpl-018",
    eventType: "Payment Receipt",
    category: "Payment",
    subjectEN: "Payment receipt — {{transaction_id}}",
    subjectAR: "إيصال الدفع — {{transaction_id}}",
    bodyEN: `<h2>Payment Receipt</h2>
<p>Dear {{player_name}},</p>
<p>Here is your payment receipt:</p>
<p>Transaction ID: {{transaction_id}}<br/>Amount: {{amount}}<br/>Payment Method: {{payment_method}}<br/>Date: {{payment_date}}</p>
<p>Thank you for your payment!</p>`,
    bodyAR: `<h2>إيصال الدفع</h2><p>عزيزي {{player_name}},</p><p>إليك إيصال الدفع الخاص بك.</p>`,
    hasEN: true,
    hasAR: true,
    status: "Active",
    lastModified: "2026-03-09T10:00:00Z",
    modifiedBy: "Khalid Admin",
    variables: [...PLAYER_VARS, ...PAYMENT_VARS.filter(v => !COMMON_VARS.some(c => c.name === v.name))],
  },
  {
    id: "tpl-019",
    eventType: "Refund Processed",
    category: "Payment",
    subjectEN: "Refund processed — {{amount}}",
    subjectAR: "تم معالجة الاسترداد — {{amount}}",
    bodyEN: `<h2>Refund Processed</h2>
<p>Dear {{player_name}},</p>
<p>Your refund of <strong>{{amount}}</strong> has been processed for booking {{booking_id}}.</p>
<p>The amount will be credited to your original payment method within 3-5 business days.</p>`,
    bodyAR: `<h2>تم الاسترداد</h2><p>عزيزي {{player_name}},</p><p>تم معالجة استردادك.</p>`,
    hasEN: true,
    hasAR: true,
    status: "Active",
    lastModified: "2026-03-08T16:45:00Z",
    modifiedBy: "Sara Admin",
    variables: [...PLAYER_VARS, ...PAYMENT_VARS.filter(v => !COMMON_VARS.some(c => c.name === v.name)), { name: "booking_id", description: "Related booking identifier", sampleValue: "BK-20260301-0042" }],
  },
  {
    id: "tpl-020",
    eventType: "Payout Initiated",
    category: "Payment",
    subjectEN: "Payout initiated — {{payout_amount}}",
    subjectAR: "تم بدء الدفع — {{payout_amount}}",
    bodyEN: `<h2>Payout Initiated</h2>
<p>Dear {{provider_name}},</p>
<p>A payout of <strong>{{payout_amount}}</strong> has been initiated to your bank account.</p>
<p>Payout ID: {{payout_id}}<br/>Bank: {{bank_name}}<br/>Expected Date: {{payout_date}}</p>`,
    bodyAR: `<h2>تم بدء الدفع</h2><p>عزيزي {{provider_name}},</p><p>تم بدء دفع بقيمة {{payout_amount}}.</p>`,
    hasEN: true,
    hasAR: true,
    status: "Active",
    lastModified: "2026-03-07T14:20:00Z",
    modifiedBy: "Khalid Admin",
    variables: PAYOUT_VARS,
  },
  {
    id: "tpl-021",
    eventType: "Payout Failed",
    category: "Payment",
    subjectEN: "Payout failed — Action required",
    subjectAR: "فشل الدفع — يتطلب إجراء",
    bodyEN: `<h2>Payout Failed</h2>
<p>Dear {{provider_name}},</p>
<p>We were unable to process your payout of {{payout_amount}}. Reason: {{failure_reason}}</p>
<p>Please verify your bank details and contact us at {{support_email}} if the issue persists.</p>`,
    bodyAR: "",
    hasEN: true,
    hasAR: false,
    status: "Active",
    lastModified: "2026-03-06T09:30:00Z",
    modifiedBy: "Sara Admin",
    variables: [...PAYOUT_VARS, { name: "failure_reason", description: "Reason the payout failed", sampleValue: "Invalid bank account number" }],
  },
];
