import { 
  RetailerStats, 
  LiveActivity, 
  ProductIntelligence, 
  RetailerOutfit,
  SubscriptionTier,
  Category,
  Season,
  Formality,
  Occasion
} from "./types";
import { CATALOG_ITEMS } from "./constants";

export const RETAILER_STATS: RetailerStats = {
  totalUsers: 14250,
  activeUsersToday: 2180,
  totalInteractions: 98400,
  aiInferences: 156200,
  estimatedCost: 156.20,
  conversionSignals: 542,
  revenueOpportunity: 18900
};

export const LIVE_ACTIVITY: LiveActivity[] = [
  { id: "1", user: "User #842", action: "viewed Midnight Silk Dress", timestamp: "now", intent: "medium" },
  { id: "2", user: "User #911", action: "generated Summer Gala outfit", timestamp: "2s ago", intent: "high" },
  { id: "3", user: "User #223", action: "clicked purchase link: Tech Joggers", timestamp: "5s ago", intent: "high" },
  { id: "4", user: "User #712", action: "viewed Cashmere Sweater", timestamp: "12s ago", intent: "low" },
  { id: "5", user: "User #105", action: "updated style profile to 'Minimalist'", timestamp: "25s ago", intent: "medium" },
];

export const PRODUCT_INTEL: ProductIntelligence[] = CATALOG_ITEMS.slice(0, 12).map((item, idx) => ({
  ...item,
  views: 1500 + (idx * 280),
  repeatViews: 320 + (idx * 95),
  avgDwellTime: `${20 + (idx % 40)}s`,
  conversionScore: Math.floor(Math.random() * 20) + 70 - (idx % 10),
  aiLabel: idx % 4 === 0 ? "High Intent" : idx % 4 === 1 ? "Trending" : idx % 4 === 2 ? "Low Engagement" : "Needs Boost",
  visibilityBoost: 40 + (idx % 60),
  isAutoOptimized: idx % 2 === 0
}));

export const CAMPAIGNS = [
  {
    id: "camp-1",
    name: "Minimalist Shift",
    status: "Draft",
    audience: 542,
    conversion: "+12%",
    revenue: "$4,200",
    description: "Targeting users with high minimalist intent with a curated collection of basics."
  },
  {
    id: "camp-2",
    name: "Summer Ready",
    status: "Active",
    audience: 1250,
    conversion: "+8%",
    revenue: "$12,400",
    description: "Promoting seasonal linen and lightweight items to active summer shoppers."
  }
];

export const RETAILER_OUTFITS: RetailerOutfit[] = [
  {
    id: "out-1",
    items: [CATALOG_ITEMS[0], CATALOG_ITEMS[5], CATALOG_ITEMS[3]],
    status: "Approved",
    recommendations: 1420,
    clicks: 840
  },
  {
    id: "out-2",
    items: [CATALOG_ITEMS[2], CATALOG_ITEMS[4]],
    status: "Pending",
    recommendations: 850,
    clicks: 120
  }
];

export const USAGE_CHART_DATA = [
  { day: "Mon", calls: 12000, cost: 12 },
  { day: "Tue", calls: 15000, cost: 15 },
  { day: "Wed", calls: 11000, cost: 11 },
  { day: "Thu", calls: 18000, cost: 18 },
  { day: "Fri", calls: 22000, cost: 22 },
  { day: "Sat", calls: 19000, cost: 19 },
  { day: "Sun", calls: 14000, cost: 14 },
];

export const TREND_CHART_DATA = [
  { style: "Casual", engagement: 45 },
  { style: "Business", engagement: 25 },
  { style: "Smart", engagement: 20 },
  { style: "Street", engagement: 10 },
];
