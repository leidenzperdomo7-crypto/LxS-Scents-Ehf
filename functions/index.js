/**
 * Firebase Cloud Functions for LxS Scents
 * Integration with Kling Payment Gateway (kling.is)
 */
require("dotenv").config();
const functions = require("firebase-functions");
const admin = require("firebase-admin");

if (!admin.apps.length) {
  admin.initializeApp();
}

// Helper to sanitize Kling secret key against accidental prefixing in secrets
function cleanKlingKey(rawKey) {
  if (!rawKey) return "";
  let key = String(rawKey).trim();
  while (key.startsWith("KLING_SECRET_KEY=")) {
    key = key.replace(/^KLING_SECRET_KEY=/, "").trim();
  }
  key = key.replace(/^["']|["']$/g, "").trim();
  if (key.toLowerCase().startsWith("bearer ")) {
    key = key.substring(7).trim();
  }
  return key;
}

/**
 * 1. Cloud Function Callable: createCheckoutSession
 * Receives { amount, orderId }
 * Sends POST to https://api.kling.is/v1/checkout/sessions
 * Authenticates using process.env.KLING_SECRET_KEY
 */
exports.createCheckoutSession = functions.https.onCall(async (data, context) => {
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
  } = data || {};

  if (!amount || !orderId) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Missing required fields: amount and orderId are required."
    );
  }

  const integerAmount = Math.round(Number(amount));
  if (isNaN(integerAmount) || integerAmount <= 0) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "amount must be a positive integer in ISK."
    );
  }

  const secretKey = cleanKlingKey(process.env.KLING_SECRET_KEY);
  if (!secretKey) {
    console.error("KLING_SECRET_KEY is not defined in process.env");
    throw new functions.https.HttpsError(
      "failed-precondition",
      "Kling payment gateway is not configured with KLING_SECRET_KEY."
    );
  }

  const resolvedEmail = (customer_email || customerEmail || customer?.email || "").trim().toLowerCase();
  const resolvedName = (customer_name || customerName || customer?.name || customer?.fullName || "").trim();
  const resolvedPhone = (customer_phone || customerPhone || customer?.phone || "").trim();
  const resolvedNationalId = (customer_national_id || nationalId || customer?.customer_national_id || customer?.nationalId || "").trim();
  const resolvedOrderRef = String(order_reference || orderId || "");
  const NOTES_DEFAULT = "Af hreinlætis- og öryggisástæðum er aðeins tekið við vöruskilum ef varan er óopnuð í upprunalegum umbúðum. Fyrirspurnir: lxsscents@lxsscents.is";
  const resolvedNotes = String(notes || customer?.notes || NOTES_DEFAULT);

  const resolvedShippingAddress = shipping_address || (customer?.address ? {
    line1: String(customer.address + (customer.apartment ? `, ${customer.apartment}` : "")).trim(),
    postal_code: String(customer.zip || customer.postal_code || "").trim(),
    city: String(customer.city || "").trim(),
    country: (customer.country === "Iceland" || !customer.country) ? "IS" : String(customer.country).substring(0, 2).toUpperCase()
  } : undefined);

  // 1. Estructura detallada del arreglo 'items' (SKU, nombre, tamaño/volumen y tasa de IVA)
  let resolvedItems = [];
  if (Array.isArray(items) && items.length > 0) {
    resolvedItems = items.map((it) => ({
      sku: it.sku || it.id || undefined,
      description: String(it.description || (it.name ? `${it.name}${it.size ? ' - ' + it.size : ''}` : "Fragrance")),
      amount: Math.round(Number(it.amount ?? it.discountedPrice ?? it.price ?? 0)),
      quantity: Math.max(1, Math.round(Number(it.quantity) || 1)),
      tax_rate: typeof it.tax_rate === "number" ? it.tax_rate : 24
    }));
  } else if (Array.isArray(cart) && cart.length > 0) {
    resolvedItems = cart.map((item) => {
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

  // 3. Gastos de envío: si tiene costo, agregar con sku SHIPPING y descripción
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

  try {
    const origin = process.env.APP_URL || "https://ais-dev-dvflgbgzl4td6jiwvunmod-871374270459.europe-west2.run.app";
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
    const klingRequestBody = {
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
        `Kling API responded with error status ${response.status}`;
      throw new functions.https.HttpsError(
        "internal",
        String(errorMsg)
      );
    }

    const sessionId = sessionData.id || sessionData.sessionId;
    if (!sessionId) {
      throw new functions.https.HttpsError(
        "internal",
        "Kling API did not return a valid session ID."
      );
    }

    const checkoutUrl = sessionData.url || sessionData.checkout_url;

    return {
      sessionId,
      id: sessionId,
      checkoutUrl,
      url: checkoutUrl,
      amount: integerAmount,
      currency: "ISK",
      locale: "is",
      customer_name: resolvedName,
      customer_email: resolvedEmail,
      customer_phone: resolvedPhone,
      customer_national_id: resolvedNationalId,
      shipping_address: resolvedShippingAddress,
      order_reference: resolvedOrderRef,
      notes: resolvedNotes,
      items: resolvedItems,
      orderId: String(orderId),
      ...sessionData
    };
  } catch (error) {
    console.error("Error creating Kling checkout session:", error);
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    throw new functions.https.HttpsError(
      "internal",
      error.message || "Failed to create Kling checkout session"
    );
  }
});

/**
 * 2. HTTP Endpoint version of createCheckoutSession
 * Allows direct HTTP POST calls from external clients or testing tools
 */
exports.createCheckoutSessionHttp = functions.https.onRequest(async (req, res) => {
  // CORS configuration
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return;
  }

  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed. Use POST." });
    return;
  }

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
    res.status(400).json({ error: "Missing required fields: amount and orderId are required." });
    return;
  }

  const integerAmount = Math.round(Number(amount));
  if (isNaN(integerAmount) || integerAmount <= 0) {
    res.status(400).json({ error: "amount must be a positive integer in ISK." });
    return;
  }

  const secretKey = cleanKlingKey(process.env.KLING_SECRET_KEY);
  if (!secretKey) {
    res.status(500).json({ error: "KLING_SECRET_KEY is not defined in process.env." });
    return;
  }

  const resolvedEmail = (customer_email || customerEmail || customer?.email || "").trim().toLowerCase();
  const resolvedName = (customer_name || customerName || customer?.name || customer?.fullName || "").trim();
  const resolvedPhone = (customer_phone || customerPhone || customer?.phone || "").trim();
  const resolvedNationalId = (customer_national_id || nationalId || customer?.customer_national_id || customer?.nationalId || "").trim();
  const resolvedOrderRef = String(order_reference || orderId || "");
  const NOTES_DEFAULT = "Af hreinlætis- og öryggisástæðum er aðeins tekið við vöruskilum ef varan er óopnuð í upprunalegum umbúðum. Fyrirspurnir: lxsscents@lxsscents.is";
  const resolvedNotes = String(notes || customer?.notes || NOTES_DEFAULT);

  const resolvedShippingAddress = shipping_address || (customer?.address ? {
    line1: String(customer.address + (customer.apartment ? `, ${customer.apartment}` : "")).trim(),
    postal_code: String(customer.zip || customer.postal_code || "").trim(),
    city: String(customer.city || "").trim(),
    country: (customer.country === "Iceland" || !customer.country) ? "IS" : String(customer.country).substring(0, 2).toUpperCase()
  } : undefined);

  let resolvedItems = [];
  if (Array.isArray(items) && items.length > 0) {
    resolvedItems = items.map((it) => ({
      sku: it.sku || it.id || undefined,
      description: String(it.description || (it.name ? `${it.name}${it.size ? ' - ' + it.size : ''}` : "Fragrance")),
      amount: Math.round(Number(it.amount ?? it.discountedPrice ?? it.price ?? 0)),
      quantity: Math.max(1, Math.round(Number(it.quantity) || 1)),
      tax_rate: typeof it.tax_rate === "number" ? it.tax_rate : 24
    }));
  } else if (Array.isArray(cart) && cart.length > 0) {
    resolvedItems = cart.map((item) => {
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

  try {
    const origin = process.env.APP_URL || "https://ais-dev-dvflgbgzl4td6jiwvunmod-871374270459.europe-west2.run.app";
    const response = await fetch("https://api.kling.is/v1/checkout/sessions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${secretKey.trim()}`
      },
      body: JSON.stringify({
        amount: integerAmount,
        currency: "ISK",
        locale: "is",
        customer_name: resolvedName || undefined,
        customer_email: resolvedEmail || undefined,
        customer_phone: resolvedPhone || undefined,
        customer_national_id: resolvedNationalId || undefined,
        shipping_address: resolvedShippingAddress || undefined,
        order_reference: resolvedOrderRef || undefined,
        notes: resolvedNotes,
        items: resolvedItems && resolvedItems.length > 0 ? resolvedItems : undefined,
        customer: {
          name: resolvedName || undefined,
          email: resolvedEmail || undefined,
          phone: resolvedPhone || undefined,
          national_id: resolvedNationalId || undefined,
          address: resolvedShippingAddress ? {
            line1: resolvedShippingAddress.line1,
            city: resolvedShippingAddress.city,
            postal_code: resolvedShippingAddress.postal_code,
            country: resolvedShippingAddress.country
          } : undefined
        },
        prefill: {
          name: resolvedName || undefined,
          email: resolvedEmail || undefined,
          phone: resolvedPhone || undefined
        },
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
      })
    });

    const sessionData = await response.json().catch(() => ({}));

    if (!response.ok) {
      const errorMsg =
        (typeof sessionData.error === "object" ? sessionData.error?.message : sessionData.error) ||
        sessionData.message ||
        `Kling API error: ${response.status}`;
      res.status(response.status).json({
        error: String(errorMsg),
        details: sessionData
      });
      return;
    }

    res.status(200).json({
      sessionId: sessionData.id || sessionData.sessionId,
      id: sessionData.id || sessionData.sessionId,
      ...sessionData
    });
  } catch (err) {
    res.status(500).json({ error: err.message || "Internal server error" });
  }
});
