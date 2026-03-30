// ─── SCR-ADM-046: Notification Settings Configuration — Types & Mock Data ───

// ─── Notification Category ──────────────────────────────────────────────────

export type NotificationCategory =
  | "Player"
  | "Service Provider"
  | "Coach"
  | "Admin"
  | "Payment & Payout";

export const NOTIFICATION_CATEGORIES: NotificationCategory[] = [
  "Player",
  "Service Provider",
  "Coach",
  "Admin",
  "Payment & Payout",
];

export const CATEGORY_BADGE_COLORS: Record<NotificationCategory, { bg: string; text: string }> = {
  Player:              { bg: "bg-blue-100",    text: "text-blue-700" },
  "Service Provider":  { bg: "bg-amber-100",   text: "text-amber-700" },
  Coach:               { bg: "bg-emerald-100", text: "text-emerald-700" },
  Admin:               { bg: "bg-gray-100",    text: "text-gray-600" },
  "Payment & Payout":  { bg: "bg-purple-100",  text: "text-purple-700" },
};

// ─── Channel Toggles ────────────────────────────────────────────────────────

export interface ChannelToggles {
  push: boolean;
  email: boolean;
  inApp: boolean;
}

// ─── Notification Event Content ─────────────────────────────────────────────

export interface EventContent {
  titleEN: string;
  titleAR: string;
  descriptionEN: string;
  descriptionAR: string;
}

// ─── Notification Event ─────────────────────────────────────────────────────

export interface NotificationEvent {
  id: string;
  name: string;
  category: NotificationCategory;
  channels: ChannelToggles;
  content: EventContent;
  hasEmailTemplate: boolean; // Whether an email template is configured for this event
}

// ─── Mock Data ──────────────────────────────────────────────────────────────

