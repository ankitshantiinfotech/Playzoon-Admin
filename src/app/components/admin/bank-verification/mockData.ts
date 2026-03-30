import { BankVerification, BVDocument, BVHistoryEntry, buildMaskedIBAN } from "./types";

// ─── Helpers ─────────────────────────────────────────────────

const BASE = new Date(2026, 1, 21, 14, 0, 0); // 21 Feb 2026
function ago(h: number): Date { return new Date(BASE.getTime() - h * 3_600_000); }

function doc(name: string, type: "pdf" | "image", size: string, hoursAgo: number): BVDocument {
  return { id: `doc-${name}`, name, type, url: "#", size, uploadedAt: ago(hoursAgo) };
}

function hist(
  entries: Array<{ event: BVHistoryEntry["event"]; actor: string; h: number; reason?: string; note?: string }>
): BVHistoryEntry[] {
  return entries.map((e, i) => ({
    id: `he-${i}-${Date.now()}`,
    event: e.event,
    actor: e.actor,
    timestamp: ago(e.h),
    reason: e.reason,
    note: e.note,
  }));
}

// ─── UAE & regional IBAN pool ─────────────────────────────────
// Format: AE + 2 check + 3-digit bank code + 16-digit account = 23 chars
const IBANS = [
  "AE070331234567890123456",
  "AE140570000001234567890",
  "AE280230000001234567891",
  "AE460200000012345678901",
  "AE590370000001234567892",
  "AE620220000001234567893",
  "AE730620000001234567894",
  "AE840440000001234567895",
  "AE960880000001234567896",
  "AE071100000001234567897",
  "AE181230000001234567898",
  "AE291450000001234567899",
  "AE301670000001234567800",
  "AE411890000001234567801",
  "AE522010000001234567802",
  "AE632230000001234567803",
  "AE742450000001234567804",
  "AE852670000001234567805",
  "AE962890000001234567806",
  "AE073110000001234567807",
];

const BANKS = [
  { name: "Emirates NBD",         country: "United Arab Emirates", swift: "EBILAEAD" },
  { name: "First Abu Dhabi Bank", country: "United Arab Emirates", swift: "NBADAEAA" },
  { name: "ADCB",                 country: "United Arab Emirates", swift: "ADCBAEAA" },
  { name: "Dubai Islamic Bank",   country: "United Arab Emirates", swift: "DUIBAEADXXX" },
  { name: "Mashreq Bank",         country: "United Arab Emirates", swift: "BOMLAEAD" },
  { name: "Al Rajhi Bank",        country: "Saudi Arabia",         swift: "RJHISARI" },
  { name: "QNB",                  country: "Qatar",                swift: "QNBAQAQA" },
  { name: "NBK",                  country: "Kuwait",               swift: "NBOKKWKW" },
  { name: "Bank Muscat",          country: "Oman",                 swift: "BMUSOMRX" },
  { name: "Ahli United Bank",     country: "Bahrain",              swift: "AUBBBHBM" },
];

// ─── Mock records ─────────────────────────────────────────────

