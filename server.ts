import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

// Initialize the modern Google Gen AI client with appropriate user-agent header
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;
if (apiKey) {
  ai = new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
} else {
  console.warn("GEMINI_API_KEY not found in environment. AI suggestions will operate in smart heuristic local fallback mode.");
}

// Centralized Smart Heuristic Fallback Handler for Offline / Quota Safety
function handleLocalHeuristicFallback(
  action: string,
  query: string | undefined,
  complaint: string | undefined,
  medicines: any[] | undefined,
  allergies: string[] | undefined,
  res: any
) {
  if (action === "autocomplete") {
    const queryLower = (query || "").toLowerCase();
    const fallbackMeds = [
      { generic_name: "Paracetamol", brand_names: ["Napa", "Ace", "Pyrexin"], category: "analgesic", unit: "tablet", common_dosages: ["500mg", "665mg XR", "1g"] },
      { generic_name: "Amoxicillin", brand_names: ["Fimoxyl", "Moxacil", "Amoxil"], category: "antibiotic", unit: "capsule", common_dosages: ["250mg", "500mg"] },
      { generic_name: "Metformin", brand_names: ["Comet", "Metfo", "Glucomin"], category: "antidiabetic", unit: "tablet", common_dosages: ["500mg", "850mg"] },
      { generic_name: "Esomeprazole", brand_names: ["Maxpro", "Sergel", "Esoral"], category: "antacid", unit: "capsule", common_dosages: ["20mg", "40mg"] },
      { generic_name: "Amlodipine", brand_names: ["Camlodin", "Amlopin", "Amcard"], category: "antihypertensive", unit: "tablet", common_dosages: ["5mg", "10mg"] }
    ];
    const results = fallbackMeds.filter(
      m => m.generic_name.toLowerCase().includes(queryLower) || m.brand_names.some(b => b.toLowerCase().includes(queryLower))
    );
    return res.json({ results: results.length ? results : fallbackMeds.slice(0, 3), fallback: true });
  }

  if (action === "diagnose") {
    const text = (complaint || "").toLowerCase();
    let diag = ["R51 (Headache)", "R50.9 (Fever, unspecified)"];
    if (text.includes("cough") || text.includes("chest") || text.includes("breath")) {
      diag = ["J45.909 (Unspecified Asthma)", "J20.9 (Acute Bronchitis)"];
    } else if (text.includes("sugar") || text.includes("diabetes") || text.includes("polyuria")) {
      diag = ["E11.9 (Type 2 Diabetes mellitus without complications)"];
    } else if (text.includes("pressure") || text.includes("bp") || text.includes("tension")) {
      diag = ["I10 (Essential Hypertension)"];
    }
    return res.json({ diagnosis: diag, fallback: true });
  }

  if (action === "interactions") {
    const alerts: string[] = [];
    const medsLower = (medicines || []).map((m: any) => (m?.name || "").toLowerCase());
    const allergLower = (allergies || []).map((a: string) => a.toLowerCase());

    // Check penicillin allergy vs Amoxicillin
    if (allergLower.some((a: string) => a.includes("penicillin") || a.includes("amox"))) {
      if (medsLower.some((m: string) => m.includes("amoxicillin") || m.includes("fimoxyl") || m.includes("moxacil") || m.includes("amox"))) {
        alerts.push("⚠️ ALLERGY WARNING: Patient has a Penicillin allergy. 'Amoxicillin' or beta-lactam antibiotics are contraindicated.");
      }
    }
    // Check duplication
    if (medsLower.some((m: string) => m.includes("napa") || m.includes("paracetamol")) && medsLower.some((m: string) => m.includes("ace"))) {
      alerts.push("⚠️ THERAPEUTIC DUPLICATION: Multiple Acetaminophen-containing preparations (Napa + Ace) are selected.");
    }

    return res.json({
      alerts: alerts.length ? alerts : ["✅ No common drug interactions or allergy conflicts detected via localized checks."],
      fallback: true
    });
  }

  return res.status(400).json({ error: "Invalid action type" });
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route: AI Clinical Suggester (Securely runs server-side to hide API Keys)
  app.post("/api/ai/suggest", async (req, res) => {
    const { action, query, complaint, medicines, allergies } = req.body;

    if (!ai) {
      return handleLocalHeuristicFallback(action, query, complaint, medicines, allergies, res);
    }

    try {
      if (action === "autocomplete") {
        const systemPrompt = `You are a medical pharmacy assistant. Given a partial medicine query, return up to 3 medication autocomplete results. Output must be valid JSON in the specified schema.
Each medication option must have generic_name, brand_names (array of top Brand names commonly found in Bangladesh like Napa, Ace, Sergel, Maxpro, Comet etc), category (antibiotic, analgesic, antacid, antidiabetic, antihypertensive, antihistamine etc), unit (tablet, capsule, syrup, injection, drop, ointment), and common_dosages (array of common strengths like 500mg, 20mg, 5ml etc).`;

        const response = await ai.models.generateContent({
          model: "gemini-3.5-flash",
          contents: `Query: "${query}"`,
          config: {
            systemInstruction: systemPrompt,
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                results: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      generic_name: { type: Type.STRING },
                      brand_names: { type: Type.ARRAY, items: { type: Type.STRING } },
                      category: { type: Type.STRING },
                      unit: { type: Type.STRING },
                      common_dosages: { type: Type.ARRAY, items: { type: Type.STRING } }
                    },
                    required: ["generic_name", "brand_names", "category", "unit", "common_dosages"]
                  }
                }
              },
              required: ["results"]
            }
          }
        });

        const data = JSON.parse(response.text || "{}");
        return res.json({ results: data.results || [], fallback: false });
      }

      if (action === "diagnose") {
        const systemPrompt = `You are a clinic doctor's diagnostic assistant. Given a patient's chief complaints or symptoms, suggest 2 or 3 matching diagnosis hints with ICD-10 style codes. Format as detailed strings like 'I10 (Essential Hypertension)' or 'J20.9 (Acute Bronchitis)'. Return a valid JSON array of strings.`;

        const response = await ai.models.generateContent({
          model: "gemini-3.5-flash",
          contents: `Patient Complaints: "${complaint}"`,
          config: {
            systemInstruction: systemPrompt,
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                diagnosis: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING }
                }
              },
              required: ["diagnosis"]
            }
          }
        });

        const data = JSON.parse(response.text || "{}");
        return res.json({ diagnosis: data.diagnosis || [], fallback: false });
      }

      if (action === "interactions") {
        const systemPrompt = `You are a clinical pharmacologist. Evaluate the prescription medicines and patient allergies for active conflicts (Allergy warnings, dangerous drug-drug interactions, dose safety warnings, or brand duplication). Let warnings be precise, short and clinically helpful. Output must be a valid JSON array of strict warning alert strings.`;

        const prompt = `Medicines to check: ${JSON.stringify(medicines)}
Known allergies of the patient: ${JSON.stringify(allergies)}`;

        const response = await ai.models.generateContent({
          model: "gemini-3.5-flash",
          contents: prompt,
          config: {
            systemInstruction: systemPrompt,
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                alerts: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING }
                }
              },
              required: ["alerts"]
            }
          }
        });

        const data = JSON.parse(response.text || "{}");
        const alerts = data.alerts || [];
        return res.json({
          alerts: alerts.length ? alerts : ["✅ Dr. Altaf, no clinical interactions or allergy warnings matched."],
          fallback: false
        });
      }

      return res.status(400).json({ error: "Unsupported clinical action" });
    } catch (e: any) {
      console.warn("Gemini suggestion request failed (potentially due to quota limits). Falling back gracefully to localized clinical heuristics: ", e.message || e);
      return handleLocalHeuristicFallback(action, query, complaint, medicines, allergies, res);
    }
  });

  // Serve static UI assets and hand off routing to the spa index.html
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`AltafShifakhana Fullstack Engine online at port ${PORT}`);
  });
}

startServer();
