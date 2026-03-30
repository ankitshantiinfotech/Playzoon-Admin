import { Listing, ListingStatus, SportType, ListingType } from "./types";
import { subDays, addDays, format } from "date-fns";

const CITIES = ["Dubai", "Abu Dhabi", "Sharjah", "Riyadh", "Doha", "Kuwait City", "Muscat", "Manama", "Jeddah", "Cairo"];
const ADMIN_NAMES = ["Super Admin", "Admin Rania", "Admin Faisal"];
const PLAYER_NAMES = [
  "Ahmed Al-Rashid", "Sara Hassan", "Omar Khalid", "Fatima Al-Mansouri",
  "Khalid Ibrahim", "Nour Saleh", "Tariq Al-Farsi", "Layla Mohamed",
  "Youssef Ali", "Hana Kassem",
];

const TRAINING_THUMBNAILS = [
  "https://images.unsplash.com/photo-1544367563-12123d8965cd?auto=format&fit=crop&w=400&h=260&q=80",
  "https://images.unsplash.com/photo-1579952363873-27f3bde9be2e?auto=format&fit=crop&w=400&h=260&q=80",
  "https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?auto=format&fit=crop&w=400&h=260&q=80",
  "https://images.unsplash.com/photo-1530549387789-4c1017266635?auto=format&fit=crop&w=400&h=260&q=80",
  "https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=400&h=260&q=80",
  "https://images.unsplash.com/photo-1551698618-1dfe5d97d256?auto=format&fit=crop&w=400&h=260&q=80",
  "https://images.unsplash.com/photo-1576678927484-cc907957088c?auto=format&fit=crop&w=400&h=260&q=80",
];

const FACILITY_THUMBNAILS = [
  "https://images.unsplash.com/photo-1571902943202-507ec2618e8f?auto=format&fit=crop&w=400&h=260&q=80",
  "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=400&h=260&q=80",
  "https://images.unsplash.com/photo-1504025468847-0e438279542c?auto=format&fit=crop&w=400&h=260&q=80",
  "https://images.unsplash.com/photo-1520877880798-5ee004e3f11e?auto=format&fit=crop&w=400&h=260&q=80",
  "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=400&h=260&q=80",
  "https://images.unsplash.com/photo-1575052814086-f385e2e2ad1b?auto=format&fit=crop&w=400&h=260&q=80",
];

const TRAINING_CONFIGS: { name: string; sport: SportType; level: string }[] = [
  { name: "Advanced Padel Masterclass", sport: "Padel", level: "Advanced" },
  { name: "Beginner Tennis Fundamentals", sport: "Tennis", level: "Beginner" },
  { name: "Youth Football Academy", sport: "Football", level: "Beginner" },
  { name: "Competitive Badminton Training", sport: "Badminton", level: "Intermediate" },
  { name: "Yoga & Mindfulness Program", sport: "Yoga", level: "All Levels" },
  { name: "Elite Swimming Coaching", sport: "Swimming", level: "Advanced" },
  { name: "Basketball Fundamentals Camp", sport: "Basketball", level: "Beginner" },
  { name: "Pickleball Beginner Course", sport: "Pickleball", level: "Beginner" },
  { name: "Pro Squash Conditioning", sport: "Squash", level: "Pro" },
  { name: "Cricket Batting Clinic", sport: "Cricket", level: "Intermediate" },
  { name: "Boxing Fitness & Defense", sport: "Boxing", level: "Intermediate" },
  { name: "Intermediate Padel Tactics", sport: "Padel", level: "Intermediate" },
  { name: "Open Tennis Weekend Camp", sport: "Tennis", level: "Open" },
  { name: "Community Football Training", sport: "Football", level: "Beginner" },
  { name: "Swim Stroke Correction", sport: "Swimming", level: "Intermediate" },
];

