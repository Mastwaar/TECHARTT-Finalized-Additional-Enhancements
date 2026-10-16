export enum Category {
  TOP = "Top",
  BOTTOM = "Bottom",
  OUTERWEAR = "Outerwear",
  DRESS = "Dress",
  SHOES = "Shoes",
  ACCESSORY = "Accessory",
}

export enum Season {
  SPRING = "Spring",
  SUMMER = "Summer",
  AUTUMN = "Autumn",
  WINTER = "Winter",
  ALL = "All-Season",
}

export enum Formality {
  CASUAL = "Casual",
  SMART_CASUAL = "Smart Casual",
  BUSINESS = "Business",
  FORMAL = "Formal",
}

export enum Occasion {
  WORK = "Work",
  DATE = "Date",
  PARTY = "Party",
  GYM = "Gym",
  LOUNGE = "Lounge",
  WEDDING = "Wedding",
}

export interface WardrobeItem {
  id: string;
  imageUrl: string;
  category: Category;
  color: string;
  season: Season;
  formality: Formality;
  silhouette: string;
  fit: string;
  coverage: "Low" | "Medium" | "High";
  texture: string;
  occasions: Occasion[];
  confidence?: number;
  isConfirmed?: boolean;
  isDuplicate?: boolean;
  duplicateOf?: string;
}

export interface CatalogItem extends WardrobeItem {
  price: number;
  brand: string;
  purchaseUrl: string;
  reasoning?: string;
  score?: number;
}

export interface WardrobeAnalysis {
  missingCategories: Category[];
  colorBalance: Record<string, number>;
  seasonSuitability: Record<Season, number>;
  formalityDistribution: Record<Formality, number>;
  suggestions: string[];
  totalItems: number;
  confirmedItems: number;
  averageConfidence: number;
  duplicates: WardrobeItem[];
  missingEssentials: string[];
}

export interface GiftModeConfig {
  recipientName: string;
  recipientType: string;
  occasion: Occasion | "Other";
  budget: string;
  customInstructions?: string;
}

export enum SubscriptionTier {
  BASIC = "Basic",
  PRO = "Pro",
  PREMIUM = "Premium",
}

export interface CartItem extends CatalogItem {
  quantity: number;
}

export interface User {
  id: string;
  email: string;
  name: string;
  preferences?: {
    style?: string;
    colors?: string[];
    occasions?: Occasion[];
    modestyEnforced?: boolean;
    cultureRules?: string;
  };
  createdAt?: string;
  updatedAt?: string;
  isAdmin?: boolean;
}

export interface SavedRecommendation {
  id: string;
  title: string;
  description: string;
  items: CatalogItem[];
  created_at: string;
}

export interface StylistFilters {
  season: Season | "All";
  occasion: Occasion | "All";
  formality: Formality | "All";
  modestyEnforced: boolean;
  cultureRules?: string;
}

export interface StyleScore {
  score: number;
  explanation: string;
}

export interface ChatMessage {
  role: "user" | "model";
  content: string;
  timestamp: number;
  suggestedItems?: CatalogItem[];
  imageData?: string;
  imageMimeType?: string;
}

export interface RetailerStats {
  totalUsers: number;
  activeUsersToday: number;
  totalInteractions: number;
  aiInferences: number;
  estimatedCost: number;
  conversionSignals: number;
  revenueOpportunity: number;
}

export interface LiveActivity {
  id: string;
  user: string;
  action: string;
  timestamp: string;
  intent: "high" | "medium" | "low";
}

export interface ProductIntelligence extends CatalogItem {
  views: number;
  repeatViews: number;
  avgDwellTime: string;
  conversionScore: number;
  aiLabel: "High Intent" | "Trending" | "Low Engagement" | "Needs Boost";
  visibilityBoost: number;
  isAutoOptimized: boolean;
}

export interface RetailerOutfit {
  id: string;
  items: CatalogItem[];
  status: "Approved" | "Pending" | "Rejected";
  recommendations: number;
  clicks: number;
}
