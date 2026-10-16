import { WardrobeItem, Category, Season, Formality, Occasion, CatalogItem, StylistFilters, StyleScore } from "../types";

export async function analyzeWardrobeItem(base64Image: string): Promise<Partial<WardrobeItem>[]> {
  try {
    const response = await fetch("/api/ai/analyze-wardrobe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ base64Image }),
    });
    if (!response.ok) {
      throw new Error(`Server returned status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Client-side analyzeWardrobeItem failed:", error);
    return [];
  }
}

function stripImage(item: WardrobeItem | null | undefined): any {
  if (!item) return null;
  const { imageUrl, ...rest } = item;
  return rest;
}

function stripImages(items: WardrobeItem[]): any[] {
  return (items || []).map(stripImage);
}

export async function getRecommendationReasoning(
  wardrobe: WardrobeItem[],
  item: CatalogItem,
  filters: StylistFilters,
  contextItem?: WardrobeItem | null,
  language?: string
): Promise<string> {
  try {
    const strippedWardrobe = stripImages(wardrobe);
    const strippedItem = stripImage(item);
    const strippedContextItem = stripImage(contextItem);

    const response = await fetch("/api/ai/recommendation-reasoning", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        wardrobe: strippedWardrobe, 
        item: strippedItem, 
        filters, 
        contextItem: strippedContextItem,
        language
      }),
    });
    if (!response.ok) {
      throw new Error(`Server returned status: ${response.status}`);
    }
    const data = await response.json();
    return data.reasoning || "This item is a great addition to your collection.";
  } catch (error) {
    console.warn("Client-side getRecommendationReasoning failed, serving fallback:", error);
    return "This item perfectly complements your style profile.";
  }
}

export interface ParsedQuery {
  color?: string;
  category?: Category;
  formality?: Formality;
  season?: Season;
  occasion?: Occasion;
  intent: "match" | "find";
}

export async function parseOutfitQuery(query: string): Promise<ParsedQuery | null> {
  try {
    const response = await fetch("/api/ai/parse-query", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query }),
    });
    if (!response.ok) {
      throw new Error(`Server returned status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.warn("Client-side parseOutfitQuery failed, serving fallback:", error);
    return null;
  }
}

export async function getStylistAdvice(
  wardrobe: WardrobeItem[],
  filters: StylistFilters,
  contextItem?: WardrobeItem | null,
  parsedQuery?: ParsedQuery | null,
  styleSwitchMode?: string | null,
  language?: string
): Promise<string> {
  try {
    const strippedWardrobe = stripImages(wardrobe);
    const strippedContextItem = stripImage(contextItem);

    const response = await fetch("/api/ai/stylist-advice", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        wardrobe: strippedWardrobe, 
        filters, 
        contextItem: strippedContextItem, 
        parsedQuery, 
        styleSwitchMode,
        language
      }),
    });
    if (!response.ok) {
      throw new Error(`Server returned status: ${response.status}`);
    }
    const data = await response.json();
    return data.advice || "Keep experimenting with your style! You have a great collection of pieces.";
  } catch (error) {
    console.warn("Client-side getStylistAdvice failed, serving fallback:", error);
    return "Great style starts with confidence. Your current collection offers excellent versatility.";
  }
}

export async function getStyleScore(
  item: WardrobeItem,
  wardrobe: WardrobeItem[]
): Promise<StyleScore> {
  try {
    const strippedItem = stripImage(item);
    const strippedWardrobe = stripImages(wardrobe);

    const response = await fetch("/api/ai/style-score", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ item: strippedItem, wardrobe: strippedWardrobe }),
    });
    if (!response.ok) {
      throw new Error(`Server returned status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.warn("Client-side getStyleScore failed, serving fallback:", error);
    return { score: 7.5, explanation: "This piece shows great versatility and pairs well with several items in your collection." };
  }
}

export interface ChatResponse {
  message: string;
  parsedQuery?: ParsedQuery;
  suggestedItemIds?: string[];
}

export async function chatWithStylist(
  history: { role: "user" | "model"; content: string; imageData?: string; imageMimeType?: string }[],
  wardrobe: WardrobeItem[],
  filters: StylistFilters,
  language?: string
): Promise<ChatResponse> {
  try {
    const strippedWardrobe = stripImages(wardrobe);

    const response = await fetch("/api/ai/chat-with-stylist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ history, wardrobe: strippedWardrobe, filters, language }),
    });
    if (!response.ok) {
      throw new Error(`Server returned status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.warn("Client-side chatWithStylist failed, serving fallback:", error);
    return { message: "I'm having a little trouble connecting right now, but I still think you look fabulous! How can I help?" };
  }
}