const FACILITY_CONFIGS: { name: string; sport: SportType; type: "Indoor" | "Outdoor" | "Hybrid"; courts: number }[] = [
  { name: "Elite Padel Hub", sport: "Padel", type: "Outdoor", courts: 8 },
  { name: "Central Tennis Club", sport: "Tennis", type: "Outdoor", courts: 12 },
  { name: "Champions Arena", sport: "Football", type: "Indoor", courts: 3 },
  { name: "AceBadminton Centre", sport: "Badminton", type: "Indoor", courts: 10 },
  { name: "Aqua Sports Complex", sport: "Swimming", type: "Indoor", courts: 2 },
  { name: "Premier Squash Club", sport: "Squash", type: "Indoor", courts: 6 },
  { name: "Pickleball Paradise", sport: "Pickleball", type: "Outdoor", courts: 4 },
  { name: "Grand Basketball Hall", sport: "Basketball", type: "Indoor", courts: 2 },
  { name: "Sunset Cricket Ground", sport: "Cricket", type: "Outdoor", courts: 1 },
  { name: "Iron Fist Boxing Gym", sport: "Boxing", type: "Indoor", courts: 1 },
  { name: "Hybrid Sports Dome", sport: "Padel", type: "Hybrid", courts: 14 },
  { name: "Riverside Tennis Gardens", sport: "Tennis", type: "Outdoor", courts: 6 },
  { name: "Metro Badminton Sports Centre", sport: "Badminton", type: "Indoor", courts: 8 },
  { name: "Royal Squash Academy", sport: "Squash", type: "Indoor", courts: 4 },
  { name: "Urban Play Football Fields", sport: "Football", type: "Outdoor", courts: 2 },
];

const PROVIDER_NAMES = [
  "Al-Rashid Sports Academy", "Elite Play Co.", "Gulf Athletics Hub",
  "Desert Sports Management", "Pro Arena LLC", "Falcon Training Group",
  "Sunrise Sports Center", "Champions League Academy", "Pearl Sports Club",
  "Gold Medal Facilities", "Crescent Sports Management", "Vision Sports",
  "Oasis Athletics", "Skyline Sports Hub", "Summit Play",
];

const STATUSES: ListingStatus[] = ["Active", "Active", "Active", "Active", "Inactive", "Suspended", "Removed"];

function generateFutureBookings(count: number, amount: number, removed = false): any[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `bk-${i}`,
    playerName: PLAYER_NAMES[i % PLAYER_NAMES.length],
    date: addDays(new Date(), i + 1).toISOString(),
    amount,
    refunded: removed,
  }));
}