export const INITIAL_VERIFICATIONS: BankVerification[] = [

  // ──────────────────────────────────────────────
  // PENDING — 10 records
  // ──────────────────────────────────────────────

  {
    id: "BV-20260221-001",
    providerId: "PRV-1001",
    providerName: "Elite Sports Academy",
    providerType: "Training Provider",
    providerEmail: "finance@elitesports.ae",
    providerAvatar: "https://i.pravatar.cc/150?u=prv-1001",
    accountHolderName: "Elite Sports Academy LLC",
    bankName: BANKS[0].name, bankCountry: BANKS[0].country, swiftCode: BANKS[0].swift,
    ibanFull: IBANS[0], ibanMasked: buildMaskedIBAN(IBANS[0]),
    document: doc("bank_letter_elite_sports.pdf", "pdf", "1.2 MB", 1),
    status: "Pending",
    submittedAt: ago(1), reviewedAt: undefined, reviewedBy: undefined, rejectionReason: undefined,
    adminNotes: "",
    isResubmission: false,
    history: hist([
      { event: "Submitted", actor: "Elite Sports Academy (Provider)", h: 1, note: "Initial bank account submission via provider portal" },
    ]),
  },

  {
    id: "BV-20260221-002",
    providerId: "PRV-1002",
    providerName: "Desert Padel Club",
    providerType: "Facility Provider",
    providerEmail: "accounts@desertpadel.ae",
    providerAvatar: "https://i.pravatar.cc/150?u=prv-1002",
    accountHolderName: "Desert Padel Club FZCO",
    bankName: BANKS[1].name, bankCountry: BANKS[1].country, swiftCode: BANKS[1].swift,
    ibanFull: IBANS[1], ibanMasked: buildMaskedIBAN(IBANS[1]),
    document: doc("void_cheque_desert_padel.png", "image", "345 KB", 0.5),
    status: "Pending",
    submittedAt: ago(0.5), reviewedAt: undefined, reviewedBy: undefined, rejectionReason: undefined,
    adminNotes: "",
    isResubmission: false,
    history: hist([
      { event: "Submitted", actor: "Desert Padel Club (Provider)", h: 0.5 },
    ]),
  },

  {
    id: "BV-20260221-003",
    providerId: "COA-2001",
    providerName: "Coach Ahmed Hassan",
    providerType: "Freelancer Coach",
    providerEmail: "ahmed.hassan@promail.com",
    providerAvatar: "https://i.pravatar.cc/150?u=coa-2001",
    accountHolderName: "Ahmed Hassan",
    bankName: BANKS[2].name, bankCountry: BANKS[2].country, swiftCode: BANKS[2].swift,
    ibanFull: IBANS[2], ibanMasked: buildMaskedIBAN(IBANS[2]),
    document: undefined,
    status: "Pending",
    submittedAt: ago(2), reviewedAt: undefined, reviewedBy: undefined, rejectionReason: undefined,
    adminNotes: "",
    isResubmission: false,
    history: hist([
      { event: "Submitted", actor: "Coach Ahmed Hassan (Provider)", h: 2 },
    ]),
  },

  // Resubmission after BV-20260219-001 rejection
  {
    id: "BV-20260221-004",
    providerId: "COA-2002",
    providerName: "Coach Sara Khalil",
    providerType: "Freelancer Coach",
    providerEmail: "sara.k@coachpro.com",
    providerAvatar: "https://i.pravatar.cc/150?u=coa-2002",
    accountHolderName: "Sara Khalil",
    bankName: BANKS[3].name, bankCountry: BANKS[3].country, swiftCode: BANKS[3].swift,
    ibanFull: IBANS[3], ibanMasked: buildMaskedIBAN(IBANS[3]),
    document: doc("bank_statement_sara_updated.pdf", "pdf", "890 KB", 0.25),
    status: "Pending",
    submittedAt: ago(0.25), reviewedAt: undefined, reviewedBy: undefined, rejectionReason: undefined,
    adminNotes: "Resubmission received. Checking updated IBAN against new bank statement.",
    isResubmission: true,
    previousVerificationId: "BV-20260219-001",
    history: hist([
      { event: "Submitted", actor: "Coach Sara Khalil (Provider)", h: 50, note: "Initial submission" },
      { event: "Rejected",  actor: "Super Admin", h: 45, reason: "IBAN provided does not match the bank statement submitted. The account holder name on the statement differs from the registered name on the Playzoon account." },
      { event: "Submitted", actor: "Coach Sara Khalil (Provider)", h: 0.25, note: "Resubmission with corrected IBAN and updated bank statement" },
    ]),
  },

  {
    id: "BV-20260221-005",
    providerId: "PRV-1005",
    providerName: "Hoops Academy",
    providerType: "Training Provider",
    providerEmail: "finance@hoopsacademy.ae",
    providerAvatar: "https://i.pravatar.cc/150?u=prv-1005",
    accountHolderName: "Hoops Academy Sports LLC",
    bankName: BANKS[4].name, bankCountry: BANKS[4].country, swiftCode: BANKS[4].swift,
    ibanFull: IBANS[4], ibanMasked: buildMaskedIBAN(IBANS[4]),
    document: doc("trade_license_hoops.pdf", "pdf", "2.1 MB", 3),
    status: "Pending",
    submittedAt: ago(3), reviewedAt: undefined, reviewedBy: undefined, rejectionReason: undefined,
    adminNotes: "",
    isResubmission: false,
    history: hist([
      { event: "Submitted", actor: "Hoops Academy (Provider)", h: 3 },
    ]),
  },

  // Resubmission after BV-20260217-001 rejection
  {
    id: "BV-20260221-006",
    providerId: "PRV-1006",
    providerName: "Zen Studio Yoga",
    providerType: "Training Provider",
    providerEmail: "accounts@zenstudio.ae",
    providerAvatar: "https://i.pravatar.cc/150?u=prv-1006",
    accountHolderName: "Zen Studio Wellness LLC",
    bankName: BANKS[5].name, bankCountry: BANKS[5].country, swiftCode: BANKS[5].swift,
    ibanFull: IBANS[5], ibanMasked: buildMaskedIBAN(IBANS[5]),
    document: doc("zen_bank_statement_feb2026.pdf", "pdf", "1.5 MB", 1.5),
    status: "Pending",
    submittedAt: ago(1.5), reviewedAt: undefined, reviewedBy: undefined, rejectionReason: undefined,
    adminNotes: "Provider confirmed bank name change — previously with Emirates NBD, now with Al Rajhi. Validate IBAN carefully.",
    isResubmission: true,
    previousVerificationId: "BV-20260217-001",
    history: hist([
      { event: "Submitted", actor: "Zen Studio Yoga (Provider)", h: 100, note: "Initial submission" },
      { event: "Rejected",  actor: "Admin Khalid Al-Rashid", h: 96, reason: "SWIFT/BIC code does not match the bank name provided. Please ensure the details are copied directly from your online banking portal." },
      { event: "Submitted", actor: "Zen Studio Yoga (Provider)", h: 1.5, note: "Resubmission — switched banks, new details provided" },
    ]),
  },

  {
    id: "BV-20260221-007",
    providerId: "COA-2007",
    providerName: "Coach Omar Nasser",
    providerType: "Freelancer Coach",
    providerEmail: "omar.nasser@gmail.com",
    providerAvatar: "https://i.pravatar.cc/150?u=coa-2007",
    accountHolderName: "Omar Nasser",
    bankName: BANKS[6].name, bankCountry: BANKS[6].country, swiftCode: BANKS[6].swift,
    ibanFull: IBANS[6], ibanMasked: buildMaskedIBAN(IBANS[6]),
    document: doc("qnb_statement_omar.pdf", "pdf", "670 KB", 5),
    status: "Pending",
    submittedAt: ago(5), reviewedAt: undefined, reviewedBy: undefined, rejectionReason: undefined,
    adminNotes: "",
    isResubmission: false,
    history: hist([
      { event: "Submitted", actor: "Coach Omar Nasser (Provider)", h: 5 },
    ]),
  },

  {
    id: "BV-20260221-008",
    providerId: "PRV-1008",
    providerName: "Elite Padel Hub",
    providerType: "Facility Provider",
    providerEmail: "finance@elitepadel.ae",
    providerAvatar: "https://i.pravatar.cc/150?u=prv-1008",
    accountHolderName: "Elite Padel Hub LLC",
    bankName: BANKS[7].name, bankCountry: BANKS[7].country, swiftCode: BANKS[7].swift,
    ibanFull: IBANS[7], ibanMasked: buildMaskedIBAN(IBANS[7]),
    document: doc("void_cheque_elite_padel.png", "image", "512 KB", 4),
    status: "Pending",
    submittedAt: ago(4), reviewedAt: undefined, reviewedBy: undefined, rejectionReason: undefined,
    adminNotes: "",
    isResubmission: false,
    history: hist([
      { event: "Submitted", actor: "Elite Padel Hub (Provider)", h: 4 },
    ]),
  },

  {
    id: "BV-20260221-009",
    providerId: "PRV-1009",
    providerName: "Riverside Tennis Gardens",
    providerType: "Facility Provider",
    providerEmail: "accounts@riverside-tennis.ae",
    providerAvatar: "https://i.pravatar.cc/150?u=prv-1009",
    accountHolderName: "Riverside Sports Management LLC",
    bankName: BANKS[8].name, bankCountry: BANKS[8].country, swiftCode: BANKS[8].swift,
    ibanFull: IBANS[8], ibanMasked: buildMaskedIBAN(IBANS[8]),
    document: doc("riverside_bank_letter.pdf", "pdf", "2.8 MB", 6),
    status: "Pending",
    submittedAt: ago(6), reviewedAt: undefined, reviewedBy: undefined, rejectionReason: undefined,
    adminNotes: "",
    isResubmission: false,
    history: hist([
      { event: "Submitted", actor: "Riverside Tennis Gardens (Provider)", h: 6 },
    ]),
  },

  // Resubmission after BV-20260212-001 rejection
  {
    id: "BV-20260221-010",
    providerId: "COA-2010",
    providerName: "Coach David Park",
    providerType: "Freelancer Coach",
    providerEmail: "david.park@sporttrain.com",
    providerAvatar: "https://i.pravatar.cc/150?u=coa-2010",
    accountHolderName: "David Park",
    bankName: BANKS[9].name, bankCountry: BANKS[9].country, swiftCode: BANKS[9].swift,
    ibanFull: IBANS[9], ibanMasked: buildMaskedIBAN(IBANS[9]),
    document: doc("ahli_bank_statement_david.pdf", "pdf", "945 KB", 2),
    status: "Pending",
    submittedAt: ago(2), reviewedAt: undefined, reviewedBy: undefined, rejectionReason: undefined,
    adminNotes: "",
    isResubmission: true,
    previousVerificationId: "BV-20260212-001",
    history: hist([
      { event: "Submitted", actor: "Coach David Park (Provider)", h: 220, note: "Initial submission" },
      { event: "Rejected",  actor: "Admin Omar Fadel", h: 216, reason: "Account holder name on the bank statement ('D. Park') does not match the legal name registered on the platform ('David Mark Park'). Please provide a statement showing your full legal name." },
      { event: "Submitted", actor: "Coach David Park (Provider)", h: 2, note: "Resubmission with updated statement showing full legal name" },
    ]),
  },

  // ──────────────────────────────────────────────
  // APPROVED — 6 records
  // ──────────────────────────────────────────────

  {
    id: "BV-20260220-001",
    providerId: "PRV-2001",
    providerName: "Ace Tennis Club",
    providerType: "Training Provider",
    providerEmail: "finance@acetennis.ae",
    providerAvatar: "https://i.pravatar.cc/150?u=prv-2001",
    accountHolderName: "Ace Tennis Club LLC",
    bankName: BANKS[0].name, bankCountry: BANKS[0].country, swiftCode: BANKS[0].swift,
    ibanFull: IBANS[10], ibanMasked: buildMaskedIBAN(IBANS[10]),
    document: doc("ace_tennis_bank_letter.pdf", "pdf", "1.1 MB", 50),
    status: "Approved",
    submittedAt: ago(48), reviewedAt: ago(36), reviewedBy: "Super Admin",
    rejectionReason: undefined,
    adminNotes: "Verified against official bank letter. Account holder name matches trade licence. Approved.",
    isResubmission: false,
    history: hist([
      { event: "Submitted", actor: "Ace Tennis Club (Provider)", h: 48 },
      { event: "Approved",  actor: "Super Admin", h: 36, note: "Verified against official bank letter. Account holder name matches trade licence." },
    ]),
  },

  {
    id: "BV-20260220-002",
    providerId: "PRV-2002",
    providerName: "Champions Arena",
    providerType: "Facility Provider",
    providerEmail: "ops@championsarena.ae",
    providerAvatar: "https://i.pravatar.cc/150?u=prv-2002",
    accountHolderName: "Champions Arena Sports LLC",
    bankName: BANKS[1].name, bankCountry: BANKS[1].country, swiftCode: BANKS[1].swift,
    ibanFull: IBANS[11], ibanMasked: buildMaskedIBAN(IBANS[11]),
    document: doc("champions_arena_void_cheque.png", "image", "278 KB", 56),
    status: "Approved",
    submittedAt: ago(54), reviewedAt: ago(48), reviewedBy: "Admin Khalid Al-Rashid",
    rejectionReason: undefined,
    adminNotes: "Void cheque verified. IBAN cross-checked with FAB portal. Approved.",
    isResubmission: false,
    history: hist([
      { event: "Submitted", actor: "Champions Arena (Provider)", h: 54 },
      { event: "Approved",  actor: "Admin Khalid Al-Rashid", h: 48, note: "Void cheque verified. IBAN cross-checked with FAB portal." },
    ]),
  },

  {
    id: "BV-20260218-001",
    providerId: "PRV-2003",
    providerName: "Aqua Sports Complex",
    providerType: "Facility Provider",
    providerEmail: "finance@aquasports.ae",
    providerAvatar: "https://i.pravatar.cc/150?u=prv-2003",
    accountHolderName: "Aqua Sports Complex LLC",
    bankName: BANKS[2].name, bankCountry: BANKS[2].country, swiftCode: BANKS[2].swift,
    ibanFull: IBANS[12], ibanMasked: buildMaskedIBAN(IBANS[12]),
    document: doc("aqua_sports_bank_statement.pdf", "pdf", "3.4 MB", 82),
    status: "Approved",
    submittedAt: ago(80), reviewedAt: ago(72), reviewedBy: "Admin Sarah Johnson",
    rejectionReason: undefined,
    adminNotes: "",
    isResubmission: false,
    history: hist([
      { event: "Submitted", actor: "Aqua Sports Complex (Provider)", h: 80 },
      { event: "Approved",  actor: "Admin Sarah Johnson", h: 72 },
    ]),
  },

  {
    id: "BV-20260215-001",
    providerId: "PRV-2004",
    providerName: "Grand Basketball Hall",
    providerType: "Facility Provider",
    providerEmail: "accounts@grandbasketball.ae",
    providerAvatar: "https://i.pravatar.cc/150?u=prv-2004",
    accountHolderName: "Grand Sports Venues LLC",
    bankName: BANKS[3].name, bankCountry: BANKS[3].country, swiftCode: BANKS[3].swift,
    ibanFull: IBANS[13], ibanMasked: buildMaskedIBAN(IBANS[13]),
    document: doc("grand_basketball_bank_letter.pdf", "pdf", "1.8 MB", 152),
    status: "Approved",
    submittedAt: ago(150), reviewedAt: ago(144), reviewedBy: "Admin Omar Fadel",
    rejectionReason: undefined,
    adminNotes: "Large venue — prioritised verification. All documents consistent.",
    isResubmission: false,
    history: hist([
      { event: "Submitted", actor: "Grand Basketball Hall (Provider)", h: 150 },
      { event: "Approved",  actor: "Admin Omar Fadel", h: 144, note: "Large venue — prioritised verification. All documents consistent." },
    ]),
  },

  {
    id: "BV-20260214-001",
    providerId: "COA-3001",
    providerName: "Coach Lisa Ray",
    providerType: "Freelancer Coach",
    providerEmail: "lisa.ray@zencoach.com",
    providerAvatar: "https://i.pravatar.cc/150?u=coa-3001",
    accountHolderName: "Lisa Ray",
    bankName: BANKS[4].name, bankCountry: BANKS[4].country, swiftCode: BANKS[4].swift,
    ibanFull: IBANS[14], ibanMasked: buildMaskedIBAN(IBANS[14]),
    document: doc("lisa_ray_mashreq_statement.pdf", "pdf", "760 KB", 174),
    status: "Approved",
    submittedAt: ago(172), reviewedAt: ago(168), reviewedBy: "Super Admin",
    rejectionReason: undefined,
    adminNotes: "Passport copy verified separately. IBAN correct.",
    isResubmission: false,
    history: hist([
      { event: "Submitted", actor: "Coach Lisa Ray (Provider)", h: 172 },
      { event: "Approved",  actor: "Super Admin", h: 168 },
    ]),
  },

  {
    id: "BV-20260213-001",
    providerId: "PRV-2005",
    providerName: "Falcon Boxing Academy",
    providerType: "Training Provider",
    providerEmail: "ops@falconboxing.ae",
    providerAvatar: "https://i.pravatar.cc/150?u=prv-2005",
    accountHolderName: "Falcon Boxing Academy LLC",
    bankName: BANKS[5].name, bankCountry: BANKS[5].country, swiftCode: BANKS[5].swift,
    ibanFull: IBANS[15], ibanMasked: buildMaskedIBAN(IBANS[15]),
    document: doc("falcon_boxing_void_cheque.png", "image", "410 KB", 200),
    status: "Approved",
    submittedAt: ago(198), reviewedAt: ago(192), reviewedBy: "Admin Layla Abbas",
    rejectionReason: undefined,
    adminNotes: "",
    isResubmission: false,
    history: hist([
      { event: "Submitted", actor: "Falcon Boxing Academy (Provider)", h: 198 },
      { event: "Approved",  actor: "Admin Layla Abbas", h: 192 },
    ]),
  },

  // ──────────────────────────────────────────────
  // REJECTED — 4 records (pre-resubmission)
  // ──────────────────────────────────────────────

  {
    id: "BV-20260219-001",
    providerId: "COA-2002",
    providerName: "Coach Sara Khalil",
    providerType: "Freelancer Coach",
    providerEmail: "sara.k@coachpro.com",
    providerAvatar: "https://i.pravatar.cc/150?u=coa-2002",
    accountHolderName: "S. Khalil",               // Wrong — mismatched name
    bankName: BANKS[6].name, bankCountry: BANKS[6].country, swiftCode: BANKS[6].swift,
    ibanFull: IBANS[16], ibanMasked: buildMaskedIBAN(IBANS[16]),
    document: doc("sara_bank_statement_orig.pdf", "pdf", "1.3 MB", 50),
    status: "Rejected",
    submittedAt: ago(50), reviewedAt: ago(45), reviewedBy: "Super Admin",
    rejectionReason: "IBAN provided does not match the bank statement submitted. The account holder name on the statement ('S. Khalil') differs from the registered name on the Playzoon account. Please resubmit with your full legal name as it appears on your Emirates ID.",
    adminNotes: "Name mismatch. Requested provider to resubmit with full legal name matching Emirates ID.",
    isResubmission: false,
    history: hist([
      { event: "Submitted", actor: "Coach Sara Khalil (Provider)", h: 50 },
      { event: "Rejected",  actor: "Super Admin", h: 45, reason: "IBAN provided does not match the bank statement submitted. The account holder name on the statement ('S. Khalil') differs from the registered name on the Playzoon account." },
    ]),
  },

  {
    id: "BV-20260217-001",
    providerId: "PRV-1006",
    providerName: "Zen Studio Yoga",
    providerType: "Training Provider",
    providerEmail: "accounts@zenstudio.ae",
    providerAvatar: "https://i.pravatar.cc/150?u=prv-1006",
    accountHolderName: "Zen Studio Wellness LLC",
    bankName: "Emirates NBD",                     // Wrong bank for the SWIFT provided
    bankCountry: "United Arab Emirates", swiftCode: "ALRAJHI000",   // Wrong SWIFT
    ibanFull: IBANS[17], ibanMasked: buildMaskedIBAN(IBANS[17]),
    document: doc("zen_bank_statement_orig.pdf", "pdf", "980 KB", 100),
    status: "Rejected",
    submittedAt: ago(100), reviewedAt: ago(96), reviewedBy: "Admin Khalid Al-Rashid",
    rejectionReason: "SWIFT/BIC code provided (ALRAJHI000) does not match the bank name (Emirates NBD). Please ensure the details are copied directly from your online banking portal or official bank letter.",
    adminNotes: "SWIFT mismatch — possibly copy-paste error. Likely Al Rajhi SWIFT mixed with Emirates NBD name.",
    isResubmission: false,
    history: hist([
      { event: "Submitted", actor: "Zen Studio Yoga (Provider)", h: 100 },
      { event: "Rejected",  actor: "Admin Khalid Al-Rashid", h: 96, reason: "SWIFT/BIC code does not match the bank name provided." },
    ]),
  },

  {
    id: "BV-20260216-001",
    providerId: "PRV-4001",
    providerName: "Blue Water Aquatics",
    providerType: "Training Provider",
    providerEmail: "finance@bluewater.ae",
    providerAvatar: "https://i.pravatar.cc/150?u=prv-4001",
    accountHolderName: "Blue Water Sports Management",
    bankName: BANKS[7].name, bankCountry: BANKS[7].country, swiftCode: BANKS[7].swift,
    ibanFull: IBANS[18], ibanMasked: buildMaskedIBAN(IBANS[18]),
    document: undefined,    // No document submitted
    status: "Rejected",
    submittedAt: ago(124), reviewedAt: ago(120), reviewedBy: "Admin Sarah Johnson",
    rejectionReason: "No supporting document was provided. All providers are required to submit a bank statement (not older than 3 months) or a void cheque confirming the account holder name and IBAN.",
    adminNotes: "Provider was notified to resubmit with document. No resubmission received yet as of review date.",
    isResubmission: false,
    history: hist([
      { event: "Submitted", actor: "Blue Water Aquatics (Provider)", h: 124 },
      { event: "Rejected",  actor: "Admin Sarah Johnson", h: 120, reason: "No supporting document was provided." },
    ]),
  },

  {
    id: "BV-20260212-001",
    providerId: "COA-2010",
    providerName: "Coach David Park",
    providerType: "Freelancer Coach",
    providerEmail: "david.park@sporttrain.com",
    providerAvatar: "https://i.pravatar.cc/150?u=coa-2010",
    accountHolderName: "D. Park",                 // Abbreviated name
    bankName: BANKS[9].name, bankCountry: BANKS[9].country, swiftCode: BANKS[9].swift,
    ibanFull: IBANS[19], ibanMasked: buildMaskedIBAN(IBANS[19]),
    document: doc("david_park_bank_orig.pdf", "pdf", "550 KB", 222),
    status: "Rejected",
    submittedAt: ago(220), reviewedAt: ago(216), reviewedBy: "Admin Omar Fadel",
    rejectionReason: "Account holder name on the bank statement ('D. Park') does not match the legal name registered on the platform ('David Mark Park'). Please provide a bank statement clearly showing your full legal name as it appears on your passport.",
    adminNotes: "Third-party account risk. Coach must provide statement with full legal name for AML compliance.",
    isResubmission: false,
    history: hist([
      { event: "Submitted", actor: "Coach David Park (Provider)", h: 220 },
      { event: "Rejected",  actor: "Admin Omar Fadel", h: 216, reason: "Account holder name 'D. Park' does not match legal name 'David Mark Park'." },
    ]),
  },
];
