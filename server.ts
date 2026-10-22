import express, { Request, Response } from "express";
import fs from "fs";
import path from "path";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";

// Helper to sanitize Kling secret key against accidental prefixing
function cleanKlingKey(rawKey: string | undefined): string {
  if (!rawKey) return "";
  let key = rawKey.trim();
  while (key.startsWith("KLING_SECRET_KEY=")) {
    key = key.replace(/^KLING_SECRET_KEY=/, "").trim();
  }
  key = key.replace(/^["']|["']$/g, "").trim();
  if (key.toLowerCase().startsWith("bearer ")) {
    key = key.substring(7).trim();
  }
  return key;
}

// Load environment variables
dotenv.config();
if (!process.env.KLING_SECRET_KEY && fs.existsSync(path.join(process.cwd(), "functions", ".env"))) {
  dotenv.config({ path: path.join(process.cwd(), "functions", ".env") });
}
if (process.env.KLING_SECRET_KEY) {
  process.env.KLING_SECRET_KEY = cleanKlingKey(process.env.KLING_SECRET_KEY);
}

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  // JSON request body parser
  app.use(express.json());

  // Initialize Gemini client securely server-side
  let ai: GoogleGenAI | null = null;
  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey) {
    ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  } else {
    console.warn("WARNING: GEMINI_API_KEY is not defined. Scent Sommelier will fall back to elegant local curated recommendations.");
  }

  // API Endpoint: Beautiful Scent Sommelier using gemini-2.5-flash
  app.post("/api/scent-sommelier", async (req: Request, res: Response) => {
    try {
      const { mood, aesthetic, genderPref, intensity, materials, dynamicNotes } = req.body;
      if (!mood || !aesthetic) {
        return res.status(400).json({ error: "Mood and aesthetic preferences are required." });
      }

      if (!ai) {
        return res.json({
          fallback: true,
          name: "Santal Crépuscule",
          concentration: "Extrait de Parfum",
          percentage: "26% Concentration",
          poeticDescription: "A soft, nocturnal whisper of burning cedar and salted cardamoms. Inspired by sunset skylines and cashmere cardigans. Santal Crépuscule wraps the wearer in an intimate, creamy sandalwood veneer, balanced beautifully with cold metal whispers and warm dry soil underfoot. It is both silent and unyielding.",
          classification: "Creamy-Smoky Wood",
          topNotes: ["Crushed Cardamom", "Bergamot Zest", "Black Pepper"],
          heartNotes: ["Creamy Sandalwood", "White Iris", "Incense Smoke"],
          baseNotes: ["Virginian Cedar", "Salted Vetiver", "Liquid Ambergris"],
          colorPalette: ["#141311", "#A68A56", "#E8D9BD", "#615743"],
          season: "Autumn / Evening",
          sillage: "Intimate, clean sillage that lingers close to the skin",
          ritual: "Apply twice onto the pulse points, then mist into the hair tips to gently command any room you walk into."
        });
      }

      const prompt = `Create a brand new bespoke luxury perfume signature from a fictional, ultra-high-end niche house named "Maison d'Éternité". The fragrance should be an artisan creation reflecting these user vectors:
- Scent Profile Preference / Mood: ${mood} (e.g. nocturnal, minimalist, smoking incense, velvet)
- Personal Style / Aesthetic: ${aesthetic} (e.g. Tom Ford black suits, understated linen, avant-garde goth)
- Intensity / Aura Weight: ${intensity || "Medium Extrait"} 
- Selected scent direction: ${genderPref || "Genderfluid/Neutral"}
- Favoured botanical/raw compounds: ${materials ? materials.join(", ") : "Warm woods, resins"}
- Additional sensory thoughts: ${dynamicNotes || "None"}
Write in a highly poetic, decadent, chic fashion-editorial tone (resembling Tom Ford Beauty, Byredo, and Frederic Malle documentation). Avoid standard marketing templates; make it sound incredibly rare, sophisticated, and artistic. Make sure you use the designated JSON response schema structure.`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          systemInstruction: `You are the master designer and lead nose (parfumeur) for Maison d'Éternité. You speak in concise, beautiful, luxury-brand copy (chic, avant-garde, expensive). Return a perfectly structured JSON matches the required schema. Ensure colorPalette comprises 4 gorgeous luxury color HEX codes aligning with the perfume's mood.`,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              name: {
                type: Type.STRING,
                description: "The name of the custom fragrance, elegant in French/English mixed, e.g. L'Heure Fumée, Cashmere Oud.",
              },
              concentration: {
                type: Type.STRING,
                description: "Concentration type: 'Extrait de Parfum', 'Eau de Parfum Intense', or 'Parfum'."
              },
              percentage: {
                type: Type.STRING,
                description: "Scent concentration value, e.g. '28% Vol', '24% Concentration'."
              },
              poeticDescription: {
                type: Type.STRING,
                description: "A sensory, immersive editorial review (3-4 poetic, atmospheric sentences) describing the aroma, the imagery it inspires, and the emotion it conveys."
              },
              classification: {
                type: Type.STRING,
                description: "Scent profile family category, e.g., 'Nocturnal Amber-Leather', 'Chilled Mineral Aquatic'."
              },
              topNotes: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Precisely 3 sparkling top notes that represent the opening whiff."
              },
              heartNotes: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Precisely 3 gorgeous middle heart notes representing the body of the scent."
              },
              baseNotes: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Precisely 3 warm lingering base notes that hold persistence."
              },
              colorPalette: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "4 dark luxurious hex codes representing coordinates of the scent aura (e.g. #0A0A0A, #D4AF37)."
              },
              season: {
                type: Type.STRING,
                description: "The optimal temporal wear climate/season, e.g., 'Sartorial Autumn Nights', 'Dewy Spring Dawn'."
              },
              sillage: {
                type: Type.STRING,
                description: "Describe the trailing trail/sillage, e.g., 'Hypnotic, long trailing presence', 'Quietly devastating, close aura'."
              },
              ritual: {
                type: Type.STRING,
                description: "A decadent, luxurious ceremony advice for applying this specialized scent."
              }
            },
            required: [
              "name",
              "concentration",
              "percentage",
              "poeticDescription",
              "classification",
              "topNotes",
              "heartNotes",
              "baseNotes",
              "colorPalette",
              "season",
              "sillage",
              "ritual"
            ]
          }
        }
      });

      const responseText = response.text || "{}";
      const scentData = JSON.parse(responseText.trim());
      return res.json(scentData);
    } catch (error) {
      console.error("Gemini Scent Sommelier generation error:", error);
      return res.status(500).json({ error: "Failed to compose custom perfume." });
    }
  });

  // API Endpoint: Kling (kling.is) Checkout Session Creator
  const handleKlingSession = async (req: Request, res: Response) => {
    try {
      const {
        amount,
        orderId,
        order_reference,
        notes,
        customer,
        customerEmail,
        customerName,
        customerPhone,
        customer_email,
        customer_name,
        customer_phone,
        customer_national_id,
        nationalId,
        shipping_address,
        currency = "ISK",
        locale = "is",
        items,
        cart,
        shippingCost,
        shipping,
        shippingMethodName
      } = req.body || {};

      if (!amount || !orderId) {
        return res.status(400).json({ error: "Missing required parameters: amount and orderId are required." });
      }

      const integerAmount = Math.round(Number(amount));
      if (isNaN(integerAmount) || integerAmount <= 0) {
        return res.status(400).json({ error: "Amount must be a positive integer in ISK." });
      }

      const secretKey = cleanKlingKey(process.env.KLING_SECRET_KEY);
      const origin = process.env.APP_URL || `${req.protocol}://${req.get("host")}`;

      const resolvedEmail = (customer_email || customerEmail || customer?.email || "").trim().toLowerCase();
      const resolvedName = (customer_name || customerName || customer?.name || customer?.fullName || "").trim();
      const resolvedPhone = (customer_phone || customerPhone || customer?.phone || "").trim();
      const resolvedNationalId = (customer_national_id || nationalId || customer?.customer_national_id || customer?.nationalId || "").trim();
      const resolvedOrderRef = String(order_reference || orderId || "");
      const NOTES_DEFAULT = "Af hreinlætis- og öryggisástæðum er aðeins tekið við vöruskilum ef varan er óopnuð í upprunalegum umbúðum. Fyrirspurnir: lxsscents@lxsscents.is";
      const resolvedNotes = String(notes || customer?.notes || NOTES_DEFAULT);

      // Shipping address formatting
      const resolvedShippingAddress = shipping_address || (customer?.address ? {
        line1: String(customer.address + (customer.apartment ? `, ${customer.apartment}` : "")).trim(),
        postal_code: String(customer.zip || customer.postal_code || "").trim(),
        city: String(customer.city || "").trim(),
        country: (customer.country === "Iceland" || !customer.country) ? "IS" : String(customer.country).substring(0, 2).toUpperCase()
      } : undefined);

      // 1. Estructura detallada del arreglo 'items' (SKU, nombre, tamaño/volumen y tasa de IVA)
      let resolvedItems: Array<{ sku?: string; description: string; amount: number; quantity: number; tax_rate: number }> = [];

      if (Array.isArray(items) && items.length > 0) {
        resolvedItems = items.map((it: any) => ({
          sku: it.sku || it.id || undefined,
          description: String(it.description || (it.name ? `${it.name}${it.size ? ' - ' + it.size : ''}` : "Fragrance")),
          amount: Math.round(Number(it.amount ?? it.discountedPrice ?? it.price ?? 0)),
          quantity: Math.max(1, Math.round(Number(it.quantity) || 1)),
          tax_rate: typeof it.tax_rate === "number" ? it.tax_rate : 24
        }));
      } else if (Array.isArray(cart) && cart.length > 0) {
        resolvedItems = cart.map((item: any) => {
          const name = item.name || item.fragrance?.name || "Product";
          const size = item.size || item.sizeSelected || item.fragrance?.size || "";
          const price = typeof item.discountedPrice === "number"
            ? item.discountedPrice
            : (typeof item.price === "number" ? item.price : (item.fragrance?.price || 0));
          const sku = (item.sku || item.id || item.fragrance?.id || "LXS-ITEM").toUpperCase();
          return {
            sku,
            description: `${name}${size ? ' - ' + size : ''}`,
            amount: Math.round(Number(price)),
            quantity: Math.max(1, Math.round(Number(item.quantity) || 1)),
            tax_rate: 24
          };
        });
      }

      // 3. Gastos de envío: si tiene costo, agregar con sku SHIPPING y descripción detallada
      const resolvedShippingCost = Math.round(Number(shippingCost ?? shipping ?? 0));
      const hasShippingItem = resolvedItems.some((it) =>
        (it.sku && String(it.sku).toUpperCase() === "SHIPPING") ||
        it.description.toLowerCase().includes("sendingarkostnaður") ||
        it.description.toLowerCase().includes("shipping")
      );
      if (resolvedShippingCost > 0 && !hasShippingItem) {
        resolvedItems.push({
          sku: "SHIPPING",
          description: `Sendingarkostnaður (${shippingMethodName || 'Heimsending / Dropp'})`,
          amount: resolvedShippingCost,
          quantity: 1,
          tax_rate: 24
        });
      }

      if (!secretKey || secretKey === "MY_KLING_SECRET_KEY") {
        console.warn("Aviso: KLING_SECRET_KEY no configurada. Usando sesión simulada.");
        const simulatedSessionId = `kling_sim_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        return res.json({
          sessionId: simulatedSessionId,
          id: simulatedSessionId,
          amount: integerAmount,
          currency: "ISK",
          locale: "is",
          customer_name: resolvedName,
          customer_email: resolvedEmail,
          customer_phone: resolvedPhone || undefined,
          customer_national_id: resolvedNationalId || undefined,
          shipping_address: resolvedShippingAddress || undefined,
          order_reference: resolvedOrderRef,
          notes: resolvedNotes,
          items: resolvedItems,
          metadata: {
            orderId: String(orderId),
            order_reference: resolvedOrderRef,
            customerName: resolvedName,
            customerEmail: resolvedEmail,
            customerPhone: resolvedPhone,
            customerNationalId: resolvedNationalId,
            notes: resolvedNotes
          },
          customer: {
            name: resolvedName,
            email: resolvedEmail,
            phone: resolvedPhone,
            national_id: resolvedNationalId || undefined
          },
          prefill: {
            name: resolvedName,
            email: resolvedEmail,
            phone: resolvedPhone
          },
          simulated: true,
          message: "Modo simulador activo. Agrega tu clave en Secrets para pagos reales con Kling."
        });
      }

      // Prepare line items according to Kling.is schema: description, amount, quantity, tax_rate
      const formattedItems = (resolvedItems && resolvedItems.length > 0)
        ? resolvedItems.map((it) => ({
            description: String(it.description || "Ilmvatn"),
            amount: Math.round(Number(it.amount)),
            quantity: Math.max(1, Math.round(Number(it.quantity) || 1)),
            tax_rate: typeof it.tax_rate === "number" ? it.tax_rate : 24
          }))
        : [];

      // Align items sum to integerAmount so there's never a rounding discrepancy
      if (formattedItems.length > 0) {
        const sum = formattedItems.reduce((acc, it) => acc + (it.amount * it.quantity), 0);
        const diff = integerAmount - sum;
        if (diff !== 0) {
          formattedItems[0].amount += Math.round(diff / formattedItems[0].quantity);
        }
      }

      // Build Kling request payload: either 'items' OR 'amount', NEVER both!
      const klingRequestBody: Record<string, any> = {
        currency: "ISK",
        locale: locale === "en" ? "en" : "is",
        success_url: `${origin}/?payment_status=success&order_id=${encodeURIComponent(orderId)}`,
        cancel_url: `${origin}/?payment_status=cancelled&order_id=${encodeURIComponent(orderId)}`,
        metadata: {
          orderId: String(orderId),
          order_reference: resolvedOrderRef,
          customerName: resolvedName,
          customerEmail: resolvedEmail,
          customerPhone: resolvedPhone,
          customerNationalId: resolvedNationalId,
          notes: resolvedNotes
        }
      };

      if (resolvedName) klingRequestBody.customer_name = resolvedName;
      if (resolvedEmail) klingRequestBody.customer_email = resolvedEmail;
      if (resolvedPhone) klingRequestBody.customer_phone = resolvedPhone;
      if (resolvedNationalId) klingRequestBody.customer_national_id = resolvedNationalId;
      if (resolvedShippingAddress) klingRequestBody.shipping_address = resolvedShippingAddress;
      if (resolvedOrderRef) klingRequestBody.order_reference = resolvedOrderRef;
      if (resolvedNotes) klingRequestBody.notes = resolvedNotes;

      if (formattedItems.length > 0) {
        klingRequestBody.items = formattedItems;
      } else {
        klingRequestBody.amount = integerAmount;
      }

      const response = await fetch("https://api.kling.is/v1/checkout/sessions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${secretKey.trim()}`
        },
        body: JSON.stringify(klingRequestBody)
      });

      const sessionData = await response.json().catch(() => ({}));

      if (!response.ok) {
        console.error("Kling API Error:", response.status, sessionData);
        const errorMsg =
          (typeof sessionData.error === "object" ? sessionData.error?.message : sessionData.error) ||
          sessionData.message ||
          `Kling API error: ${response.status}`;
        return res.status(response.status).json({
          error: errorMsg,
          details: sessionData
        });
      }

      const sessionId = sessionData.id || sessionData.sessionId;
      const checkoutUrl = sessionData.url || sessionData.checkout_url;

      return res.json({
        sessionId,
        id: sessionId,
        checkoutUrl,
        url: checkoutUrl,
        amount: integerAmount,
        currency: "ISK",
        metadata: {
          orderId: String(orderId),
          customerName: resolvedName,
          customerEmail: resolvedEmail
        },
        ...sessionData
      });
    } catch (err: any) {
      console.error("Error creating Kling checkout session:", err);
      return res.status(500).json({ error: err.message || "Failed to create Kling checkout session" });
    }
  };

  app.post("/api/create-checkout-session", handleKlingSession);
  app.post("/createCheckoutSession", handleKlingSession);

  // API Endpoint: Wish Scent notification logging and routing to lxsscents@lxsscents.is
  app.post("/api/wish-scent", async (req: Request, res: Response) => {
    try {
      const { fragranceName, userEmail, userName } = req.body || {};
      const subject = "Ný ósk um ilm / Nueva solicitud de fragancia";
      console.log(`[WISH SCENT RECEIVED] Target: lxsscents@lxsscents.is | Subject: "${subject}" | From: ${userName || "User"} <${userEmail}> | Scent/Product: "${fragranceName}"`);
      return res.json({
        success: true,
        message: "Takk fyrir ábendinguna! Við skoðum þennan ilm.",
        data: { fragranceName, userEmail, userName, receivedAt: new Date().toISOString() }
      });
    } catch (err: any) {
      console.error("Error logging wish scent in server:", err);
      return res.status(500).json({ error: "Failed to process wish scent notification" });
    }
  });

  // Handle Vite Asset Serving and Routing
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
      },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const cwdDist = path.join(process.cwd(), "dist");
    const dirnameDist = typeof __dirname !== "undefined" ? __dirname : "";
    const distPath = fs.existsSync(path.join(cwdDist, "index.html"))
      ? cwdDist
      : (dirnameDist && fs.existsSync(path.join(dirnameDist, "index.html")) ? dirnameDist : cwdDist);
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Luxury full-stack server running on http://localhost:${PORT}`);
  });
}

startServer();