export function generateMockListings(): Listing[] {
  const listings: Listing[] = [];

  // ─── Training Listings ───
  TRAINING_CONFIGS.forEach((cfg, i) => {
    const city = CITIES[i % CITIES.length];
    const status = STATUSES[i % STATUSES.length];
    const createdAt = subDays(new Date(), 90 + i * 3).toISOString();
    const bookingCount = status === "Removed" ? 0 : [0, 2, 4, 6, 8, 10, 3][i % 7];
    const entryFee = [30, 40, 50, 60, 25, 75, 35][i % 7];

    const auditLog: any[] = [
      { id: `al-T${i}-0`, action: "Created", adminName: "System", timestamp: createdAt },
    ];
    if (status === "Suspended") {
      auditLog.push({ id: `al-T${i}-1`, action: "Suspended", adminName: ADMIN_NAMES[i % 3], timestamp: subDays(new Date(), 5).toISOString(), reason: "Policy violation reported by multiple users." });
    }
    if (status === "Removed") {
      auditLog.push({ id: `al-T${i}-2`, action: "Removed", adminName: ADMIN_NAMES[i % 3], timestamp: subDays(new Date(), 2).toISOString(), reason: "Provider verified as fraudulent." });
    }

    listings.push({
      id: `TRN-LST-${1000 + i}`,
      type: "Training",
      name: cfg.name,
      thumbnailUrl: TRAINING_THUMBNAILS[i % TRAINING_THUMBNAILS.length],
      provider: {
        id: `prov-T-${i}`,
        name: PROVIDER_NAMES[i % PROVIDER_NAMES.length],
        email: `contact@${PROVIDER_NAMES[i % PROVIDER_NAMES.length].toLowerCase().replace(/ /g, "")}.com`,
        phone: `+971 5${Math.floor(10000000 + i * 31337) % 90000000 + 10000000}`,
        avatar: `https://i.pravatar.cc/150?u=prov-T-${i}`,
      },
      sport: cfg.sport,
      city,
      status,
      activeBookingsCount: bookingCount,
      futureBookings: generateFutureBookings(bookingCount, entryFee, status === "Removed"),
      rating: status === "Removed" ? 0 : parseFloat((3.5 + (i % 15) * 0.1).toFixed(1)),
      reviewCount: status === "Removed" ? 0 : i * 3 + 2,
      description: `Professional ${cfg.sport} training program for ${cfg.level} players, delivered by certified coaches in ${city}.`,
      level: cfg.level,
      enrolledCount: status === "Removed" ? 0 : (i + 1) * 6,
      batchCount: [1, 2, 3, 4][i % 4],
      suspendedReason: status === "Suspended" ? "Policy violation reported by multiple users." : undefined,
      suspendedAt: status === "Suspended" ? subDays(new Date(), 5).toISOString() : undefined,
      removedReason: status === "Removed" ? "Provider verified as fraudulent." : undefined,
      removedAt: status === "Removed" ? subDays(new Date(), 2).toISOString() : undefined,
      auditLog,
      createdAt,
    });
  });

  // ─── Facility Listings ───
  FACILITY_CONFIGS.forEach((cfg, i) => {
    const city = CITIES[(i + 2) % CITIES.length];
    const status = STATUSES[(i + 2) % STATUSES.length];
    const createdAt = subDays(new Date(), 120 + i * 4).toISOString();
    const bookingCount = status === "Removed" ? 0 : [0, 1, 3, 5, 7, 10, 2][i % 7];
    const entryFee = [50, 80, 100, 60, 120, 45, 90][i % 7];

    const auditLog: any[] = [
      { id: `al-F${i}-0`, action: "Created", adminName: "System", timestamp: createdAt },
    ];
    if (status === "Suspended") {
      auditLog.push({ id: `al-F${i}-1`, action: "Suspended", adminName: ADMIN_NAMES[(i + 1) % 3], timestamp: subDays(new Date(), 7).toISOString(), reason: "Facility safety certificate expired." });
    }
    if (status === "Removed") {
      auditLog.push({ id: `al-F${i}-2`, action: "Removed", adminName: ADMIN_NAMES[(i + 1) % 3], timestamp: subDays(new Date(), 3).toISOString(), reason: "Repeated safety violations. Permanent removal." });
    }

    listings.push({
      id: `FAC-LST-${2000 + i}`,
      type: "Facility",
      name: cfg.name,
      thumbnailUrl: FACILITY_THUMBNAILS[i % FACILITY_THUMBNAILS.length],
      provider: {
        id: `prov-F-${i}`,
        name: PROVIDER_NAMES[(i + 5) % PROVIDER_NAMES.length],
        email: `info@${cfg.name.toLowerCase().replace(/ /g, "")}.com`,
        phone: `+971 4${Math.floor(1000000 + i * 71331) % 9000000 + 1000000}`,
        avatar: `https://i.pravatar.cc/150?u=prov-F-${i}`,
      },
      sport: cfg.sport,
      city,
      status,
      activeBookingsCount: bookingCount,
      futureBookings: generateFutureBookings(bookingCount, entryFee, status === "Removed"),
      rating: status === "Removed" ? 0 : parseFloat((3.8 + (i % 12) * 0.1).toFixed(1)),
      reviewCount: status === "Removed" ? 0 : i * 4 + 5,
      description: `${cfg.type} ${cfg.sport} facility with ${cfg.courts} court${cfg.courts > 1 ? "s" : ""} located in ${city}. Professional-grade equipment and amenities.`,
      facilityType: cfg.type,
      courtsCount: cfg.courts,
      suspendedReason: status === "Suspended" ? "Facility safety certificate expired." : undefined,
      suspendedAt: status === "Suspended" ? subDays(new Date(), 7).toISOString() : undefined,
      removedReason: status === "Removed" ? "Repeated safety violations. Permanent removal." : undefined,
      removedAt: status === "Removed" ? subDays(new Date(), 3).toISOString() : undefined,
      auditLog,
      createdAt,
    });
  });

  return listings;
}
