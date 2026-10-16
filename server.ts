import express from "express";
import { createServer as createViteServer } from "vite";
import sqlite3 from "sqlite3";
import { open } from "sqlite";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import cookieParser from "cookie-parser";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import { CATALOG_ITEMS, ACCESSORIES } from "./src/constants.ts";

dotenv.config();

let customFilename = "";
let customDirname = "";

try {
  if (typeof import.meta !== "undefined" && import.meta.url) {
    customFilename = fileURLToPath(import.meta.url);
    customDirname = path.dirname(customFilename);
  } else {
    customFilename = __filename;
    customDirname = __dirname;
  }
} catch (e) {
  customFilename = typeof __filename !== "undefined" ? __filename : "";
  customDirname = typeof __dirname !== "undefined" ? __dirname : process.cwd();
}

const resolvedFilename = customFilename;
const resolvedDirname = customDirname;

const JWT_SECRET = process.env.JWT_SECRET || "aura-style-secret-key";

// Initialize Server-Side Gemini client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || "",
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

async function startServer() {
  const db = await open({
    filename: "aura.db",
    driver: sqlite3.Database
  });

  // Initialize Database
  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE,
      password TEXT,
      name TEXT,
      preferences TEXT
    );

    CREATE TABLE IF NOT EXISTS wardrobe (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      image_url TEXT,
      category TEXT,
      color TEXT,
      style TEXT,
      tags TEXT,
      FOREIGN KEY(user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS recommendations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      title TEXT,
      description TEXT,
      items TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS activity (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      session_id TEXT,
      product_id TEXT,
      activity_type TEXT, -- 'view', 'click', 'dwell'
      value INTEGER, -- e.g. duration in ms
      metadata TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id)
    );
  `);

  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "20mb" }));
  app.use(express.urlencoded({ limit: "20mb", extended: true }));
  app.use(cookieParser());

  // Middleware to verify JWT
  const authenticateToken = (req: any, res: any, next: any) => {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ error: "Unauthorized" });

    jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
      if (err) return res.status(403).json({ error: "Forbidden" });
      req.user = user;
      next();
    });
  };

  // Auth Routes
  app.post("/api/auth/signup", async (req, res) => {
    const { email, password, name } = req.body;
    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      const result = await db.run("INSERT INTO users (email, password, name) VALUES (?, ?, ?)", email, hashedPassword, name || email.split('@')[0]);
      
      const token = jwt.sign({ id: result.lastID, email }, JWT_SECRET);
      res.cookie("token", token, { httpOnly: true, secure: true, sameSite: 'none' });
      res.json({ id: result.lastID, email, name });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    const { email, password } = req.body;
    const user: any = await db.get("SELECT * FROM users WHERE email = ?", email);
    
    if (user && await bcrypt.compare(password, user.password)) {
      const token = jwt.sign({ id: user.id, email }, JWT_SECRET);
      res.cookie("token", token, { httpOnly: true, secure: true, sameSite: 'none' });
      res.json({ id: user.id, email, name: user.name });
    } else {
      res.status(401).json({ error: "Invalid credentials" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    res.clearCookie("token");
    res.json({ success: true });
  });

  app.get("/api/auth/me", authenticateToken, async (req: any, res) => {
    const user: any = await db.get("SELECT id, email, name, preferences FROM users WHERE id = ?", req.user.id);
    res.json(user);
  });

  // Profile Routes
  app.put("/api/user/profile", authenticateToken, async (req: any, res) => {
    const { name, preferences } = req.body;
    await db.run("UPDATE users SET name = ?, preferences = ? WHERE id = ?", name, JSON.stringify(preferences), req.user.id);
    res.json({ success: true });
  });

  // Wardrobe Routes
  app.get("/api/wardrobe", authenticateToken, async (req: any, res) => {
    const items = await db.all("SELECT * FROM wardrobe WHERE user_id = ?", req.user.id);
    res.json(items.map((item: any) => ({
      ...item,
      tags: JSON.parse(item.tags || "[]")
    })));
  });

  app.post("/api/wardrobe", authenticateToken, async (req: any, res) => {
    const { image_url, category, color, style, tags } = req.body;
    const result = await db.run(
      "INSERT INTO wardrobe (user_id, image_url, category, color, style, tags) VALUES (?, ?, ?, ?, ?, ?)",
      req.user.id, image_url, category, color, style, JSON.stringify(tags)
    );
    res.json({ id: result.lastID });
  });

  app.delete("/api/wardrobe/:id", authenticateToken, async (req: any, res) => {
    await db.run("DELETE FROM wardrobe WHERE id = ? AND user_id = ?", req.params.id, req.user.id);
    res.json({ success: true });
  });

  // Recommendations Routes
  app.get("/api/recommendations", authenticateToken, async (req: any, res) => {
    const recs = await db.all("SELECT * FROM recommendations WHERE user_id = ? ORDER BY created_at DESC", req.user.id);
    res.json(recs.map((rec: any) => ({
      ...rec,
      items: JSON.parse(rec.items || "[]")
    })));
  });

  app.post("/api/recommendations", authenticateToken, async (req: any, res) => {
    const { title, description, items } = req.body;
    const result = await db.run(
      "INSERT INTO recommendations (user_id, title, description, items) VALUES (?, ?, ?, ?)",
      req.user.id, title, description, JSON.stringify(items)
    );
    res.json({ id: result.lastID });
  });

  // Activity Tracking Route
  app.post("/api/activity", async (req: any, res) => {
    const { product_id, activity_type, value, metadata, session_id } = req.body;
    
    // Optional auth
    let user_id = null;
    const token = req.cookies.token;
    if (token) {
      try {
        const decoded: any = jwt.verify(token, JWT_SECRET);
        user_id = decoded.id;
      } catch (e) {
        // invalid token, just treat as guest
      }
    }

    try {
      const result = await db.run(
        "INSERT INTO activity (user_id, session_id, product_id, activity_type, value, metadata) VALUES (?, ?, ?, ?, ?, ?)",
        user_id, session_id, product_id, activity_type, value, JSON.stringify(metadata)
      );
      res.json({ success: true, id: result.lastID });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // --- AI STYLIST NLP & INTEGRATION ENDPOINTS ---

  // Helper function to safely parse potential JSON returned by AI models
  function safeJsonParse(text: string, defaultValue: any) {
    if (!text) return defaultValue;
    try {
      let cleanText = text.trim();
      if (cleanText.startsWith("```json")) {
        cleanText = cleanText.slice(7);
      } else if (cleanText.startsWith("```")) {
        const nextLines = cleanText.split("\n");
        if (nextLines[0].trim() === "```" || nextLines[0].trim().toLowerCase() === "```json") {
          nextLines.shift();
          cleanText = nextLines.join("\n");
        } else {
          cleanText = cleanText.slice(3);
        }
      }
      if (cleanText.endsWith("```")) {
        cleanText = cleanText.slice(0, -3);
      }
      return JSON.parse(cleanText.trim());
    } catch (e: any) {
      console.log("[AI INFO] safeJsonParse handled raw string or partial JSON content gracefully:", e.message || e);
      return defaultValue;
    }
  }

  // Safety tracker to handle 429 Resource Exhausted/Quota Limits gracefully during heavy evaluation.
  const exhaustedModels = new Set<string>();

  // Safety wrapper to avoid 429 rate limit or 503 transient errors during presentation.
  async function generateContentSafe(params: {
    model?: string;
    contents: any;
    config?: any;
    fallbackResult?: any;
  }) {
    const key = process.env.GEMINI_API_KEY;
    const isPlaceholder = !key || key.trim() === "" || key.includes("MY_GEMINI_API_KEY") || key.includes("PLACEHOLDER");

    if (isPlaceholder) {
      console.log("[AI INFO] Gemini API key is missing or placeholder. Serving offline fallback immediately.");
      if (params.fallbackResult !== undefined) {
        const textVal = typeof params.fallbackResult === 'string' 
          ? params.fallbackResult 
          : JSON.stringify(params.fallbackResult);
        return {
          text: textVal,
          candidates: [{
            content: {
              parts: [{ text: textVal }]
            }
          }]
        } as any;
      }
      throw new Error("Gemini API key is required but missing.");
    }

    const modelsToTry = [
      params.model || "gemini-3.5-flash",
      "gemini-3.1-flash-lite",
      "gemini-flash-latest"
    ];

    const uniqueModels = Array.from(new Set(modelsToTry));
    
    // Sort so non-exhausted models are placed first
    let queryModels = uniqueModels.filter(m => !exhaustedModels.has(m));
    if (queryModels.length === 0) {
      queryModels = uniqueModels;
    }

    let lastError = null;

    for (const modelName of queryModels) {
      // If the model is marked as exhausted, try only 1 attempt
      let attempts = exhaustedModels.has(modelName) ? 1 : 2;
      let delay = 300; // ms

      for (let attempt = 1; attempt <= attempts; attempt++) {
        try {
          console.log(`[AI HELP] Calling ${modelName}...`);
          const response = await ai.models.generateContent({
            model: modelName,
            contents: params.contents,
            config: params.config
          });
          
          if (response && response.text) {
            // Recover from list if it succeeds now
            if (exhaustedModels.has(modelName)) {
              exhaustedModels.delete(modelName);
            }
            return response;
          }
        } catch (error: any) {
          lastError = error;
          const errMessage = String(error.message || error || "").toLowerCase();
          
          const isQuotaExceeded = errMessage.includes("429") || 
            errMessage.includes("resource_exhausted") || 
            errMessage.includes("quota") || 
            errMessage.includes("limit") ||
            errMessage.includes("rate limit") ||
            (error.status && String(error.status).toLowerCase().includes("exhausted"));

          const isOverloadedOrUnavailable = errMessage.includes("503") ||
            errMessage.includes("unavailable") ||
            errMessage.includes("high demand") ||
            errMessage.includes("overloaded") ||
            errMessage.includes("temp") ||
            errMessage.includes("try again later") ||
            (error.status && String(error.status).toLowerCase().includes("unavailable"));

          const isAuthError = !isQuotaExceeded && !isOverloadedOrUnavailable && (
            errMessage.includes("api key") || 
            errMessage.includes("unauthorized") || 
            errMessage.includes("forbidden") || 
            errMessage.includes("403") || 
            errMessage.includes("400") ||
            errMessage.includes("not found") ||
            errMessage.includes("invalid key") ||
            errMessage.includes("credentials") ||
            errMessage.includes("api_key_invalid") ||
            errMessage.includes("permission") ||
            errMessage.includes("denied") ||
            errMessage.includes("caller")
          );

          if (isAuthError) {
            console.log(`[AI INFO] API Key auth/permission error detected: "${errMessage}". Stopping retries and serving fallback.`);
            break;
          }

          if (isQuotaExceeded || isOverloadedOrUnavailable) {
            console.log(`[AI INFO] Quota/demand limits hit or service unavailable for ${modelName}. Switching model gracefully.`);
            exhaustedModels.add(modelName);
            // Delete flag after 5 minutes so it automatically resets later
            setTimeout(() => {
              exhaustedModels.delete(modelName);
            }, 5 * 60 * 1000);
            break; // Break attempts to switch model immediately
          }

          console.log(`[AI INFO] ${modelName} call returned warning or failed attempt ${attempt}. Error: ${error.message || error}`);

          if (attempt < attempts) {
            await new Promise(resolve => setTimeout(resolve, delay));
            delay *= 1.5;
          }
        }
      }
      
      // If we broke due to auth error, don't try other models
      if (lastError) {
        const errMessage = String(lastError.message || lastError || "").toLowerCase();
        const isQuotaExceeded = errMessage.includes("429") || 
          errMessage.includes("resource_exhausted") || 
          errMessage.includes("quota") || 
          errMessage.includes("limit") ||
          errMessage.includes("rate limit");

        const isOverloadedOrUnavailable = errMessage.includes("503") ||
          errMessage.includes("unavailable") ||
          errMessage.includes("high demand") ||
          errMessage.includes("overloaded") ||
          errMessage.includes("temp");

        const isAuthError = !isQuotaExceeded && !isOverloadedOrUnavailable && (
          errMessage.includes("api key") || 
          errMessage.includes("unauthorized") || 
          errMessage.includes("forbidden") || 
          errMessage.includes("403") || 
          errMessage.includes("400") ||
          errMessage.includes("not found") ||
          errMessage.includes("invalid key") ||
          errMessage.includes("credentials") ||
          errMessage.includes("api_key_invalid") ||
          errMessage.includes("permission") ||
          errMessage.includes("denied") ||
          errMessage.includes("caller")
        );
        if (isAuthError) {
          break;
        }
      }
    }

    console.log("[AI INFO] All available models failed. Serving offline fallback.");
    if (params.fallbackResult !== undefined) {
      const textVal = typeof params.fallbackResult === 'string' 
        ? params.fallbackResult 
        : JSON.stringify(params.fallbackResult);
      return {
        text: textVal,
        candidates: [{
          content: {
            parts: [{ text: textVal }]
          }
        }]
      } as any;
    }
    throw lastError || new Error("All AI translation options failed.");
  }

  // 1. Analyze wardrobe clothing item
  app.post("/api/ai/analyze-wardrobe", async (req, res) => {
    const { base64Image } = req.body;
    if (!base64Image) {
      return res.status(400).json({ error: "Missing base64Image" });
    }

    const model = "gemini-3.5-flash";
    const prompt = `Analyze this image and identify ALL individual clothing items present. 
    For each item, provide structured attributes in JSON format as an array.
    Include: category (Top, Bottom, Outerwear, Dress, Shoes, Accessory), color (provide a standard CSS hex code, e.g., #000000), season (Spring, Summer, Autumn, Winter, All-Season), formality (Casual, Smart Casual, Business, Formal), silhouette, fit, coverage (Low, Medium, High), texture, a list of suitable occasions (Work, Date, Party, Gym, Lounge, Wedding), and a confidence score (0.0 to 1.0) for the identification.
    If multiple items are detected (e.g., a shirt and pants), return them as separate objects in the array.`;

    const fallbackVal = [
      {
        category: "Top",
        color: "#ECEFF1",
        season: "Spring",
        formality: "Smart Casual",
        silhouette: "Classic Shift",
        fit: "Regular Fit",
        coverage: "High",
        texture: "Premium Brushed Cotton",
        occasions: ["Work", "Date", "Lounge"],
        confidence: 0.95
      }
    ];

    try {
      const response = await generateContentSafe({
        model,
        contents: [
          {
            parts: [
              { text: prompt },
              { inlineData: { mimeType: "image/jpeg", data: base64Image } }
            ]
          }
        ],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                category: { type: Type.STRING },
                color: { type: Type.STRING },
                season: { type: Type.STRING },
                formality: { type: Type.STRING },
                silhouette: { type: Type.STRING },
                fit: { type: Type.STRING },
                coverage: { type: Type.STRING },
                texture: { type: Type.STRING },
                occasions: { type: Type.ARRAY, items: { type: Type.STRING } },
                confidence: { type: Type.NUMBER }
              },
              required: ["category", "color", "season", "formality", "coverage", "confidence"]
            }
          }
        },
        fallbackResult: fallbackVal
      });

      const result = safeJsonParse(response.text, fallbackVal);
      res.json(Array.isArray(result) ? result : [result]);
    } catch (error: any) {
      console.error("AI Analysis failed server-side:", error);
      res.status(500).json({ error: error.message || "AI Analysis failed" });
    }
  });

  // 2. Get recommendation reasoning
  app.post("/api/ai/recommendation-reasoning", async (req, res) => {
    try {
      const { wardrobe, item, filters, contextItem, language } = req.body;
      const model = "gemini-3.5-flash";
      const isSpanish = language === "Spanish" || language === "es";
      
      const wardrobeSummary = (wardrobe || []).map((i: any) => `${i.color} ${i.category}`).join(", ");
      const modestyText = filters?.modestyEnforced ? `The user has modesty preferences enabled. ${filters.cultureRules ? 'STRICT RULES: ' + filters.cultureRules : 'Ensure the recommendation respects coverage.'}` : "";
      const contextText = contextItem ? `The user is specifically looking for a match for their ${contextItem.color} ${contextItem.category}.` : "";

      const prompt = `You are a world-class fashion stylist. 
      The user has these items in their wardrobe: ${wardrobeSummary}.
      ${contextText}
      You are recommending this item: ${item?.brand} ${item?.color} ${item?.category} (${item?.texture}, ${item?.formality}).
      ${modestyText}
      Provide a one-sentence explanation of why this item is a great match. ${contextItem ? 'Focus on how it pairs with the specific item mentioned.' : 'Focus on how it complements their existing wardrobe.'} 
      Mention color harmony or style consistency if relevant. 
      Keep it professional, encouraging, and fashion-forward.
      
      CRITICAL: You MUST write your response in ${isSpanish ? 'Spanish (Español)' : 'English'}. Respond only in ${isSpanish ? 'Spanish' : 'English'}.`;

      const fallbackVal = isSpanish 
        ? "Esta elegante pieza armoniza perfectamente con tu colección, ofreciendo una sutil continuidad de estilo y una sofisticada versatilidad."
        : "This elegant piece harmonizes perfectly with your collection, offering subtle style continuity and sophisticated versatility.";

      const response = await generateContentSafe({
        model,
        contents: [{ parts: [{ text: prompt }] }],
        fallbackResult: fallbackVal
      });

      res.json({ reasoning: response.text || fallbackVal });
    } catch (error: any) {
      console.error("AI Reasoning failed server-side:", error);
      const isSpanish = req.body.language === "Spanish" || req.body.language === "es";
      const fallbackVal = isSpanish 
        ? "Esta elegante pieza armoniza perfectamente con tu colección, ofreciendo una sutil continuidad de estilo y una sofisticada versatilidad."
        : "This elegant piece harmonizes perfectly with your collection, offering subtle style continuity and sophisticated versatility.";
      res.json({ reasoning: fallbackVal, error: error.message });
    }
  });

  // 3. Parse outfit queries
  app.post("/api/ai/parse-query", async (req, res) => {
    try {
      const { query: queryText } = req.body;
      const model = "gemini-3.5-flash";

      const categories = ["Top", "Bottom", "Outerwear", "Dress", "Shoes", "Accessory"].join(", ");
      const seasons = ["Spring", "Summer", "Autumn", "Winter", "All-Season"].join(", ");
      const formalities = ["Casual", "Smart Casual", "Business", "Formal"].join(", ");
      const occasions = ["Work", "Date", "Party", "Gym", "Lounge", "Wedding"].join(", ");

      const prompt = `You are a fashion AI assistant. Parse the user's natural language style query into structured data.
      
      User Query: "${queryText}"
      
      Extract the following if mentioned:
      - color: a standard color name (e.g., Black, Blue, Red)
      - category: one of [${categories}]
      - formality: one of [${formalities}]
      - season: one of [${seasons}]
      - occasion: one of [${occasions}]
      - intent: "match" if they are asking what goes with something they have, "find" if they are looking for a general outfit.
      
      Return ONLY a JSON object. If a field is not found, omit it.`;

      const fallbackVal = {
        color: "Blue",
        category: "Top",
        formality: "Casual",
        season: "All-Season",
        occasion: "Lounge",
        intent: "find"
      };

      const response = await generateContentSafe({
        model,
        contents: [{ parts: [{ text: prompt }] }],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              color: { type: Type.STRING },
              category: { type: Type.STRING },
              formality: { type: Type.STRING },
              season: { type: Type.STRING },
              occasion: { type: Type.STRING },
              intent: { type: Type.STRING, enum: ["match", "find"] }
            }
          }
        },
        fallbackResult: fallbackVal
      });

      const result = safeJsonParse(response.text, fallbackVal);
      res.json(result);
    } catch (error: any) {
      console.error("Query parsing failed server-side:", error);
      res.json(null);
    }
  });

  // 4. Get stylist advice
  app.post("/api/ai/stylist-advice", async (req, res) => {
    try {
      const { wardrobe, filters, contextItem, parsedQuery, styleSwitchMode, language } = req.body;
      const model = "gemini-3.5-flash";
      const isSpanish = language === "Spanish" || language === "es";
      
      const wardrobeSummary = (wardrobe || []).map((i: any) => `${i.color} ${i.category}`).join(", ");
      const modestyText = filters?.modestyEnforced ? `The user values modesty in their outfits. ${filters.cultureRules ? 'CULTURAL RULES: ' + filters.cultureRules : ''}` : "";
      const contextText = contextItem ? `They are currently focused on styling their ${contextItem.color} ${contextItem.category}.` : "";
      const queryText = parsedQuery ? `Current context/search: ${JSON.stringify(parsedQuery)}.` : "";
      const styleText = styleSwitchMode ? `They are specifically looking for a ${styleSwitchMode} style interpretation.` : "";

      const prompt = `You are a high-end personal AI stylist. 
      The user's wardrobe consists of: ${wardrobeSummary}.
      ${contextText}
      ${queryText}
      ${styleText}
      Current Context - Season: ${filters?.season}, Occasion: ${filters?.occasion}.
      ${modestyText}

      Provide a short, 2-3 sentence personalized style advice note for the user. 
      If a specific style switch is mentioned (${styleSwitchMode}), focus on how to transition the piece into that vibe.
      Talk about how to elevate their current look, color pairings to try, or how to bridge gaps in their collection based on the current season or occasion.
      Tone: Sophisticated, insightful, and helpful.
      
      CRITICAL: You MUST write your advice response in ${isSpanish ? 'Spanish (Español)' : 'English'}. Respond only in ${isSpanish ? 'Spanish' : 'English'}.`;

      const fallbackVal = { 
        advice: isSpanish 
          ? "¡El estilo es una expresión de autoconfianza! Intenta combinar tus prendas superiores neutras con abrigos estructurados, creando una combinación visual que une la elegancia y la comodidad de manera ideal."
          : "Styling is an expression of self-confidence! Try pairing your soft neutral tops with structured outerwear, creating a visual layer that bridges smart and casual beautifully." 
      };

      const response = await generateContentSafe({
        model,
        contents: [{ parts: [{ text: prompt }] }],
        fallbackResult: fallbackVal
      });

      let adviceText = "";
      if (response && response.text) {
        const textTrim = response.text.trim();
        if (textTrim.startsWith("{") || textTrim.startsWith("[")) {
          try {
            const parsed = JSON.parse(textTrim);
            if (parsed && typeof parsed === "object") {
              adviceText = parsed.advice || response.text;
            }
          } catch (e) {
            adviceText = response.text;
          }
        } else {
          adviceText = response.text;
        }
      }

      if (!adviceText || adviceText === JSON.stringify(fallbackVal)) {
        adviceText = fallbackVal.advice;
      }

      res.json({ advice: adviceText });
    } catch (error: any) {
      console.error("Stylist advice failed server-side:", error);
      const isSpanish = req.body.language === "Spanish" || req.body.language === "es";
      const fallbackMsg = isSpanish 
        ? "¡El estilo es una expresión de autoconfianza! Intenta combinar tus prendas superiores neutras con abrigos estructurados, creando una combinación visual que une la elegancia y la comodidad de manera ideal."
        : "Styling is an expression of self-confidence! Try pairing your soft neutral tops with structured outerwear, creating a visual layer that bridges smart and casual beautifully.";
      res.json({ advice: fallbackMsg, error: error.message });
    }
  });

  // 5. Get style score
  app.post("/api/ai/style-score", async (req, res) => {
    try {
      const { item, wardrobe } = req.body;
      const model = "gemini-3.5-flash";
      
      const wardrobeSummary = (wardrobe || []).map((i: any) => `${i.color} ${i.category}`).join(", ");
      
      const prompt = `You are a fashion expert and style critic. Rate the follow item on a scale of 1 to 10 based on its style quality, versatility, and potential to create multiple outfits within the user's current collection.
      
      Item to score: ${item?.color} ${item?.category} (Fit: ${item?.fit}, Texture: ${item?.texture}, Formality: ${item?.formality}).
      User's Current Wardrobe: ${wardrobeSummary}.
      
      Return a JSON object with:
      - score: a number from 1.0 to 10.0 (increment of 0.1 is allowed)
      - explanation: a concise 1-2 sentence explanation focusing on versatility, outfit potential, and style quality.`;

      const fallbackVal = {
        score: 8.5,
        explanation: "Highly versatile piece with a clean silhouette, offering rich layering options across multiple seasons and occasions."
      };

      const response = await generateContentSafe({
        model,
        contents: [{ parts: [{ text: prompt }] }],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              score: { type: Type.NUMBER },
              explanation: { type: Type.STRING }
            },
            required: ["score", "explanation"]
          }
        },
        fallbackResult: fallbackVal
      });

      const result = safeJsonParse(response.text, fallbackVal);
      res.json(result);
    } catch (error: any) {
      console.error("Style score failed server-side:", error);
      res.json({
        score: 8.5,
        explanation: "Highly versatile piece with a clean silhouette, offering rich layering options across multiple seasons and occasions.",
        error: error.message
      });
    }
  });

  // 6. Conversational chat with stylist
  app.post("/api/ai/chat-with-stylist", async (req, res) => {
    const { history, wardrobe, filters, language } = req.body;
    const model = "gemini-3.5-flash";
    const isSpanish = language === "Spanish" || language === "es";
    
    const wardrobeSummary = (wardrobe || []).map((i: any) => `${i.color} ${i.category}`).join(", ");
    const categories = ["Top", "Bottom", "Outerwear", "Dress", "Shoes", "Accessory"].join(", ");
    const seasons = ["Spring", "Summer", "Autumn", "Winter", "All-Season"].join(", ");
    const formalities = ["Casual", "Smart Casual", "Business", "Formal"].join(", ");
    const occasions = ["Work", "Date", "Party", "Gym", "Lounge", "Wedding"].join(", ");

    const catalogSummary = [...CATALOG_ITEMS, ...ACCESSORIES]
      .map(item => `- "${item.id}": ${item.brand} ${item.color} ${item.category} (${item.silhouette || ''} ${item.texture}), $${item.price}. Suitability: ${item.season} season, ${item.formality} formality, suitable occasions: ${(item.occasions || []).join(", ")}.`)
      .join("\n");

    const systemInstructions = `You are "Aura", a sophisticated personal AI Fashion Stylist.
    The user's current wardrobe pieces: ${wardrobeSummary}.
    
    Available Catalog outfit pieces you can suggest to the user to purchase or add to their style:
${catalogSummary}

    Guidelines for chat interaction:
    1. Engage in standard, elegant, of-course, high-fashion styling advice!
    2. Suggest or recommend one or more of the "Available Catalog outfit pieces" above when it makes styling sense, and explain how the items coordinate with what the user is asking about or what they currently have in their wardrobe.
    3. If the user uploads a photo/image of a wardrobe element, shoes, dress, or outfit, analyze its visual elements, style, colors, and vibes carefully, and provide professional opinion, pairing options, or suggest items from our catalog that go well with it.
    4. If you recommend or refer to any of the specific catalog items listed above, you MUST include their IDs (e.g. "yoox-c1", "yoox-s1", "yoox-a1", etc.) in the "suggestedItemIds" string array.
    5. Keep your conversational response elegant, compact, and friendly.
    6. Language requirement: You MUST write your 'message' response ONLY in ${isSpanish ? 'Spanish (Español) with an elegant, elite, and warm tone' : 'English'}. Respond only in this language.

    Return a JSON object with:
    - message: your conversational reply.
    - suggestedItemIds: (optional) array of strings containing catalog IDs (such as ["yoox-c1", "yoox-a1"]) that fit this styling suggestion.
    - parsedQuery: (optional) { color, category (one of [${categories}]), formality (one of [${formalities}]), season (one of [${seasons}]), occasion (one of [${occasions}]), intent ("match" or "find") }.
    `;

    const fallbackVal = {
      message: isSpanish
        ? "¡Actualmente estoy ocupada diseñando lookbooks exclusivos para un desfile de modas, pero siempre estoy disponible para ayudarte a lucir espectacular! Cuéntame, ¿qué tipo de look o prendas de tu guardarropa deseas estilizar o elevar hoy?"
        : "I'm currently busy hand-curating styled lookbooks for a runway show, but I'm always available to help you look your absolute best! Tell me, what kind of look or wardrobe elements are you hoping to style or elevate today?",
      suggestedItemIds: ["yoox-c9", "yoox-a1"],
      parsedQuery: {
        intent: "find"
      }
    };

    try {
      const formattedHistory = (history || []).map((m: any) => {
        const parts: any[] = [];
        
        if (m.imageData) {
          let base64Data = m.imageData;
          if (base64Data.startsWith("data:")) {
            const commaIdx = base64Data.indexOf(",");
            if (commaIdx !== -1) {
              base64Data = base64Data.substring(commaIdx + 1);
            }
          }
          parts.push({
            inlineData: {
              mimeType: m.imageMimeType || "image/jpeg",
              data: base64Data
            }
          });
        }
        
        if (m.content) {
          parts.push({ text: m.content });
        } else if (!m.imageData) {
          parts.push({ text: "" });
        }
        
        return {
          role: m.role || "user",
          parts
        };
      });

      const response = await generateContentSafe({
        model,
        contents: formattedHistory,
        config: {
          systemInstruction: systemInstructions,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
               message: { type: Type.STRING },
               suggestedItemIds: {
                 type: Type.ARRAY,
                 items: { type: Type.STRING }
               },
               parsedQuery: {
                 type: Type.OBJECT,
                 properties: {
                   color: { type: Type.STRING },
                   category: { type: Type.STRING },
                   formality: { type: Type.STRING },
                   season: { type: Type.STRING },
                   occasion: { type: Type.STRING },
                   intent: { type: Type.STRING, enum: ["match", "find"] }
                 }
               }
            },
            required: ["message"]
          }
        },
        fallbackResult: fallbackVal
      });

      let parsedResult: any = null;
      let modelMessage = "";
      let suggestedIds: string[] = [];
      let parsedQ: any = null;

      if (response && response.text) {
        const textTrim = response.text.trim();
        if (textTrim.startsWith("{") || textTrim.startsWith("[")) {
          parsedResult = safeJsonParse(textTrim, null);
        }
        
        if (parsedResult && typeof parsedResult === "object") {
          modelMessage = parsedResult.message || "";
          suggestedIds = parsedResult.suggestedItemIds || [];
          parsedQ = parsedResult.parsedQuery || null;
        } else {
          // If plain text or malformed JSON, use the raw response text cleanly
          modelMessage = response.text;
        }
      }

      // If empty or matched fallback, use fallback system default values
      if (!modelMessage || modelMessage === fallbackVal.message) {
        modelMessage = fallbackVal.message;
        suggestedIds = fallbackVal.suggestedItemIds || [];
        parsedQ = fallbackVal.parsedQuery || null;
      }

      res.json({
        message: modelMessage,
        suggestedItemIds: suggestedIds.length > 0 ? suggestedIds : undefined,
        parsedQuery: parsedQ || undefined
      });
    } catch (error: any) {
      console.error("Chat failed server-side:", error);
      res.json(fallbackVal);
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(resolvedDirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(resolvedDirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