export const MOCK_NOTIFICATION_EVENTS: NotificationEvent[] = [
  // ── Player Notifications (19 events) ──
  {
    id: "evt-p01",
    name: "Booking Confirmation",
    category: "Player",
    channels: { push: true, email: true, inApp: true },
    content: { titleEN: "Booking Confirmed", titleAR: "تم تأكيد الحجز", descriptionEN: "Your booking has been confirmed successfully.", descriptionAR: "تم تأكيد حجزك بنجاح." },
    hasEmailTemplate: true,
  },
  {
    id: "evt-p02",
    name: "Booking Cancellation",
    category: "Player",
    channels: { push: true, email: true, inApp: true },
    content: { titleEN: "Booking Cancelled", titleAR: "تم إلغاء الحجز", descriptionEN: "Your booking has been cancelled.", descriptionAR: "تم إلغاء حجزك." },
    hasEmailTemplate: true,
  },
  {
    id: "evt-p03",
    name: "Booking Reminder",
    category: "Player",
    channels: { push: true, email: true, inApp: true },
    content: { titleEN: "Booking Reminder", titleAR: "تذكير بالحجز", descriptionEN: "Your booking is coming up tomorrow.", descriptionAR: "حجزك غداً." },
    hasEmailTemplate: true,
  },
  {
    id: "evt-p04",
    name: "Booking Modification",
    category: "Player",
    channels: { push: true, email: false, inApp: true },
    content: { titleEN: "Booking Modified", titleAR: "تم تعديل الحجز", descriptionEN: "Your booking details have been updated.", descriptionAR: "تم تحديث تفاصيل حجزك." },
    hasEmailTemplate: false,
  },
  {
    id: "evt-p05",
    name: "Payment Successful",
    category: "Player",
    channels: { push: true, email: true, inApp: true },
    content: { titleEN: "Payment Successful", titleAR: "تم الدفع بنجاح", descriptionEN: "Your payment has been processed.", descriptionAR: "تم معالجة دفعتك." },
    hasEmailTemplate: true,
  },
  {
    id: "evt-p06",
    name: "Refund Processed",
    category: "Player",
    channels: { push: true, email: true, inApp: true },
    content: { titleEN: "Refund Processed", titleAR: "تم الاسترداد", descriptionEN: "Your refund has been processed.", descriptionAR: "تم معالجة استردادك." },
    hasEmailTemplate: true,
  },
  {
    id: "evt-p07",
    name: "Welcome Email",
    category: "Player",
    channels: { push: false, email: true, inApp: true },
    content: { titleEN: "Welcome to Playzoon", titleAR: "مرحباً بك في بلازون", descriptionEN: "Welcome to the platform!", descriptionAR: "مرحباً بك في المنصة!" },
    hasEmailTemplate: true,
  },
  {
    id: "evt-p08",
    name: "Password Reset",
    category: "Player",
    channels: { push: false, email: true, inApp: false },
    content: { titleEN: "Password Reset", titleAR: "إعادة تعيين كلمة المرور", descriptionEN: "Reset your password.", descriptionAR: "إعادة تعيين كلمة المرور." },
    hasEmailTemplate: true,
  },
  {
    id: "evt-p09",
    name: "Wallet Top-Up",
    category: "Player",
    channels: { push: true, email: true, inApp: true },
    content: { titleEN: "Wallet Top-Up", titleAR: "شحن المحفظة", descriptionEN: "Your wallet has been topped up.", descriptionAR: "تم شحن محفظتك." },
    hasEmailTemplate: true,
  },
  {
    id: "evt-p10",
    name: "Review Request",
    category: "Player",
    channels: { push: true, email: false, inApp: true },
    content: { titleEN: "Rate Your Experience", titleAR: "قيم تجربتك", descriptionEN: "Share your feedback.", descriptionAR: "شاركنا رأيك." },
    hasEmailTemplate: true,
  },
  {
    id: "evt-p11",
    name: "Friend Invitation Accepted",
    category: "Player",
    channels: { push: true, email: false, inApp: true },
    content: { titleEN: "Friend Joined!", titleAR: "انضم صديقك!", descriptionEN: "Your friend has joined Playzoon.", descriptionAR: "انضم صديقك إلى بلازون." },
    hasEmailTemplate: false,
  },
  {
    id: "evt-p12",
    name: "New Message Received",
    category: "Player",
    channels: { push: true, email: false, inApp: true },
    content: { titleEN: "New Message", titleAR: "رسالة جديدة", descriptionEN: "You have a new message.", descriptionAR: "لديك رسالة جديدة." },
    hasEmailTemplate: false,
  },
  {
    id: "evt-p13",
    name: "Promotion Available",
    category: "Player",
    channels: { push: true, email: false, inApp: true },
    content: { titleEN: "Special Offer", titleAR: "عرض خاص", descriptionEN: "A new promotion is available.", descriptionAR: "عرض جديد متاح." },
    hasEmailTemplate: false,
  },
  {
    id: "evt-p14",
    name: "Favourite Facility Update",
    category: "Player",
    channels: { push: true, email: false, inApp: true },
    content: { titleEN: "Facility Update", titleAR: "تحديث المنشأة", descriptionEN: "A favourited facility has new updates.", descriptionAR: "تحديثات جديدة من منشأة مفضلة." },
    hasEmailTemplate: false,
  },
  {
    id: "evt-p15",
    name: "Tournament Invitation",
    category: "Player",
    channels: { push: true, email: true, inApp: true },
    content: { titleEN: "Tournament Invitation", titleAR: "دعوة للبطولة", descriptionEN: "You have been invited to a tournament.", descriptionAR: "تمت دعوتك للمشاركة في بطولة." },
    hasEmailTemplate: false,
  },
  {
    id: "evt-p16",
    name: "Tournament Result",
    category: "Player",
    channels: { push: true, email: false, inApp: true },
    content: { titleEN: "Tournament Results", titleAR: "نتائج البطولة", descriptionEN: "Tournament results are now available.", descriptionAR: "نتائج البطولة متاحة الآن." },
    hasEmailTemplate: false,
  },
  {
    id: "evt-p17",
    name: "Account Verification",
    category: "Player",
    channels: { push: false, email: true, inApp: false },
    content: { titleEN: "Verify Your Account", titleAR: "تحقق من حسابك", descriptionEN: "Please verify your email address.", descriptionAR: "يرجى التحقق من بريدك الإلكتروني." },
    hasEmailTemplate: true,
  },
  {
    id: "evt-p18",
    name: "Account Suspended",
    category: "Player",
    channels: { push: false, email: true, inApp: true },
    content: { titleEN: "Account Suspended", titleAR: "تم تعليق الحساب", descriptionEN: "Your account has been suspended.", descriptionAR: "تم تعليق حسابك." },
    hasEmailTemplate: true,
  },
  {
    id: "evt-p19",
    name: "Training Session Reminder",
    category: "Player",
    channels: { push: true, email: false, inApp: true },
    content: { titleEN: "Training Reminder", titleAR: "تذكير بالتدريب", descriptionEN: "Your training session is tomorrow.", descriptionAR: "جلسة التدريب غداً." },
    hasEmailTemplate: false,
  },

  // ── Service Provider Notifications (20 events) ──
  {
    id: "evt-sp01",
    name: "New Booking Received",
    category: "Service Provider",
    channels: { push: true, email: true, inApp: true },
    content: { titleEN: "New Booking", titleAR: "حجز جديد", descriptionEN: "A new booking has been received.", descriptionAR: "تم استلام حجز جديد." },
    hasEmailTemplate: true,
  },
  {
    id: "evt-sp02",
    name: "Booking Cancelled by Player",
    category: "Service Provider",
    channels: { push: true, email: true, inApp: true },
    content: { titleEN: "Booking Cancelled", titleAR: "تم إلغاء الحجز", descriptionEN: "A booking has been cancelled by the player.", descriptionAR: "تم إلغاء الحجز من قبل اللاعب." },
    hasEmailTemplate: true,
  },
  {
    id: "evt-sp03",
    name: "Registration Approved",
    category: "Service Provider",
    channels: { push: true, email: true, inApp: true },
    content: { titleEN: "Registration Approved", titleAR: "تمت الموافقة على التسجيل", descriptionEN: "Your registration has been approved.", descriptionAR: "تمت الموافقة على تسجيلك." },
    hasEmailTemplate: true,
  },
  {
    id: "evt-sp04",
    name: "Registration Rejected",
    category: "Service Provider",
    channels: { push: true, email: true, inApp: true },
    content: { titleEN: "Registration Rejected", titleAR: "تم رفض التسجيل", descriptionEN: "Your registration has been rejected.", descriptionAR: "تم رفض تسجيلك." },
    hasEmailTemplate: true,
  },
  {
    id: "evt-sp05",
    name: "Payout Initiated",
    category: "Service Provider",
    channels: { push: true, email: true, inApp: true },
    content: { titleEN: "Payout Initiated", titleAR: "تم بدء الدفع", descriptionEN: "A payout has been initiated.", descriptionAR: "تم بدء عملية الدفع." },
    hasEmailTemplate: true,
  },
  {
    id: "evt-sp06",
    name: "Payout Completed",
    category: "Service Provider",
    channels: { push: true, email: true, inApp: true },
    content: { titleEN: "Payout Completed", titleAR: "تم إتمام الدفع", descriptionEN: "Your payout has been completed.", descriptionAR: "تم إتمام الدفع الخاص بك." },
    hasEmailTemplate: true,
  },
  {
    id: "evt-sp07",
    name: "Payout Failed",
    category: "Service Provider",
    channels: { push: true, email: true, inApp: true },
    content: { titleEN: "Payout Failed", titleAR: "فشل الدفع", descriptionEN: "Your payout has failed.", descriptionAR: "فشلت عملية الدفع." },
    hasEmailTemplate: true,
  },
  {
    id: "evt-sp08",
    name: "New Review Received",
    category: "Service Provider",
    channels: { push: true, email: false, inApp: true },
    content: { titleEN: "New Review", titleAR: "مراجعة جديدة", descriptionEN: "A new review has been posted.", descriptionAR: "تم نشر مراجعة جديدة." },
    hasEmailTemplate: false,
  },
  {
    id: "evt-sp09",
    name: "Listing Approved",
    category: "Service Provider",
    channels: { push: true, email: true, inApp: true },
    content: { titleEN: "Listing Approved", titleAR: "تمت الموافقة على القائمة", descriptionEN: "Your listing has been approved.", descriptionAR: "تمت الموافقة على قائمتك." },
    hasEmailTemplate: false,
  },
  {
    id: "evt-sp10",
    name: "Listing Rejected",
    category: "Service Provider",
    channels: { push: true, email: true, inApp: true },
    content: { titleEN: "Listing Rejected", titleAR: "تم رفض القائمة", descriptionEN: "Your listing has been rejected.", descriptionAR: "تم رفض قائمتك." },
    hasEmailTemplate: false,
  },
  {
    id: "evt-sp11",
    name: "Monthly Revenue Report",
    category: "Service Provider",
    channels: { push: false, email: true, inApp: true },
    content: { titleEN: "Monthly Report", titleAR: "التقرير الشهري", descriptionEN: "Your monthly revenue report is ready.", descriptionAR: "تقريرك الشهري جاهز." },
    hasEmailTemplate: true,
  },
  {
    id: "evt-sp12",
    name: "Bank Account Verified",
    category: "Service Provider",
    channels: { push: true, email: true, inApp: true },
    content: { titleEN: "Bank Verified", titleAR: "تم التحقق من البنك", descriptionEN: "Your bank account has been verified.", descriptionAR: "تم التحقق من حسابك البنكي." },
    hasEmailTemplate: false,
  },
  {
    id: "evt-sp13",
    name: "Bank Verification Failed",
    category: "Service Provider",
    channels: { push: true, email: true, inApp: true },
    content: { titleEN: "Bank Verification Failed", titleAR: "فشل التحقق من البنك", descriptionEN: "Bank account verification has failed.", descriptionAR: "فشل التحقق من الحساب البنكي." },
    hasEmailTemplate: false,
  },
  {
    id: "evt-sp14",
    name: "Commission Rate Changed",
    category: "Service Provider",
    channels: { push: false, email: true, inApp: true },
    content: { titleEN: "Commission Update", titleAR: "تحديث العمولة", descriptionEN: "Your commission rate has been updated.", descriptionAR: "تم تحديث نسبة عمولتك." },
    hasEmailTemplate: false,
  },
  {
    id: "evt-sp15",
    name: "New Chat Message",
    category: "Service Provider",
    channels: { push: true, email: false, inApp: true },
    content: { titleEN: "New Message", titleAR: "رسالة جديدة", descriptionEN: "You have a new chat message.", descriptionAR: "لديك رسالة دردشة جديدة." },
    hasEmailTemplate: false,
  },
  {
    id: "evt-sp16",
    name: "Slot Availability Alert",
    category: "Service Provider",
    channels: { push: true, email: false, inApp: true },
    content: { titleEN: "Low Availability", titleAR: "توفر منخفض", descriptionEN: "Some slots are running low.", descriptionAR: "بعض الفترات متاحة بشكل محدود." },
    hasEmailTemplate: false,
  },
  {
    id: "evt-sp17",
    name: "Subscription Renewal",
    category: "Service Provider",
    channels: { push: true, email: true, inApp: true },
    content: { titleEN: "Subscription Renewal", titleAR: "تجديد الاشتراك", descriptionEN: "Your subscription is up for renewal.", descriptionAR: "اشتراكك يحتاج للتجديد." },
    hasEmailTemplate: false,
  },
  {
    id: "evt-sp18",
    name: "Account Suspended",
    category: "Service Provider",
    channels: { push: false, email: true, inApp: true },
    content: { titleEN: "Account Suspended", titleAR: "تم تعليق الحساب", descriptionEN: "Your account has been suspended.", descriptionAR: "تم تعليق حسابك." },
    hasEmailTemplate: true,
  },
  {
    id: "evt-sp19",
    name: "Promotion Expiring",
    category: "Service Provider",
    channels: { push: true, email: false, inApp: true },
    content: { titleEN: "Promotion Expiring", titleAR: "العرض ينتهي قريباً", descriptionEN: "Your promoted listing is expiring soon.", descriptionAR: "قائمتك المروجة تنتهي قريباً." },
    hasEmailTemplate: false,
  },
  {
    id: "evt-sp20",
    name: "Daily Summary",
    category: "Service Provider",
    channels: { push: false, email: true, inApp: false },
    content: { titleEN: "Daily Summary", titleAR: "ملخص يومي", descriptionEN: "Your daily activity summary is ready.", descriptionAR: "ملخص نشاطك اليومي جاهز." },
    hasEmailTemplate: false,
  },

  // ── Coach-Specific Notifications (2 events) ──
  {
    id: "evt-c01",
    name: "New Training Session Booked",
    category: "Coach",
    channels: { push: true, email: true, inApp: true },
    content: { titleEN: "New Training Session", titleAR: "جلسة تدريب جديدة", descriptionEN: "A new training session has been booked.", descriptionAR: "تم حجز جلسة تدريب جديدة." },
    hasEmailTemplate: true,
  },
  {
    id: "evt-c02",
    name: "Coach Verification Approved",
    category: "Coach",
    channels: { push: true, email: true, inApp: true },
    content: { titleEN: "Verification Approved", titleAR: "تمت الموافقة على التحقق", descriptionEN: "Your coach profile has been verified.", descriptionAR: "تم التحقق من ملفك الشخصي كمدرب." },
    hasEmailTemplate: true,
  },

  // ── Admin Notifications (16 events) ──
  {
    id: "evt-a01",
    name: "New Provider Registration",
    category: "Admin",
    channels: { push: true, email: true, inApp: true },
    content: { titleEN: "New Provider", titleAR: "مزود جديد", descriptionEN: "A new provider has registered.", descriptionAR: "تم تسجيل مزود خدمة جديد." },
    hasEmailTemplate: false,
  },
  {
    id: "evt-a02",
    name: "New Player Registration",
    category: "Admin",
    channels: { push: false, email: false, inApp: true },
    content: { titleEN: "New Player", titleAR: "لاعب جديد", descriptionEN: "A new player has registered.", descriptionAR: "تم تسجيل لاعب جديد." },
    hasEmailTemplate: false,
  },
  {
    id: "evt-a03",
    name: "Payment Dispute",
    category: "Admin",
    channels: { push: true, email: true, inApp: true },
    content: { titleEN: "Payment Dispute", titleAR: "نزاع في الدفع", descriptionEN: "A payment dispute has been raised.", descriptionAR: "تم رفع نزاع في الدفع." },
    hasEmailTemplate: false,
  },
  {
    id: "evt-a04",
    name: "System Alert",
    category: "Admin",
    channels: { push: true, email: true, inApp: true },
    content: { titleEN: "System Alert", titleAR: "تنبيه النظام", descriptionEN: "A system alert has been triggered.", descriptionAR: "تم تفعيل تنبيه النظام." },
    hasEmailTemplate: true,
  },
  {
    id: "evt-a05",
    name: "Daily Report Summary",
    category: "Admin",
    channels: { push: false, email: true, inApp: false },
    content: { titleEN: "Daily Report", titleAR: "التقرير اليومي", descriptionEN: "Daily platform report is ready.", descriptionAR: "التقرير اليومي للمنصة جاهز." },
    hasEmailTemplate: true,
  },
  {
    id: "evt-a06",
    name: "Payout Processing Complete",
    category: "Admin",
    channels: { push: true, email: true, inApp: true },
    content: { titleEN: "Payouts Processed", titleAR: "تم معالجة الدفعات", descriptionEN: "Payout batch processing is complete.", descriptionAR: "تم الانتهاء من معالجة دفعة الدفعات." },
    hasEmailTemplate: false,
  },
  {
    id: "evt-a07",
    name: "New Enquiry Received",
    category: "Admin",
    channels: { push: true, email: false, inApp: true },
    content: { titleEN: "New Enquiry", titleAR: "استفسار جديد", descriptionEN: "A new enquiry has been received.", descriptionAR: "تم استلام استفسار جديد." },
    hasEmailTemplate: false,
  },
  {
    id: "evt-a08",
    name: "Negative Review Alert",
    category: "Admin",
    channels: { push: true, email: false, inApp: true },
    content: { titleEN: "Negative Review", titleAR: "مراجعة سلبية", descriptionEN: "A negative review (1-2 stars) was posted.", descriptionAR: "تم نشر مراجعة سلبية." },
    hasEmailTemplate: false,
  },
  {
    id: "evt-a09",
    name: "KYB Document Submitted",
    category: "Admin",
    channels: { push: true, email: false, inApp: true },
    content: { titleEN: "KYB Document", titleAR: "وثيقة KYB", descriptionEN: "A provider submitted KYB documents.", descriptionAR: "قدم مزود خدمة وثائق KYB." },
    hasEmailTemplate: false,
  },
  {
    id: "evt-a10",
    name: "Sub-Admin Account Created",
    category: "Admin",
    channels: { push: false, email: true, inApp: true },
    content: { titleEN: "Sub-Admin Created", titleAR: "تم إنشاء مسؤول فرعي", descriptionEN: "A new sub-admin account was created.", descriptionAR: "تم إنشاء حساب مسؤول فرعي جديد." },
    hasEmailTemplate: true,
  },
  {
    id: "evt-a11",
    name: "High Revenue Alert",
    category: "Admin",
    channels: { push: true, email: false, inApp: true },
    content: { titleEN: "Revenue Alert", titleAR: "تنبيه الإيرادات", descriptionEN: "Daily revenue exceeded threshold.", descriptionAR: "تجاوزت الإيرادات اليومية الحد المحدد." },
    hasEmailTemplate: false,
  },
  {
    id: "evt-a12",
    name: "Low Booking Alert",
    category: "Admin",
    channels: { push: true, email: false, inApp: true },
    content: { titleEN: "Low Bookings", titleAR: "حجوزات منخفضة", descriptionEN: "Booking volume is below average.", descriptionAR: "حجم الحجوزات أقل من المتوسط." },
    hasEmailTemplate: false,
  },
  {
    id: "evt-a13",
    name: "Failed Payment Alert",
    category: "Admin",
    channels: { push: true, email: true, inApp: true },
    content: { titleEN: "Failed Payments", titleAR: "دفعات فاشلة", descriptionEN: "Multiple payment failures detected.", descriptionAR: "تم اكتشاف فشل متعدد في الدفعات." },
    hasEmailTemplate: false,
  },
  {
    id: "evt-a14",
    name: "Cancellation Policy Override",
    category: "Admin",
    channels: { push: false, email: false, inApp: true },
    content: { titleEN: "Policy Override", titleAR: "تجاوز السياسة", descriptionEN: "A cancellation policy was overridden.", descriptionAR: "تم تجاوز سياسة الإلغاء." },
    hasEmailTemplate: false,
  },
  {
    id: "evt-a15",
    name: "Scheduled Maintenance",
    category: "Admin",
    channels: { push: true, email: true, inApp: true },
    content: { titleEN: "Maintenance", titleAR: "صيانة", descriptionEN: "Scheduled maintenance is upcoming.", descriptionAR: "صيانة مجدولة قادمة." },
    hasEmailTemplate: false,
  },
  {
    id: "evt-a16",
    name: "Security Alert",
    category: "Admin",
    channels: { push: true, email: true, inApp: true },
    content: { titleEN: "Security Alert", titleAR: "تنبيه أمني", descriptionEN: "A security issue has been detected.", descriptionAR: "تم اكتشاف مشكلة أمنية." },
    hasEmailTemplate: false,
  },

  // ── Payment & Payout Notifications (8 events) ──
  {
    id: "evt-pp01",
    name: "Payment Receipt",
    category: "Payment & Payout",
    channels: { push: true, email: true, inApp: true },
    content: { titleEN: "Payment Receipt", titleAR: "إيصال الدفع", descriptionEN: "Payment receipt for your transaction.", descriptionAR: "إيصال الدفع لمعاملتك." },
    hasEmailTemplate: true,
  },
  {
    id: "evt-pp02",
    name: "Refund Processed",
    category: "Payment & Payout",
    channels: { push: true, email: true, inApp: true },
    content: { titleEN: "Refund Processed", titleAR: "تم معالجة الاسترداد", descriptionEN: "Your refund has been processed.", descriptionAR: "تم معالجة استردادك." },
    hasEmailTemplate: true,
  },
  {
    id: "evt-pp03",
    name: "Payout Initiated",
    category: "Payment & Payout",
    channels: { push: true, email: true, inApp: true },
    content: { titleEN: "Payout Initiated", titleAR: "تم بدء الدفع", descriptionEN: "Payout has been initiated.", descriptionAR: "تم بدء عملية الدفع." },
    hasEmailTemplate: true,
  },
  {
    id: "evt-pp04",
    name: "Payout Completed",
    category: "Payment & Payout",
    channels: { push: true, email: true, inApp: true },
    content: { titleEN: "Payout Completed", titleAR: "تم إتمام الدفع", descriptionEN: "Payout has been completed.", descriptionAR: "تم إتمام عملية الدفع." },
    hasEmailTemplate: true,
  },
  {
    id: "evt-pp05",
    name: "Payout Failed",
    category: "Payment & Payout",
    channels: { push: true, email: true, inApp: true },
    content: { titleEN: "Payout Failed", titleAR: "فشل الدفع", descriptionEN: "Payout has failed.", descriptionAR: "فشلت عملية الدفع." },
    hasEmailTemplate: true,
  },
  {
    id: "evt-pp06",
    name: "Invoice Generated",
    category: "Payment & Payout",
    channels: { push: false, email: true, inApp: true },
    content: { titleEN: "Invoice Generated", titleAR: "تم إنشاء الفاتورة", descriptionEN: "A new invoice has been generated.", descriptionAR: "تم إنشاء فاتورة جديدة." },
    hasEmailTemplate: false,
  },
  {
    id: "evt-pp07",
    name: "Payment Method Expiring",
    category: "Payment & Payout",
    channels: { push: true, email: true, inApp: true },
    content: { titleEN: "Payment Method Expiring", titleAR: "طريقة الدفع تنتهي", descriptionEN: "Your payment method is expiring soon.", descriptionAR: "طريقة الدفع تنتهي قريباً." },
    hasEmailTemplate: false,
  },
  {
    id: "evt-pp08",
    name: "Commission Deducted",
    category: "Payment & Payout",
    channels: { push: false, email: false, inApp: true },
    content: { titleEN: "Commission Deducted", titleAR: "تم خصم العمولة", descriptionEN: "Commission has been deducted.", descriptionAR: "تم خصم العمولة." },
    hasEmailTemplate: false,
  },
];
