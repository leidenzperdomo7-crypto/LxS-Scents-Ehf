import React, { useState, useEffect } from "react";
import {
  ArrowLeft,
  Lock,
  CheckCircle,
  Truck,
  Sparkles,
  ChevronRight,
  Crown,
  PackageCheck,
  Clock,
  MapPin,
  ExternalLink,
  Printer,
  Tag,
  ShieldCheck,
  FileText,
  Play,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  X
} from "lucide-react";
import { CartItem } from "../types";
import { Language } from "../translations";
import { getIskPriceNumber } from "../data";
import {
  auth,
  saveOrderToFirestore,
  clearUserCartInFirestore,
  saveUserCartToFirestore,
  updateOrderStatusInFirestore,
  getUserProfile,
  onAuthStateChanged,
  createKlingCheckoutSession,
  loadKlingScript,
  OrderData
} from "../firebase";
import ReceiptModal from "./ReceiptModal";
import OrderTrackingModal from "./OrderTrackingModal";

const COUNTRIES = [
  "Iceland", "Afghanistan", "Albania", "Algeria", "Andorra", "Angola", "Antigua and Barbuda", "Argentina", "Armenia", "Australia", "Austria", "Azerbaijan",
  "Bahamas", "Bahrain", "Bangladesh", "Barbados", "Belarus", "Belgium", "Belize", "Benin", "Bhutan", "Bolivia", "Bosnia and Herzegovina", "Botswana", "Brazil", "Brunei", "Bulgaria", "Burkina Faso", "Burundi",
  "Cabo Verde", "Cambodia", "Cameroon", "Canada", "Central African Republic", "Chad", "Chile", "China", "Colombia", "Comoros", "Congo", "Costa Rica", "Croatia", "Cuba", "Cyprus", "Czechia",
  "Democratic Republic of the Congo", "Denmark", "Djibouti", "Dominica", "Dominican Republic",
  "Ecuador", "Egypt", "El Salvador", "Equatorial Guinea", "Eritrea", "Estonia", "Eswatini", "Ethiopia",
  "Fiji", "Finland", "France",
  "Gabon", "Gambia", "Georgia", "Germany", "Ghana", "Greece", "Grenada", "Guatemala", "Guinea", "Guinea-Bissau", "Guyana",
  "Haiti", "Honduras", "Hungary",
  "India", "Indonesia", "Iran", "Iraq", "Ireland", "Israel", "Italy", "Ivory Coast",
  "Jamaica", "Japan", "Jordan",
  "Kazakhstan", "Kenya", "Kiribati", "Kuwait", "Kyrgyzstan",
  "Laos", "Latvia", "Lebanon", "Lesotho", "Liberia", "Libya", "Liechtenstein", "Lithuania", "Luxembourg",
  "Madagascar", "Malawi", "Malaysia", "Maldives", "Mali", "Malta", "Marshall Islands", "Mauritania", "Mauritius", "Mexico", "Micronesia", "Moldova", "Monaco", "Mongolia", "Montenegro", "Morocco", "Mozambique", "Myanmar",
  "Namibia", "Nauru", "Nepal", "Netherlands", "New Zealand", "Nicaragua", "Niger", "Nigeria", "North Korea", "North Macedonia", "Norway",
  "Oman",
  "Pakistan", "Palau", "Palestine", "Panama", "Papua New Guinea", "Paraguay", "Peru", "Philippines", "Poland", "Portugal",
  "Qatar",
  "Romania", "Russia", "Rwanda",
  "Saint Kitts and Nevis", "Saint Lucia", "Saint Vincent and the Grenadines", "Samoa", "San Marino", "Sao Tome and Principe", "Saudi Arabia", "Senegal", "Serbia", "Seychelles", "Sierra Leone", "Singapore", "Slovakia", "Slovenia", "Solomon Islands", "Somalia", "South Africa", "South Korea", "South Sudan", "Spain", "Sri Lanka", "Sudan", "Suriname", "Sweden", "Switzerland", "Syria",
  "Taiwan", "Tajikistan", "Tanzania", "Thailand", "Timor-Leste", "Togo", "Tonga", "Trinidad and Tobago", "Tunisia", "Turkey", "Turkmenistan", "Tuvalu",
  "Uganda", "Ukraine", "United Arab Emirates", "United Kingdom", "United States", "Uruguay", "Uzbekistan",
  "Vanuatu", "Venezuela", "Vietnam",
  "Yemen",
  "Zambia", "Zimbabwe"
];

export interface ShippingMethodOption {
  id: string;
  name: string;
  nameEs: string;
  nameIs: string;
  carrier: "Dropp" | "Íslandspóstur" | "DHL Express" | "Pósturinn";
  basePrice: number;
  freeThreshold: number;
  estimatedTime: string;
  estimatedTimeIs: string;
  estimatedTimeEs: string;
  descriptionIs: string;
  descriptionEs: string;
  descriptionEn: string;
  onlyForCountry?: string;
  excludeCountry?: string;
}

const SHIPPING_METHODS: ShippingMethodOption[] = [
  {
    id: "dropp-pickup",
    name: "Dropp — Pick-up Point / Smart Locker",
    nameEs: "Dropp — Punto de recogida / Casillero",
    nameIs: "Dropp — Afhendingarstaður / Póstlúga",
    carrier: "Dropp",
    basePrice: 900,
    freeThreshold: 10000,
    estimatedTime: "1 - 2 business days",
    estimatedTimeIs: "1 - 2 virkir dagar",
    estimatedTimeEs: "1 - 2 días hábiles",
    descriptionIs: "Sækja á Dropp afhendingarstað á höfuðborgarsvæðinu og landsbyggðinni.",
    descriptionEs: "Recogida rápida en casillero inteligente o tienda Dropp con código SMS.",
    descriptionEn: "Pick up at a Dropp delivery point in the Reykjavík capital area or elsewhere in Iceland.",
    onlyForCountry: "Iceland"
  },
  {
    id: "posturinn-international",
    name: "Pósturinn — International Shipping",
    nameEs: "Pósturinn — Envío Internacional",
    nameIs: "Pósturinn — Sending til útlanda",
    carrier: "Pósturinn",
    basePrice: 2500,
    freeThreshold: Infinity,
    estimatedTime: "Estimated delivery time varies by destination.",
    estimatedTimeIs: "Áætlaður afhendingartími fer eftir áfangastað.",
    estimatedTimeEs: "El tiempo estimado de entrega varía según el destino.",
    descriptionIs: "Rekjanleg sending á áfangastað.\nSendingarkostnaður reiknast í greiðslugátt.",
    descriptionEs: "Envío con seguimiento al destino.\nGastos de envío calculados al finalizar la compra.",
    descriptionEn: "Tracked delivery to destination.\nShipping calculated at checkout.",
    excludeCountry: "Iceland"
  }
];

interface CheckoutPageProps {
  cart: CartItem[];
  language: Language;
  onBack: () => void;
  onClearCart: () => void;
  appliedCoupon?: { code: string; percent: number } | null;
  onCouponChange?: (coupon: { code: string; percent: number } | null) => void;
  onViewOrderTracking?: (orderId: string) => void;
  onOrderCompleted?: () => void;
}

export default function CheckoutPage({
  cart,
  language,
  onBack,
  onClearCart,
  appliedCoupon: parentCoupon,
  onCouponChange,
  onViewOrderTracking,
  onOrderCompleted
}: CheckoutPageProps) {
  // Navigation & form state
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [completedOrder, setCompletedOrder] = useState<OrderData | null>(null);

  // Modals for receipt and live tracking
  const [showReceiptModal, setShowReceiptModal] = useState<boolean>(false);
  const [showTrackingModal, setShowTrackingModal] = useState<boolean>(false);

  // Carrier & shipping method selection
  const [selectedMethodId, setSelectedMethodId] = useState<string>("dropp-pickup");
  const [spamTrapCheckout, setSpamTrapCheckout] = useState<string>("");
  const [lastOrderAttemptTime, setLastOrderAttemptTime] = useState<number>(0);

  // Checkout detail inputs
  const [fullName, setFullName] = useState<string>(() => sessionStorage.getItem("user_fullName") || localStorage.getItem("user_fullName") || "");
  const [email, setEmail] = useState<string>(() => sessionStorage.getItem("user_email") || localStorage.getItem("user_email") || "");
  const [phone, setPhone] = useState<string>(() => sessionStorage.getItem("user_phone") || localStorage.getItem("user_phone") || "");
  // Kennitala is never saved or prefilled across orders
  const [nationalId, setNationalId] = useState<string>("");
  const [address, setAddress] = useState<string>(() => sessionStorage.getItem("user_address") || localStorage.getItem("user_address") || "");
  const [apartment, setApartment] = useState<string>(() => sessionStorage.getItem("user_apartment") || localStorage.getItem("user_apartment") || "");
  const [city, setCity] = useState<string>(() => {
    const saved = sessionStorage.getItem("user_cityZip") || localStorage.getItem("user_cityZip") || "";
    if (saved) {
      const parts = saved.trim().split(/\s+/);
      if (parts.length > 0) {
        if (/^\d+/.test(parts[0])) return parts.slice(1).join(" ");
        return parts.join(" ");
      }
    }
    return sessionStorage.getItem("user_city") || localStorage.getItem("user_city") || "";
  });
  const [zip, setZip] = useState<string>(() => {
    const saved = sessionStorage.getItem("user_cityZip") || localStorage.getItem("user_cityZip") || "";
    if (saved) {
      const parts = saved.trim().split(/\s+/);
      if (parts.length > 0 && /^\d+/.test(parts[0])) {
        return parts[0].replace(/\D/g, "");
      }
    }
    const directZip = sessionStorage.getItem("user_zip") || localStorage.getItem("user_zip") || "";
    return directZip.replace(/\D/g, "");
  });
  const [country, setCountry] = useState<string>("Iceland");

  // Discount code state
  const [discountCode, setDiscountCode] = useState<string>(parentCoupon?.code || "");
  const [appliedDiscount, setAppliedDiscount] = useState<{ code: string; percent: number } | null>(parentCoupon || null);
  const [discountError, setDiscountError] = useState<string>("");
  const [discountSuccess, setDiscountSuccess] = useState<boolean>(!!parentCoupon);

  // Error validations
  const [errorMessage, setErrorMessage] = useState<string>("");

  // Clean up any historical Kennitala in storage so it never persists for future orders
  useEffect(() => {
    localStorage.removeItem("user_nationalId");
    sessionStorage.removeItem("user_nationalId");
  }, []);

  // 22. When customer has saved their address information autofill that for them in checkout
  useEffect(() => {
    const autofillAddressData = async () => {
      // 1. From sessionStorage & localStorage
      const sName = sessionStorage.getItem("user_fullName") || localStorage.getItem("user_fullName");
      const sEmail = sessionStorage.getItem("user_email") || localStorage.getItem("user_email");
      const sPhone = sessionStorage.getItem("user_phone") || localStorage.getItem("user_phone");
      const sAddress = sessionStorage.getItem("user_address") || localStorage.getItem("user_address");
      const sApartment = sessionStorage.getItem("user_apartment") || localStorage.getItem("user_apartment");
      const sCity = sessionStorage.getItem("user_city") || localStorage.getItem("user_city");
      const sZip = sessionStorage.getItem("user_zip") || localStorage.getItem("user_zip");
      const sCityZip = sessionStorage.getItem("user_cityZip") || localStorage.getItem("user_cityZip");

      if (sName) setFullName((prev) => prev || sName);
      if (sEmail) setEmail((prev) => prev || sEmail);
      if (sPhone) setPhone((prev) => prev || sPhone);
      if (sAddress) setAddress((prev) => prev || sAddress);
      if (sApartment) setApartment((prev) => prev || sApartment);
      if (sCity) setCity((prev) => prev || sCity);
      if (sZip) setZip((prev) => prev || sZip.replace(/\D/g, ""));
      if (sCityZip && (!sCity || !sZip)) {
        const parts = sCityZip.trim().split(/\s+/);
        if (parts.length > 0) {
          if (/^\d+/.test(parts[0])) {
            setZip((prev) => prev || parts[0].replace(/\D/g, ""));
            setCity((prev) => prev || parts.slice(1).join(" "));
          } else {
            setCity((prev) => prev || parts.join(" "));
          }
        }
      }

      // 2. From Firebase Auth & Firestore profile
      const user = auth.currentUser;
      if (user) {
        if (user.displayName) setFullName((prev) => prev || user.displayName || "");
        if (user.email) setEmail((prev) => prev || user.email || "");
        try {
          const profile = await getUserProfile(user.uid);
          if (profile) {
            if (profile.displayName) setFullName((prev) => prev || profile.displayName);
            if (profile.email) setEmail((prev) => prev || profile.email);
            if (profile.phone) setPhone((prev) => prev || profile.phone);
            if (profile.address) setAddress((prev) => prev || profile.address);
            if (profile.apartment) setApartment((prev) => prev || profile.apartment);
            if (profile.cityZip) {
              const parts = profile.cityZip.trim().split(/\s+/);
              if (parts.length > 0 && /^\d+/.test(parts[0])) {
                setZip((prev) => prev || parts[0].replace(/\D/g, ""));
                setCity((prev) => prev || parts.slice(1).join(" "));
              } else {
                setCity((prev) => prev || parts.join(" "));
              }
            }
          }
        } catch {
          // ignore
        }
      }
    };

    autofillAddressData();

    const unsub = onAuthStateChanged(auth, async (u) => {
      if (u) {
        if (u.displayName) setFullName((prev) => prev || u.displayName || "");
        if (u.email) setEmail((prev) => prev || u.email || "");
        try {
          const profile = await getUserProfile(u.uid);
          if (profile) {
            if (profile.displayName) setFullName((prev) => prev || profile.displayName);
            if (profile.email) setEmail((prev) => prev || profile.email);
            if (profile.phone) setPhone((prev) => prev || profile.phone);
            if (profile.address) setAddress((prev) => prev || profile.address);
            if (profile.apartment) setApartment((prev) => prev || profile.apartment);
            if (profile.cityZip) {
              const parts = profile.cityZip.trim().split(/\s+/);
              if (parts.length > 0 && /^\d+/.test(parts[0])) {
                setZip((prev) => prev || parts[0].replace(/\D/g, ""));
                setCity((prev) => prev || parts.slice(1).join(" "));
              } else {
                setCity((prev) => prev || parts.join(" "));
              }
            }
          }
        } catch {
          // ignore
        }
      }
    });

    return () => unsub();
  }, []);

  // Sync address changes to sessionStorage and localStorage so they persist across sessions
  useEffect(() => {
    if (fullName) {
      localStorage.setItem("user_fullName", fullName);
      sessionStorage.setItem("user_fullName", fullName);
    }
    if (email) {
      localStorage.setItem("user_email", email);
      sessionStorage.setItem("user_email", email);
    }
    if (phone) {
      localStorage.setItem("user_phone", phone);
      sessionStorage.setItem("user_phone", phone);
    }
    // Kennitala is never persisted or saved for the next order
    localStorage.removeItem("user_nationalId");
    sessionStorage.removeItem("user_nationalId");

    if (address) {
      localStorage.setItem("user_address", address);
      sessionStorage.setItem("user_address", address);
    }
    if (apartment) {
      localStorage.setItem("user_apartment", apartment);
      sessionStorage.setItem("user_apartment", apartment);
    }
    if (city) {
      localStorage.setItem("user_city", city);
      sessionStorage.setItem("user_city", city);
    }
    if (zip) {
      localStorage.setItem("user_zip", zip);
      sessionStorage.setItem("user_zip", zip);
    }
    if (city || zip) {
      const cz = `${zip} ${city}`.trim();
      localStorage.setItem("user_cityZip", cz);
      sessionStorage.setItem("user_cityZip", cz);
    }
    sessionStorage.setItem("session_checkout_customer", JSON.stringify({
      fullName: fullName.trim(),
      email: email.trim(),
      phone: phone.trim(),
      address: address.trim(),
      apartment: apartment.trim(),
      city: city.trim(),
      zip: zip.trim(),
      country: country.trim()
    }));
  }, [fullName, email, phone, address, apartment, city, zip, country]);

  useEffect(() => {
    if (parentCoupon) {
      setAppliedDiscount((prev) => {
        if (prev && prev.code === parentCoupon.code && prev.percent === parentCoupon.percent) {
          return prev;
        }
        return parentCoupon;
      });
      setDiscountCode((prev) => (prev === parentCoupon.code ? prev : parentCoupon.code));
      setDiscountSuccess(true);
    } else {
      setAppliedDiscount((prev) => (prev === null ? prev : null));
    }
  }, [parentCoupon?.code, parentCoupon?.percent]);

  useEffect(() => {
    const pending = localStorage.getItem("pendingDiscountCode");
    if (pending) {
      localStorage.removeItem("pendingDiscountCode");
      setDiscountCode(pending);
      applyCouponByCode(pending);
    }
  }, []);

  const calculateTotalISK = () => {
    return cart.reduce((acc, item) => {
      return acc + getIskPriceNumber(item.fragrance.id) * item.quantity;
    }, 0);
  };

  const totalISK = calculateTotalISK();

  // Discount computation
  const discountISK = appliedDiscount ? Math.round(totalISK * (appliedDiscount.percent / 100)) : 0;
  const discountedTotalISK = Math.max(0, totalISK - discountISK);

  // Active shipping methods based on selected country
  const isDomestic = country === "Iceland";
  const availableShippingMethods = SHIPPING_METHODS.filter((method) => {
    if (method.onlyForCountry) return method.onlyForCountry === country;
    if (method.excludeCountry) return method.excludeCountry !== country;
    return true;
  });

  // Whenever country changes, ensure selectedMethodId is in availableShippingMethods
  useEffect(() => {
    const targetMethod = isDomestic ? "dropp-pickup" : "posturinn-international";
    setSelectedMethodId((prev) => (prev === targetMethod ? prev : targetMethod));
  }, [isDomestic]);

  // Selected shipping calculation
  const currentMethod =
    availableShippingMethods.find((m) => m.id === selectedMethodId) ||
    availableShippingMethods[0] ||
    SHIPPING_METHODS[0];
  const isOnlySubscriptions = cart.length > 0 && cart.every((item) => item.fragrance.id.startsWith("subscription-"));
  const isShipFree =
    isOnlySubscriptions ||
    (isDomestic &&
      (discountedTotalISK >= currentMethod.freeThreshold ||
        (appliedDiscount && appliedDiscount.code === "BFSHIPPING")));

  const shippingChargeNumber = isShipFree ? 0 : currentMethod.basePrice;
  const shippingChargeISK = isShipFree
    ? language === "is"
      ? "FRÍTT"
      : language === "es"
      ? "GRATIS"
      : "FREE"
    : `${shippingChargeNumber.toLocaleString("is-IS")} kr.-`;

  const finalTotalISK = discountedTotalISK + shippingChargeNumber;

  // Icelandic VAT breakdown (24% standard rate included in retail price)
  const vskAmount = Math.round(finalTotalISK * (24 / 124));
  const netAmount = finalTotalISK - vskAmount;

  const applyCouponByCode = (codeClean: string) => {
    const code = codeClean.trim().toUpperCase();
    if (!code) {
      setDiscountError(
        language === "is"
          ? "Vinsamlegast sláðu inn afsláttarkóða."
          : language === "es"
          ? "Por favor ingresa un código de descuento."
          : "Please enter a discount code."
      );
      setDiscountSuccess(false);
      return;
    }

    let couponObj: { code: string; percent: number } | null = null;

    if (code === "NORDIC10") {
      couponObj = { code, percent: 10 };
    } else if (code === "FROST20") {
      couponObj = { code, percent: 20 };
    } else if (code === "ISLANDIA15") {
      couponObj = { code, percent: 15 };
    } else if (code === "WELCOME10" || code === "WELCOME" || code === "LXSSCENT10" || code === "LXSSCENTS10") {
      couponObj = { code, percent: 10 };
    } else if (code === "LUXURY20") {
      couponObj = { code, percent: 20 };
    } else if (code === "HONEST50" || code === "HONEST") {
      couponObj = { code, percent: 50 };
    } else if (code === "BFSHIPPING") {
      couponObj = { code, percent: 0 };
    }

    if (couponObj) {
      setAppliedDiscount(couponObj);
      setDiscountError("");
      setDiscountSuccess(true);
      if (onCouponChange) onCouponChange(couponObj);

      // Persist active cart coupon in Firestore
      if (auth.currentUser) {
        saveUserCartToFirestore(auth.currentUser.uid, cart, totalISK, couponObj.code, couponObj.percent);
      }
    } else {
      setDiscountError(
        language === "is"
          ? "Ógildur afsláttarkóði"
          : language === "es"
          ? "Código de descuento no válido"
          : "Invalid discount code"
      );
      setDiscountSuccess(false);
    }
  };

  const handleApplyDiscount = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    applyCouponByCode(discountCode);
  };

  const handleRemoveDiscount = () => {
    setAppliedDiscount(null);
    setDiscountCode("");
    setDiscountSuccess(false);
    setDiscountError("");
    if (onCouponChange) onCouponChange(null);
    if (auth.currentUser) {
      saveUserCartToFirestore(auth.currentUser.uid, cart, totalISK, "", 0);
    }
  };

  const finalizeOrder = async (
    orderPayload: Partial<OrderData>,
    generatedRef: string,
    formattedDate: string,
    formattedTotal: string,
    trackingCode: string,
    orderItems: any[]
  ) => {
    // 1. LocalStorage backup
    let existingOrders: any[] = [];
    try {
      existingOrders = JSON.parse(localStorage.getItem("userOrders") || "[]");
      if (Array.isArray(existingOrders)) {
        existingOrders = existingOrders.filter((o: any) => o.id !== "#KS120525" && o.id !== "#KS79331");
      } else {
        existingOrders = [];
      }
    } catch {
      existingOrders = [];
    }
    existingOrders.unshift({
      id: generatedRef,
      userId: auth.currentUser?.uid || "",
      customerEmail: email.trim().toLowerCase(),
      date: formattedDate,
      paymentStatus: language === "is" ? "Greitt" : language === "es" ? "Pagado" : "Paid",
      fulfillmentStatus: language === "is" ? "Í vinnslu" : language === "es" ? "En proceso" : "In processing",
      status: "paid",
      statusStep: 1,
      total: finalTotalISK,
      items: orderItems,
      carrier: currentMethod.carrier,
      trackingNumber: trackingCode,
      shippingMethod: currentMethod.name,
      customerName: fullName.trim(),
      customerAddress: address.trim(),
      customerCityZip: `${zip.trim()} ${city.trim()}`,
      paymentMethod: orderPayload.paymentMethod || "Card"
    });
    localStorage.setItem("userOrders", JSON.stringify(existingOrders));

    // 2. Persist to Firestore (both root 'orders' collection and user orders subcollection)
    try {
      await saveOrderToFirestore(auth.currentUser?.uid || "", {
        ...orderPayload,
        userId: auth.currentUser?.uid || "",
        customerEmail: email.trim().toLowerCase(),
        customerName: fullName.trim(),
        items: orderItems,
        total: finalTotalISK,
        status: "paid"
      });
      if (auth.currentUser) {
        await clearUserCartInFirestore(auth.currentUser.uid);
      }
    } catch (err) {
      console.warn("Notice saving order to Firestore:", err);
    }

    // 3. Clear cart completely upon payment - cart is ready and emptied
    onClearCart();
    try {
      localStorage.removeItem("cart");
      localStorage.removeItem("user_cart");
      localStorage.removeItem("pending_kling_order");
      localStorage.removeItem("pendingOrder");
      sessionStorage.removeItem("pending_kling_order");
      sessionStorage.removeItem("pendingOrder");
      sessionStorage.removeItem("session_checkout_customer");
    } catch {
      // ignore
    }

    // 4. Save contact details & activate session
    localStorage.setItem("user_isLoggedIn", "true");
    localStorage.setItem("user_fullName", fullName.trim());
    localStorage.setItem("user_email", email.trim().toLowerCase());
    localStorage.setItem("user_address", address.trim());
    localStorage.setItem("user_apartment", apartment.trim());
    localStorage.setItem("user_cityZip", `${zip.trim()} ${city.trim()}`);
    localStorage.setItem("user_phone", phone.trim());
    localStorage.removeItem("user_nationalId");
    sessionStorage.removeItem("user_nationalId");
    setNationalId("");

    setCompletedOrder(orderPayload as OrderData);
    setIsProcessing(false);
    setIsCompleted(true);
    window.scrollTo({ top: 0, behavior: "smooth" });

    if (onOrderCompleted) {
      onOrderCompleted();
    }
  };

  // Recover pending Kling order if redirected back with payment_status=success
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const paymentStatus = params.get("payment_status");
    if (paymentStatus === "success") {
      const pendingStr = localStorage.getItem("pending_kling_order");
      if (pendingStr) {
        try {
          const pending = JSON.parse(pendingStr);
          localStorage.removeItem("pending_kling_order");
          finalizeOrder(
            pending.orderPayload,
            pending.generatedRef,
            pending.formattedDate,
            pending.formattedTotal,
            pending.trackingCode,
            pending.orderItems
          );
        } catch (e) {
          console.error("Error finalizing returned Kling order:", e);
        }
      }
    } else if (paymentStatus === "cancelled") {
      setErrorMessage(
        language === "is"
          ? "Hætt var við greiðslu."
          : language === "es"
          ? "Se canceló la transacción."
          : "Payment was cancelled."
      );
      localStorage.removeItem("pending_kling_order");
    }
  }, []);

  const getRequiredValidationMsg = () => {
    if (language === "is") return "Vinsamlegast fylltu út allar nauðsynlegar upplýsingar fyrst";
    if (language === "es") return "Por favor, complete toda la información requerida primero";
    return "Please fill out all required information first";
  };

  const handleInvalidRequired = (e: React.FormEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    (e.target as HTMLInputElement).setCustomValidity(getRequiredValidationMsg());
  };

  const handleClearValidity = (e: React.FormEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    (e.target as HTMLInputElement).setCustomValidity("");
  };

  const validateAndPay = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !fullName.trim() ||
      !email.trim() ||
      !nationalId.trim() ||
      !address.trim() ||
      !city.trim() ||
      !zip.trim()
    ) {
      setErrorMessage(getRequiredValidationMsg());
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    // Anti-spam honeypot and rate-limit guard
    if (spamTrapCheckout) {
      console.warn("Bot checkout blocked by honeypot.");
      return;
    }
    const now = Date.now();
    if (now - lastOrderAttemptTime < 2500) {
      setErrorMessage(
        language === "is"
          ? "Vinsamlegast bíddu augnablik."
          : language === "es"
          ? "Por favor espera unos segundos antes de reintentar."
          : "Please wait a moment."
      );
      return;
    }
    setLastOrderAttemptTime(now);

    setErrorMessage("");
    setIsProcessing(true);
    const generatedRef = String(Math.floor(Math.random() * 900000) + 100000);
    const trackingPrefix = currentMethod.carrier === "Dropp" ? "DROPP-IS-" : currentMethod.carrier === "Íslandspóstur" ? "IP-IS-" : "DHL-";
    const trackingCode = `${trackingPrefix}${Math.floor(Math.random() * 899999 + 100000)}`;

    const today = new Date();
    const options: Intl.DateTimeFormatOptions = { year: "numeric", month: "long", day: "numeric" };
    const formattedDate = today.toLocaleDateString(
      language === "is" ? "is-IS" : language === "es" ? "es-ES" : "en-US",
      options
    );
    const formattedTotal = finalTotalISK.toLocaleString("is-IS") + " kr.";

    const orderItems = cart.map((item) => {
      const isSub = item.fragrance.id.startsWith("subscription-");
      const itemName = isSub
        ? (item.fragrance.id === "subscription-diamond"
            ? (language === "is" ? "DEMANTS ÁSKRIFT" : "DIAMOND Membership")
            : item.fragrance.id === "subscription-gold"
            ? (language === "is" ? "GULL ÁSKRIFT" : "GOLD Membership")
            : (language === "is" ? "Áskrift" : "Membership"))
        : item.fragrance.name;
      const itemSize = isSub
        ? (language === "is" ? "1 mánuður" : "1 month")
        : (item.sizeSelected || item.fragrance.size || "50ml");

      const itemPrice = getIskPriceNumber(item.fragrance.id) || 0;

      return {
        id: item.fragrance.id,
        name: itemName,
        variant: itemSize,
        size: itemSize,
        quantity: item.quantity,
        price: itemPrice,
        image: item.fragrance.image
      };
    });

    const trackingUrl =
      currentMethod.carrier === "Dropp"
        ? `https://dropp.is/track/${trackingCode}`
        : currentMethod.carrier === "Íslandspóstur" || currentMethod.carrier === "Pósturinn"
        ? `https://postur.is/track/${trackingCode}`
        : `https://www.dhl.com/en/express/tracking.html?AWB=${trackingCode}`;

    const orderPayload: Partial<OrderData> = {
      id: generatedRef,
      userId: auth.currentUser?.uid || "",
      customerName: fullName.trim(),
      customerEmail: email.trim().toLowerCase(),
      customerPhone: phone.trim(),
      customerAddress: address.trim(),
      customerApartment: apartment.trim(),
      customerCityZip: `${zip.trim()} ${city.trim()}`,
      customerCountry: country.trim(),
      shippingMethod: currentMethod.name,
      total: finalTotalISK,
      subtotal: totalISK,
      discount: discountISK,
      shipping: shippingChargeNumber,
      discountCode: appliedDiscount?.code || "",
      paymentMethod: "Card",
      paymentStatus: language === "is" ? "Greitt" : language === "es" ? "Pagado" : "Paid",
      status: "paid", // Required: "paid" or "completed"
      statusStep: 1,
      carrier: currentMethod.carrier,
      trackingNumber: trackingCode,
      trackingUrl: trackingUrl,
      estimatedDelivery: currentMethod.estimatedTime,
      items: orderItems,
      itemsSummary: orderItems.map((it) => `${it.name} (${it.variant}) x${it.quantity}`).join(", "),
      date: formattedDate
    };

    const NOTES_TEXT = "Af hreinlætis- og öryggisástæðum er aðeins tekið við vöruskilum ef varan er óopnuð í upprunalegum umbúðum. Fyrirspurnir: lxsscents@lxsscents.is";
    const discountMultiplier = appliedDiscount ? Math.max(0, 1 - (appliedDiscount.percent / 100)) : 1;
    const shippingMethodName = currentMethod
      ? (language === "is" ? currentMethod.nameIs : currentMethod.name)
      : "Heimsending / Dropp";

    const customerPayload = {
      name: fullName.trim(),
      fullName: fullName.trim(),
      customer_name: fullName.trim(),
      email: email.trim().toLowerCase(),
      customer_email: email.trim().toLowerCase(),
      phone: phone.trim(),
      customer_phone: phone.trim(),
      nationalId: nationalId.trim(),
      customer_national_id: nationalId.trim() || undefined,
      address: address.trim(),
      apartment: apartment.trim(),
      city: city.trim(),
      zip: zip.trim(),
      country: country.trim(),
      shipping_address: {
        line1: address.trim() + (apartment.trim() ? `, ${apartment.trim()}` : ""),
        postal_code: zip.trim(),
        city: city.trim(),
        country: (country === "Iceland" || !country) ? "IS" : country.substring(0, 2).toUpperCase()
      },
      order_reference: generatedRef,
      notes: NOTES_TEXT,
      currency: "ISK",
      locale: "is",
      shippingMethodName
    };
    sessionStorage.setItem("session_checkout_customer", JSON.stringify(customerPayload));

    // 1. Estructura detallada del arreglo 'items' (SKU, nombre, tamaño/volumen y tasa de IVA)
    const klingItems: Array<{
      sku: string;
      description: string;
      amount: number;
      quantity: number;
      tax_rate: number;
    }> = cart.map((item) => {
      const isSub = item.fragrance.id.startsWith("subscription-");
      const itemName = isSub
        ? (item.fragrance.id === "subscription-diamond"
            ? (language === "is" ? "DEMANTS ÁSKRIFT" : "DIAMOND Membership")
            : (language === "is" ? "GULL ÁSKRIFT" : "GOLD Membership"))
        : (item.fragrance.name || (item as any).name || "Ilmvatn");
      const itemSize = isSub
        ? (language === "is" ? "1 mánuður" : "1 month")
        : (item.sizeSelected || item.fragrance.size || (item as any).size || "");
      const basePrice = getIskPriceNumber(item.fragrance.id) || item.fragrance.price || (item as any).price || 0;
      
      // 2. Manejo de Descuentos: calcula el precio final unitario prorrateado en ISK entero
      const unitFinalPrice = appliedDiscount
        ? Math.round(basePrice * discountMultiplier)
        : Math.round(basePrice);
      const sku = (item.fragrance.id || (item as any).sku || (item as any).id || "LXS-ITEM").toUpperCase();

      return {
        sku,
        description: `${itemName}${itemSize ? " - " + itemSize : ""}`,
        amount: Math.round(unitFinalPrice), // Precio final unitario en ISK entero
        quantity: item.quantity,
        tax_rate: 24 // 24% VSK estándar en Islandia
      };
    });

    // 2. Ajuste de precisión por redondeo de ISK para que coincida exactamente con finalTotalISK - shipping
    const targetItemsTotal = Math.max(0, totalISK - discountISK);
    const currentItemsSum = klingItems.reduce((acc, it) => acc + it.amount * it.quantity, 0);
    const roundingDiff = targetItemsTotal - currentItemsSum;
    if (roundingDiff !== 0 && klingItems.length > 0) {
      klingItems[0].amount += Math.round(roundingDiff / klingItems[0].quantity);
    }

    // 3. Gastos de envío: Si el envío tiene costo, agrégalo a 'items'
    if (shippingChargeNumber > 0) {
      klingItems.push({
        sku: "SHIPPING",
        description: `Sendingarkostnaður (${shippingMethodName || 'Heimsending / Dropp'})`,
        amount: Math.round(shippingChargeNumber),
        quantity: 1,
        tax_rate: 24
      });
    }

    // Save pending order so it can be restored and completed upon returning from Kling
    localStorage.setItem("pending_kling_order", JSON.stringify({
      orderPayload,
      generatedRef,
      formattedDate,
      formattedTotal,
      trackingCode,
      orderItems
    }));

    // Pre-save customer profile details
    localStorage.setItem("user_fullName", fullName.trim());
    localStorage.setItem("user_email", email.trim().toLowerCase());
    localStorage.setItem("user_address", address.trim());
    localStorage.setItem("user_apartment", apartment.trim());
    localStorage.setItem("user_cityZip", `${zip.trim()} ${city.trim()}`);
    localStorage.setItem("user_phone", phone.trim());

    try {
      const sessionResult = await createKlingCheckoutSession(
        finalTotalISK,
        generatedRef,
        customerPayload,
        klingItems,
        shippingChargeNumber,
        {
          notes: NOTES_TEXT,
          orderReference: generatedRef,
          shippingMethodName
        }
      );

      const { sessionData } = sessionResult;
      const checkoutUrl = sessionData?.url || sessionData?.checkoutUrl || sessionData?.short_url;

      // Mode A: If simulated session (e.g. testing without key), finalize directly
      if (sessionData?.simulated) {
        await finalizeOrder(orderPayload, generatedRef, formattedDate, formattedTotal, trackingCode, orderItems);
        return;
      }

      // Mode B: Live Kling checkout gateway -> redirect to Kling
      if (checkoutUrl) {
        try {
          if (window.top && window.top !== window) {
            window.top.location.href = checkoutUrl;
          } else {
            window.location.href = checkoutUrl;
          }
        } catch {
          window.location.href = checkoutUrl;
        }
        return;
      }

      // Fallback
      await finalizeOrder(orderPayload, generatedRef, formattedDate, formattedTotal, trackingCode, orderItems);
    } catch (err: any) {
      console.error("Kling payment initiation error:", err);
      setIsProcessing(false);
      setErrorMessage(
        language === "is"
          ? (err.message || "Ekki tókst að tengjast Kling. Vinsamlegast reyndu aftur.")
          : language === "es"
          ? (err.message || "No se pudo conectar con la pasarela de Kling. Por favor intenta de nuevo.")
          : (err.message || "Unable to connect with Kling payment gateway. Please try again.")
      );
    }
  };

  const handleFinish = () => {
    onClearCart();
    setNationalId("");
    setIsCompleted(false);
    onBack();
  };



  // ==================== RECEIPT & REAL-TIME TRACKING COMPLETION SCREEN ====================
  if (isCompleted && completedOrder) {
    return (
      <div id="checkout-completion-screen" className="max-w-2xl mx-auto px-4 sm:px-6 py-16 sm:py-24 text-center font-sans">
        <div className="inline-block p-4 sm:p-5 rounded-full bg-emerald-500/10 border border-emerald-500/30 mb-6">
          <CheckCircle className="w-12 h-12 text-emerald-600 mx-auto" />
        </div>

        <p className="text-[11px] tracking-[0.3em] text-[#b2903b] font-mono uppercase mb-2 font-bold">
          {language === "is"
            ? "PÖNTUN STAÐFEST & SKRÁÐ Í FIRESTORE"
            : language === "es"
            ? "COMPRA CONFIRMADA & GUARDADA EN FIRESTORE"
            : "ORDER CONFIRMED & SAVED IN FIRESTORE"}
        </p>

        <h2 className="font-serif text-3xl sm:text-4xl italic text-neutral-900 mb-3">
          {language === "is" ? "Takk fyrir pöntunina þína" : language === "es" ? "Gracias por su compra" : "Thank you for your order"}
        </h2>

        <p className="text-xs sm:text-sm text-neutral-600 max-w-md mx-auto leading-relaxed mb-6">
          {language === "is"
            ? "Pöntunin þín hefur verið vistuð í gagnagrunni og verður pökkuð og send með hitastýrðri gæðaþjónustu."
            : language === "es"
            ? "Su pedido ha sido registrado con éxito en Firestore. Puede generar su recibo de compra y seguir el estado en tiempo real."
            : "Your order has been recorded in Firestore. You can inspect your official receipt and live shipment tracking below."}
        </p>

        {/* Real-time Order Tracking Status Card */}
        <div className="bg-white border border-[#b2903b]/30 rounded-2xl p-6 text-left space-y-6 shadow-lg mb-8">
          {/* Header reference */}
          <div className="flex flex-wrap justify-between items-center pb-4 border-b border-neutral-100 gap-2">
            <div>
              <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-widest block">
                {language === "is" ? "Pöntunarnúmer" : language === "es" ? "Número de Pedido" : "Order ID"}
              </span>
              <span className="text-base sm:text-xl font-mono font-bold text-[#b2903b]">
                {completedOrder.id}
              </span>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-widest block">
                {language === "is" ? "Flutningsaðili" : language === "es" ? "Transportista" : "Carrier"}
              </span>
              <span className="text-xs font-semibold text-neutral-800 flex items-center gap-1 justify-end">
                <Truck className="w-3.5 h-3.5 text-[#b2903b]" />
                {completedOrder.carrier}
              </span>
            </div>
          </div>

          {/* Stepper Progress Bar: 3 States */}
          <div className="space-y-3">
            <div className="text-xs font-semibold text-neutral-800 flex justify-between items-center">
              <span>{language === "is" ? "Staða sendingar í rauntíma:" : language === "es" ? "Seguimiento en tiempo real:" : "Live tracking status:"}</span>
              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold ${
                completedOrder.statusStep === 3
                  ? "bg-emerald-100 text-emerald-900 border border-emerald-300"
                  : completedOrder.statusStep === 2
                  ? "bg-amber-100 text-amber-900 border border-amber-300"
                  : "bg-blue-100 text-blue-900 border border-blue-300"
              }`}>
                {completedOrder.status}
              </span>
            </div>

            <div className="relative pt-2">
              <div className="grid grid-cols-3 gap-2 relative z-10 text-center">
                {/* Step 1 */}
                <div className="flex flex-col items-center">
                  <div className="w-8 h-8 rounded-full bg-[#b2903b] text-white flex items-center justify-center text-xs font-bold ring-4 ring-[#b2903b]/20 shadow-xs">
                    <Clock className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] sm:text-xs font-bold text-neutral-900 mt-2">
                    {language === "is" ? "1. Í vinnslu" : language === "es" ? "1. En preparación" : "1. Processing"}
                  </span>
                  <span className="text-[9px] text-neutral-500 font-mono">Lager / Atelier</span>
                </div>

                {/* Step 2 */}
                <div className="flex flex-col items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-500 shadow-xs ${
                      completedOrder.statusStep && completedOrder.statusStep >= 2
                        ? "bg-[#b2903b] text-white ring-4 ring-[#b2903b]/20"
                        : "bg-neutral-200 text-neutral-500"
                    }`}
                  >
                    <Truck className="w-4 h-4" />
                  </div>
                  <span
                    className={`text-[10px] sm:text-xs font-bold mt-2 ${
                      completedOrder.statusStep && completedOrder.statusStep >= 2 ? "text-neutral-900" : "text-neutral-400"
                    }`}
                  >
                    {language === "is"
                      ? `2. Sent (${completedOrder.carrier})`
                      : language === "es"
                      ? `2. Despachado`
                      : `2. Dispatched`}
                  </span>
                  <span className="text-[9px] text-neutral-500 font-mono">{completedOrder.carrier}</span>
                </div>

                {/* Step 3 */}
                <div className="flex flex-col items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-500 shadow-xs ${
                      completedOrder.statusStep && completedOrder.statusStep >= 3
                        ? "bg-emerald-600 text-white ring-4 ring-emerald-200"
                        : "bg-neutral-200 text-neutral-500"
                    }`}
                  >
                    <PackageCheck className="w-4 h-4" />
                  </div>
                  <span
                    className={`text-[10px] sm:text-xs font-bold mt-2 ${
                      completedOrder.statusStep && completedOrder.statusStep >= 3 ? "text-emerald-800" : "text-neutral-400"
                    }`}
                  >
                    {language === "is" ? "3. Afhent" : language === "es" ? "3. Entregado" : "3. Delivered"}
                  </span>
                  <span className="text-[9px] text-neutral-500 font-mono">Á áfangastað</span>
                </div>
              </div>

              {/* Connecting line */}
              <div className="absolute top-6 left-[16%] right-[16%] h-1 bg-neutral-200 -z-0 rounded-full">
                <div
                  className="h-full bg-[#b2903b] transition-all duration-700 rounded-full"
                  style={{
                    width: completedOrder.statusStep === 3 ? "100%" : completedOrder.statusStep === 2 ? "50%" : "0%"
                  }}
                />
              </div>
            </div>
          </div>

          {/* Tracking number link */}
          <div className="bg-[#fbf9f5] border border-neutral-200 p-3.5 rounded-lg flex items-center justify-between text-xs font-mono">
            <div>
              <span className="text-neutral-500 block text-[10px] uppercase font-bold tracking-wider">
                {language === "is" ? "Sendingarnúmer / Rakning" : language === "es" ? "Código de Seguimiento" : "Tracking Code"}
              </span>
              <span className="font-bold text-neutral-900 text-sm">{completedOrder.trackingNumber}</span>
            </div>
            {completedOrder.trackingUrl && (
              <a
                href={completedOrder.trackingUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-[#b2903b] hover:underline font-bold text-xs"
              >
                <span>{language === "is" ? "Fylgjast með á vef" : language === "es" ? "Rastrear envío" : "Track online"}</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>

          {/* Receipt Breakdown */}
          <div className="border-t border-neutral-100 pt-4 space-y-2 text-xs">
            <div className="flex justify-between items-center">
              <span className="font-bold text-neutral-800 text-[11px] uppercase tracking-wider font-mono">
                {language === "is" ? "Kaupkvittun / Reikningur" : language === "es" ? "Detalle del Recibo" : "Receipt Summary"}
              </span>
              <button
                type="button"
                onClick={() => setShowReceiptModal(true)}
                className="cursor-pointer text-xs text-[#b2903b] hover:underline font-bold inline-flex items-center gap-1"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>{language === "is" ? "Prenta / Skoða kvittun" : language === "es" ? "Ver e Imprimir Recibo" : "Print Receipt"}</span>
              </button>
            </div>

            <div className="space-y-1.5 divide-y divide-neutral-100 max-h-40 overflow-y-auto pr-1">
              {completedOrder.items?.map((it, idx) => (
                <div key={idx} className="pt-1.5 flex justify-between items-center text-neutral-700">
                  <span>
                    {it.name} <strong className="text-neutral-900 font-mono">x{it.quantity}</strong>
                  </span>
                  <span className="font-mono">{it.price}</span>
                </div>
              ))}
            </div>

            <div className="border-t border-neutral-200 pt-2 space-y-1 text-xs">
              <div className="flex justify-between text-neutral-600">
                <span>{language === "is" ? "Undirtala" : "Subtotal"}:</span>
                <span className="font-mono">{(completedOrder.subtotal || 0).toLocaleString("is-IS")} kr.-</span>
              </div>
              {completedOrder.discount && completedOrder.discount > 0 ? (
                <div className="flex justify-between text-emerald-700">
                  <span>{language === "is" ? `Afsláttur (${completedOrder.discountCode})` : `Discount (${completedOrder.discountCode})`}:</span>
                  <span className="font-mono">-{(completedOrder.discount || 0).toLocaleString("is-IS")} kr.-</span>
                </div>
              ) : null}
              <div className="flex justify-between text-neutral-600">
                <span>{language === "is" ? "Sending" : "Shipping"}:</span>
                <span className="font-mono">
                  {completedOrder.shipping === 0 ? "0 kr.- (Frítt)" : `${completedOrder.shipping} kr.-`}
                </span>
              </div>
              <div className="flex justify-between font-bold text-sm text-[#b2903b] pt-1 border-t border-neutral-100">
                <span>{language === "is" ? "Greitt alls" : language === "es" ? "Total pagado" : "Total Paid"}:</span>
                <span className="font-mono text-base font-bold">{completedOrder.total.toLocaleString("is-IS")} kr.-</span>
              </div>
            </div>

            {/* Delivery address */}
            <div className="pt-2 text-[11px] text-neutral-600 border-t border-neutral-100 flex items-start gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-[#b2903b] shrink-0 mt-0.5" />
              <div>
                <strong>{completedOrder.customerName}</strong> — {completedOrder.customerAddress}, {completedOrder.customerCityZip}
              </div>
            </div>

            {/* Kling issuer note */}
            <div className="pt-2 text-[10px] text-neutral-500 font-mono text-center border-t border-neutral-100">
              Greiðslukvittun og færsluhirðing er gefin út af Kling.is
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            type="button"
            onClick={() => setShowReceiptModal(true)}
            className="cursor-pointer bg-white border border-[#b2903b] text-[#b2903b] hover:bg-[#b2903b]/10 font-sans tracking-[0.15em] font-bold py-3 px-6 text-xs uppercase transition-all duration-300 rounded-sm shadow-xs inline-flex items-center justify-center gap-2"
          >
            <Printer className="w-4 h-4" />
            <span>{language === "is" ? "OPNA KAUPKVITTUN" : language === "es" ? "VER RECIBO FISCAL" : "VIEW RECEIPT"}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowTrackingModal(true)}
            className="cursor-pointer bg-[#b2903b] hover:bg-[#997c32] text-white font-sans tracking-[0.15em] font-bold py-3 px-6 text-xs uppercase transition-all duration-300 rounded-sm shadow-md inline-flex items-center justify-center gap-2"
          >
            <Truck className="w-4 h-4" />
            <span>{language === "is" ? "RAKNING Í RAUNTÍMA" : language === "es" ? "RASTREO EN VIVO" : "LIVE TRACKING"}</span>
          </button>

          <button
            id="checkout-finalize-return-btn"
            onClick={handleFinish}
            className="cursor-pointer bg-[#1c1b18] hover:bg-neutral-800 text-white font-sans tracking-[0.15em] font-medium py-3 px-6 text-xs uppercase transition-all duration-300 rounded-sm shadow-sm"
          >
            {language === "is" ? "AFTUR Í ATELIER" : language === "es" ? "VOLVER AL ATELIER" : "RETURN TO ATELIER"}
          </button>
        </div>

        {/* Modals */}
        {showReceiptModal && (
          <ReceiptModal
            order={completedOrder}
            isOpen={showReceiptModal}
            onClose={() => setShowReceiptModal(false)}
            language={language}
            onTrackOrder={() => {
              setShowReceiptModal(false);
              setShowTrackingModal(true);
            }}
          />
        )}

        {showTrackingModal && (
          <OrderTrackingModal
            order={completedOrder}
            isOpen={showTrackingModal}
            onClose={() => setShowTrackingModal(false)}
            language={language}
            onOpenReceipt={() => {
              setShowTrackingModal(false);
              setShowReceiptModal(true);
            }}
          />
        )}
      </div>
    );
  }

  // ==================== CHECKOUT FORM SCREEN ====================
  return (
    <div id="checkout-view-page" className="min-h-screen bg-[#f5f2eb]">
      <div className="bg-[#fbf9f5] pt-32 sm:pt-40 lg:pt-48 pb-20 w-full rounded-t-3xl border-t border-[#b2903b]/10 shadow-[0_-10px_40px_rgba(0,0,0,0.03)] mt-[20px]">
        <div className="max-w-[70rem] mx-auto px-4 sm:px-6 lg:px-8">
          {/* Page Header bar */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-baseline pb-4 mb-2 gap-4">
            <div>
              <h1 className="font-serif text-2xl sm:text-4xl italic text-[#b2903b] font-bold">
                {language === "is" ? "Greiðsluferli & Sending" : language === "es" ? "Pasarela de Cobro y Envío" : "Checkout & Delivery"}
              </h1>
            </div>

            <div className="flex items-center space-x-2 text-[#b2903b]/80 font-mono text-[10px] sm:text-xs uppercase tracking-[0.2em] font-medium">
              <span>{language === "is" ? "Örugg Greiðslugátt" : language === "es" ? "Pasarela Encriptada" : "SECURE ENCRYPTED PAGE"}</span>
              <Lock className="w-4 h-4" />
            </div>
          </div>

          {/* Validation Error banner */}
          {errorMessage && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs sm:text-sm font-sans flex items-center gap-2">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-12 lg:gap-16">
            {/* LEFT COLUMN: Shipping, Carrier and Billing Form */}
            <form onSubmit={validateAndPay} className="space-y-10">
              {/* Anti-spam honeypot */}
              <input
                type="text"
                name="b_fax_trap"
                value={spamTrapCheckout}
                onChange={(e) => setSpamTrapCheckout(e.target.value)}
                style={{ display: "none", position: "absolute", left: "-9999px" }}
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
              />

              {/* 1. Customer Personal Coordinates */}
              <div className="space-y-4">
                <h3 className="text-lg sm:text-[22px] font-serif italic text-[#b2903b] font-bold tracking-wide flex items-center gap-2 border-b border-[#b2903b]/40 pb-3">
                  <span>1.</span>
                  <span>{language === "is" ? "Persónuupplýsingar" : language === "es" ? "Información del Cliente" : "Customer Details"}</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] sm:text-[12px] font-mono text-[#aa9873] uppercase tracking-[0.2em] block font-bold">
                      {language === "is" ? "Fullt Nafn" : language === "es" ? "Nombre Completo" : "Full Name"} *
                    </label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      onInvalid={handleInvalidRequired}
                      onInput={handleClearValidity}
                      placeholder=""
                      className="w-full bg-white border border-[#b2903b]/30 text-xs sm:text-sm p-2 sm:p-3 outline-none text-[#1c1b18] focus:border-[#b2903b] rounded-sm transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] sm:text-[12px] font-mono text-[#aa9873] uppercase tracking-[0.2em] block font-bold">
                      {language === "is" ? "Netfang" : language === "es" ? "Correo Electrónico" : "Email Address"} *
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onInvalid={handleInvalidRequired}
                      onInput={handleClearValidity}
                      placeholder=""
                      className="w-full bg-white border border-[#b2903b]/30 text-xs sm:text-sm p-2 sm:p-3 outline-none text-[#1c1b18] focus:border-[#b2903b] rounded-sm transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] sm:text-[12px] font-mono text-[#aa9873] uppercase tracking-[0.2em] block font-bold">
                      {language === "is" ? "Kennitala" : language === "es" ? "Kennitala / Identificación" : "Kennitala"} *
                    </label>
                    <input
                      type="text"
                      required
                      value={nationalId}
                      onChange={(e) => setNationalId(e.target.value)}
                      onInvalid={handleInvalidRequired}
                      onInput={handleClearValidity}
                      placeholder=""
                      autoComplete="off"
                      maxLength={12}
                      className="w-full bg-white border border-[#b2903b]/30 text-xs sm:text-sm p-2 sm:p-3 outline-none text-[#1c1b18] focus:border-[#b2903b] rounded-sm transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] sm:text-[12px] font-mono text-[#aa9873] uppercase tracking-[0.2em] block font-bold">
                      {language === "is" ? "Símanúmer (valkvætt)" : language === "es" ? "Teléfono (opcional)" : "Phone Number (optional)"}
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder=""
                      className="w-full bg-white border border-[#b2903b]/30 text-xs sm:text-sm p-2 sm:p-3 outline-none text-[#1c1b18] focus:border-[#b2903b] rounded-sm transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* 2. Destination coordinates & Carrier selection */}
              <div className="space-y-4">
                <h3 className="text-lg sm:text-[22px] font-serif italic text-[#b2903b] font-bold tracking-wide flex items-center gap-2 border-b border-[#b2903b]/40 pb-3">
                  <span>2.</span>
                  <span>{language === "is" ? "Afhendingarmáti" : language === "es" ? "Método de Envío y Dirección" : "Shipping Method & Destination"}</span>
                </h3>

                {/* Country Selector First */}
                <div className="space-y-1.5">
                  <label className="text-[10px] sm:text-[12px] font-mono text-[#aa9873] uppercase tracking-[0.2em] block font-bold">
                    {language === "is" ? "Land" : language === "es" ? "País" : "Country"} *
                  </label>
                  <select
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full bg-white border border-[#b2903b]/30 text-xs sm:text-sm p-2 sm:p-3 outline-none text-[#1c1b18] focus:border-[#b2903b] rounded-sm transition-all"
                  >
                    {COUNTRIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Carrier / Method Selection Cards */}
                <div className="space-y-2.5 pt-1">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-neutral-500 font-bold block">
                    {language === "is" ? "Veldu flutningsþjónustu:" : language === "es" ? "Seleccione el servicio de entrega:" : "Select delivery service:"}
                  </span>

                  <div className="space-y-2.5">
                    {availableShippingMethods.map((method) => {
                      const isFreeForThis =
                        isOnlySubscriptions ||
                        (isDomestic &&
                          (discountedTotalISK >= method.freeThreshold ||
                            (appliedDiscount && appliedDiscount.code === "BFSHIPPING")));
                      const priceLabel = isFreeForThis
                        ? language === "is"
                          ? "FRÍTT"
                          : language === "es"
                          ? "GRATIS"
                          : "FREE"
                        : `${method.basePrice.toLocaleString("is-IS")} kr.-`;

                      const isSelected = selectedMethodId === method.id;

                      return (
                        <label
                          key={method.id}
                          onClick={() => setSelectedMethodId(method.id)}
                          className={`cursor-pointer p-4 rounded-xl border flex items-start justify-between gap-3 transition-all ${
                            isSelected
                              ? "border-[#b2903b] bg-[#b2903b]/8 shadow-sm ring-1 ring-[#b2903b]"
                              : "border-neutral-200 bg-white hover:border-[#b2903b]/50"
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <input
                              type="radio"
                              name="shippingMethod"
                              checked={isSelected}
                              onChange={() => setSelectedMethodId(method.id)}
                              className="accent-[#b2903b] mt-1"
                            />
                            <div>
                              <div className="font-bold text-xs sm:text-sm text-neutral-900 flex items-center gap-2">
                                <Truck className="w-3.5 h-3.5 text-[#b2903b]" />
                                <span>{language === "is" ? method.nameIs : language === "es" ? method.nameEs : method.name}</span>
                              </div>
                              <div className="text-[11px] text-neutral-600 mt-1 leading-relaxed whitespace-pre-line">
                                {language === "is" ? method.descriptionIs : language === "es" ? method.descriptionEs : method.descriptionEn}
                              </div>
                              <div className="text-[10px] text-neutral-500 font-mono mt-1">
                                {method.id === "posturinn-international"
                                  ? (language === "is"
                                      ? "Áætlaður afhendingartími fer eftir áfangastað."
                                      : language === "es"
                                      ? "El tiempo estimado de entrega varía según el destino."
                                      : "Estimated delivery time varies by destination.")
                                  : (language === "is"
                                      ? `Áætlaður tími: ${method.estimatedTimeIs || "1 - 2 virkir dagar"}`
                                      : language === "es"
                                      ? `Plazo estimado: ${method.estimatedTimeEs || "1 - 2 días hábiles"}`
                                      : `Estimated time: ${method.estimatedTime}`)}
                              </div>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <span className={`text-xs font-mono font-bold ${isFreeForThis ? "text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200" : "text-neutral-900"}`}>
                              {priceLabel}
                            </span>
                            {!isFreeForThis && method.freeThreshold < Infinity && (
                              <span className="text-[9px] text-neutral-400 block mt-0.5 font-mono">
                                {language === "is" ? `Frítt yfir ${method.freeThreshold.toLocaleString("is-IS")} kr.-` : `Free over ${method.freeThreshold.toLocaleString("is-IS")} kr.-`}
                              </span>
                            )}
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Street, Apartment & Zip fields */}
                <div className="space-y-4 pt-2">
                  <div className="space-y-1.5">
                    <label className="text-[10px] sm:text-[12px] font-mono text-[#aa9873] uppercase tracking-[0.2em] block font-bold">
                      {language === "is" ? "Gata og Húsnúmer" : language === "es" ? "Calle e Identificaciones" : "Street Address"} *
                    </label>
                    <input
                      type="text"
                      required
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      onInvalid={handleInvalidRequired}
                      onInput={handleClearValidity}
                      placeholder=""
                      className="w-full bg-white border border-[#b2903b]/30 text-xs sm:text-sm p-2 sm:p-3 outline-none text-[#1c1b18] focus:border-[#b2903b] rounded-sm transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] sm:text-[12px] font-mono text-[#aa9873] uppercase tracking-[0.2em] block font-bold">
                      {language === "is" ? "Íbúð, hæð (valkvætt)" : language === "es" ? "Apartamento, suite (opcional)" : "APARTMENT, SUITE, UNIT (OPTIONAL)"}
                    </label>
                    <input
                      type="text"
                      value={apartment}
                      onChange={(e) => setApartment(e.target.value)}
                      placeholder=""
                      className="w-full bg-white border border-[#b2903b]/30 text-xs sm:text-sm p-2 sm:p-3 outline-none text-[#1c1b18] focus:border-[#b2903b] rounded-sm transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5 min-w-0">
                      <label className="text-[9px] min-[360px]:text-[10px] sm:text-[12px] font-mono text-[#aa9873] uppercase tracking-wider sm:tracking-[0.2em] block font-bold whitespace-nowrap overflow-hidden text-ellipsis leading-tight">
                        {language === "is" ? "Borg / Sveitarfélag" : language === "es" ? "Ciudad" : "CITY"} *
                      </label>
                      <input
                        type="text"
                        required
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        onInvalid={handleInvalidRequired}
                        onInput={handleClearValidity}
                        placeholder=""
                        className="w-full bg-white border border-[#b2903b]/30 text-xs sm:text-sm p-2 sm:p-3 outline-none text-[#1c1b18] focus:border-[#b2903b] rounded-sm transition-all"
                      />
                    </div>

                    <div className="space-y-1.5 min-w-0">
                      <label className="text-[9px] min-[360px]:text-[10px] sm:text-[12px] font-mono text-[#aa9873] uppercase tracking-wider sm:tracking-[0.2em] block font-bold whitespace-nowrap overflow-hidden text-ellipsis leading-tight">
                        {language === "is" ? "Póstnúmer" : language === "es" ? "Código Postal" : "ZIP / Postal Code"} *
                      </label>
                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        required
                        value={zip}
                        onChange={(e) => setZip(e.target.value.replace(/\D/g, ""))}
                        onInvalid={handleInvalidRequired}
                        onInput={handleClearValidity}
                        placeholder=""
                        className="w-full bg-white border border-[#b2903b]/30 text-xs sm:text-sm p-2 sm:p-3 outline-none text-[#1c1b18] focus:border-[#b2903b] rounded-sm transition-all font-mono"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. Secure payment block with Pay */}
              <div className="space-y-4">
                <div className="border-b border-[#b2903b]/40 pb-3 flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-lg sm:text-[22px] font-serif italic text-[#b2903b] font-bold tracking-wide flex items-center gap-2">
                    <span>3.</span>
                    <span>{language === "is" ? "Greiðslumáti" : language === "es" ? "Método de Pago" : "Payment Method"}</span>
                  </h3>
                  <div className="flex items-center gap-1.5 text-[10px] font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full font-medium">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>{language === "is" ? "Örugg greiðsla" : language === "es" ? "Pago 100% Seguro" : "100% Secure Checkout"}</span>
                  </div>
                </div>

                {/* Single Payment Method Card: Pay */}
                <div className="bg-white border-2 border-[#b2903b]/40 rounded-xl p-4 sm:p-5 shadow-xs transition-all space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-neutral-100">
                    <div className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full border-2 border-[#b2903b] flex items-center justify-center bg-[#b2903b]/10 shrink-0">
                        <div className="w-2.5 h-2.5 rounded-full bg-[#b2903b]" />
                      </div>
                      <div>
                        <span className="font-sans font-bold text-base text-neutral-900 tracking-wide block">
                          Pay
                        </span>
                        <span className="text-[11px] text-neutral-500 font-sans block">
                          {language === "is"
                            ? "Kortagreiðslur og Apple Pay"
                            : language === "es"
                            ? "Tarjetas y Apple Pay"
                            : "Cards and Apple Pay"}
                        </span>
                      </div>
                    </div>

                    {/* Clean accepted payment method badges: Visa, Mastercard, Apple Pay */}
                    <div className="flex items-center gap-2 flex-wrap pl-8 sm:pl-0">
                      {/* Visa */}
                      <div className="h-6 w-10 bg-white border border-neutral-200 rounded flex items-center justify-center shrink-0 shadow-2xs p-1" title="Visa">
                        <svg className="h-3 w-auto" viewBox="0 0 36 12" fill="none">
                          <path d="M14.5 11.5H12.2L13.6 2.5H15.9L14.5 11.5Z" fill="#1A1F71"/>
                          <path d="M21.5 2.7C21.1 2.5 20.2 2.3 19.2 2.3C16.6 2.3 14.8 3.7 14.8 5.7C14.8 7.2 16.1 8 17.1 8.5C18.1 9 18.5 9.4 18.5 9.8C18.5 10.4 17.7 10.8 17 10.8C16 10.8 15.3 10.6 14.5 10.2L14.1 11.4C14.8 11.7 15.8 12 16.9 12C19.5 12 21.2 10.6 21.2 8.6C21.2 7.5 20.5 6.6 19 5.9C18.1 5.4 17.5 5.1 17.5 4.7C17.5 4.3 18 3.9 19 3.9C19.8 3.9 20.4 4.1 20.9 4.3L21.5 2.7Z" fill="#1A1F71"/>
                          <path d="M24.5 8.5C24.7 7.9 25.5 5.5 25.5 5.5S25.7 5.1 25.8 4.7L26 5.5S26.5 7.8 26.6 8.5H24.5ZM27.7 2.5H26C25.4 2.5 25.1 2.7 24.8 3.3L21.5 11.5H23.9L24.4 10.1H27.3L27.6 11.5H29.7L27.7 2.5Z" fill="#1A1F71"/>
                          <path d="M10.8 2.5H8.6L6.5 8.4L5.3 3.1C5.1 2.6 4.7 2.5 4.2 2.5H0.5L0.4 2.9C1.2 3.1 2.1 3.4 2.8 3.8C3.2 4.1 3.4 4.3 3.5 4.8L5.3 11.5H7.7L10.8 2.5Z" fill="#1A1F71"/>
                          <path d="M4.5 2.5H0.5L0.4 2.9C2 3.3 3.6 4.3 4.2 5.9L5 2.5H4.5Z" fill="#F7B600"/>
                        </svg>
                      </div>

                      {/* Mastercard */}
                      <div className="h-6 w-10 bg-white border border-neutral-200 rounded flex items-center justify-center shrink-0 shadow-2xs p-1" title="Mastercard">
                        <svg className="h-4 w-auto" viewBox="0 0 24 16" fill="none">
                          <circle cx="8" cy="8" r="6" fill="#EB001B"/>
                          <circle cx="16" cy="8" r="6" fill="#F79E1B"/>
                          <path d="M12 3.2A5.96 5.96 0 0 0 9.6 8c0 1.9.9 3.6 2.4 4.8A5.96 5.96 0 0 0 14.4 8C14.4 6.1 13.5 4.4 12 3.2Z" fill="#FF5F00"/>
                        </svg>
                      </div>

                      {/* Apple Pay */}
                      <div className="h-6 px-1.5 bg-black rounded flex items-center justify-center shrink-0 shadow-2xs gap-0.5" title="Apple Pay">
                        <svg className="h-3 w-auto fill-white" viewBox="0 0 170 170">
                          <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.7-3.04-7.66-7.83-11.89-14.36-6.19-9.56-10.97-20.52-14.34-32.87-3.37-12.35-5.06-23.75-5.06-34.19 0-14.7 3.59-26.68 10.76-35.94 7.18-9.27 16.32-13.98 27.43-14.16 4.7 0 9.94 1.25 15.73 3.75 5.79 2.5 9.77 3.8 11.95 3.9 1.63 0 5.86-1.42 12.69-4.26 6.83-2.84 12.36-4.14 16.6-3.9 12.44.64 22.34 5.3 29.7 13.98-10.88 6.57-16.2 15.64-15.96 27.21.24 9.17 3.76 16.89 10.56 23.16 6.8 6.27 14.88 9.77 24.24 10.5-2.22 6.64-4.85 13.04-7.88 19.22zM119.22 33.15c0-7.39 2.66-14.34 7.98-20.85 5.32-6.51 11.87-10.74 19.65-12.7 1.09 7.07-.63 13.88-5.16 20.44-4.53 6.56-11.02 10.98-19.47 13.25-.66-.05-1.63-.09-3-.14z"/>
                        </svg>
                        <span className="text-[10px] font-semibold text-white tracking-tight">Pay</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-neutral-600 pt-1">
                    <span className="text-[11px] font-medium text-neutral-500">
                      {language === "is" ? "Gjaldmiðill:" : language === "es" ? "Moneda:" : "Currency:"}{" "}
                      <strong className="text-neutral-800 font-mono">ISK (Íslenskar krónur)</strong>
                    </span>
                    <span className="text-[11px] font-medium text-neutral-500">
                      {language === "is" ? "Heildarupphæð:" : language === "es" ? "Total a pagar:" : "Total amount:"}{" "}
                      <strong className="text-[#b2903b] font-mono font-bold text-sm">{finalTotalISK.toLocaleString("is-IS")} kr.</strong>
                    </span>
                  </div>
                </div>
              </div>

              {/* Submit Payment button */}
              <div className="pt-4 space-y-2.5">
                <button
                  type="submit"
                  id="checkout-pay-submit-btn"
                  disabled={isProcessing || cart.length === 0}
                  className="cursor-pointer w-full bg-[#b2903b] hover:bg-[#997c32] text-white font-sans tracking-[0.12em] font-semibold py-4 px-6 rounded-xl text-sm transition-all duration-300 shadow-md hover:shadow-xl flex items-center justify-center gap-2.5 disabled:opacity-50 disabled:cursor-not-allowed group"
                >
                  {isProcessing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>
                        {language === "is"
                          ? "Gengur frá greiðslu..."
                          : language === "es"
                          ? "Procesando pago..."
                          : "Processing payment..."}
                      </span>
                    </>
                  ) : (
                    <span>
                      {language === "is"
                        ? `Ganga frá greiðslu • ${finalTotalISK.toLocaleString("is-IS")} kr.`
                        : language === "es"
                        ? `Ganga frá greiðslu / Proceed to checkout (${finalTotalISK.toLocaleString("is-IS")} kr.)`
                        : `Proceed to checkout • ${finalTotalISK.toLocaleString("is-IS")} kr.`}
                    </span>
                  )}
                </button>

                <p className="text-center text-[11px] text-neutral-500 font-sans flex items-center justify-center gap-1.5 pt-0.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>
                    {language === "is"
                      ? "Örugg greiðsla með 256-bit dulkóðun"
                      : language === "es"
                      ? "Pago 100% seguro con encriptación de 256 bits"
                      : "100% Secure checkout with 256-bit encryption"}
                  </span>
                </p>

                <p className="text-center text-[10px] text-neutral-500 font-sans leading-relaxed pt-0.5 px-2">
                  {language === "is"
                    ? "Með því að ljúka greiðslu staðfestir þú að þú hafir lesið skilmálana og samþykkir þá."
                    : language === "es"
                    ? "Al completar el pago confirmas que has leído y aceptas los términos y condiciones de LxS Scents ehf."
                    : "By completing payment you confirm that you have read and agree to the terms and conditions."}
                </p>
              </div>
            </form>

            {/* RIGHT COLUMN: Order summary, Coupons & Calculation card */}
            <div className="space-y-6">
              <div className="bg-white border border-[#b2903b]/25 rounded-2xl p-6 shadow-sm space-y-6">
                <div className="flex justify-between items-center border-b border-[#b2903b]/20 pb-3">
                  <h3 className="font-serif text-lg font-bold text-neutral-900">
                    {language === "is" ? "Pöntunaryfirlit" : language === "es" ? "Resumen de Compra" : "Order Summary"}
                  </h3>
                  <span className="text-xs font-mono font-medium text-neutral-500">
                    {cart.reduce((acc, it) => acc + it.quantity, 0)} {language === "is" ? "vörur" : "items"}
                  </span>
                </div>

                {/* Items list */}
                <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                  {cart.map((item, idx) => (
                    <div key={idx} className="flex gap-3 text-xs text-neutral-800 items-center">
                      <div className="w-12 h-12 rounded bg-neutral-100 border border-neutral-200 overflow-hidden shrink-0 flex items-center justify-center">
                        {item.fragrance.image ? (
                          <img src={item.fragrance.image} alt={item.fragrance.name} className="w-full h-full object-cover" />
                        ) : (
                          <Sparkles className="w-4 h-4 text-[#b2903b]" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold truncate text-neutral-900">
                          {item.fragrance.id === "subscription-diamond"
                            ? (language === "is" ? "DEMANTS ÁSKRIFT" : "DIAMOND Membership")
                            : item.fragrance.id === "subscription-gold"
                            ? (language === "is" ? "GULL ÁSKRIFT" : "GOLD Membership")
                            : item.fragrance.name}
                        </div>
                        <div className="text-[10px] text-neutral-500 font-mono">
                          {item.fragrance.id.startsWith("subscription-")
                            ? `${language === "is" ? "1 mánuður" : "1 month"} • ${language === "is" ? "Áskrift" : "Membership"} • x${item.quantity}`
                            : `${item.sizeSelected || item.fragrance.size || "50ml"} • x${item.quantity}`}
                        </div>
                      </div>
                      <span className="font-mono font-bold whitespace-nowrap text-[#b2903b]">
                        {(getIskPriceNumber(item.fragrance.id) * item.quantity).toLocaleString("is-IS")} kr.-
                      </span>
                    </div>
                  ))}
                </div>

                {/* Coupon Code Input */}
                <div className="border-t border-[#b2903b]/20 pt-4 space-y-3">
                  <span className="text-[11px] font-mono uppercase text-neutral-500 font-bold block">
                    {language === "is" ? "Afsláttarkóði" : language === "es" ? "Cupón de Descuento" : "COUPON CODE"}
                  </span>

                  <form onSubmit={handleApplyDiscount} className="flex gap-2">
                    <div className="relative flex-1">
                      <Tag className="w-3.5 h-3.5 text-[#b2903b] absolute left-2.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={discountCode}
                        onChange={(e) => setDiscountCode(e.target.value.toUpperCase())}
                        placeholder={language === "is" ? "Afsláttarkóði" : language === "es" ? "Cupón de descuento" : "Coupon Code"}
                        className="w-full pl-8 pr-2 py-2 text-xs font-mono uppercase bg-[#fbf9f5] border border-neutral-300 rounded focus:border-[#b2903b] outline-none"
                      />
                    </div>
                    <button
                      type="submit"
                      className="cursor-pointer px-4 py-2 bg-[#b2903b] hover:bg-[#997c32] text-white text-xs font-bold rounded transition-colors"
                    >
                      {language === "is" ? "Virkja" : language === "es" ? "Aplicar" : "Apply"}
                    </button>
                  </form>

                  {appliedDiscount && (
                    <div className="flex items-center justify-between text-xs text-emerald-800 bg-emerald-50 px-2.5 py-1.5 rounded border border-emerald-200">
                      <span className="font-mono font-medium flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        {appliedDiscount.code} (-{appliedDiscount.percent}%)
                      </span>
                      <button
                        type="button"
                        onClick={handleRemoveDiscount}
                        className="cursor-pointer text-[10px] text-red-600 hover:underline"
                      >
                        {language === "is" ? "Fjarlægja" : language === "es" ? "Quitar" : "Remove"}
                      </button>
                    </div>
                  )}

                  {discountError && <p className="text-[11px] text-red-600 font-sans">{discountError}</p>}
                </div>

                {/* Calculation breakdown */}
                <div className="border-t border-[#b2903b]/20 pt-4 space-y-2 text-xs text-neutral-700 font-sans">
                  <div className="flex justify-between">
                    <span>{language === "is" ? "Vörur samtals" : language === "es" ? "Subtotal" : "Subtotal"}</span>
                    <span className="font-mono font-semibold text-neutral-900">{totalISK.toLocaleString("is-IS")} kr.-</span>
                  </div>

                  {appliedDiscount && discountISK > 0 && (
                    <div className="flex justify-between text-emerald-800 font-medium">
                      <span>{language === "is" ? `Afsláttur (${appliedDiscount.code})` : `Descuento (${appliedDiscount.code})`}</span>
                      <span className="font-mono font-semibold">-{discountISK.toLocaleString("is-IS")} kr.-</span>
                    </div>
                  )}

                  <div className="flex justify-between">
                    <div>
                      <span>{language === "is" ? "Sendingarkostnaður" : language === "es" ? "Envío" : "Shipping"}</span>
                      <span className="block text-[10px] text-neutral-400 font-mono">{currentMethod.carrier}</span>
                    </div>
                    <span className="font-mono font-semibold text-neutral-900">{shippingChargeISK}</span>
                  </div>

                  <div className="flex justify-between text-[11px] text-neutral-500 pt-1 border-t border-neutral-100">
                    <span>{language === "is" ? "Innifalinn VSK (24%):" : language === "es" ? "IVA 24% incluido:" : "Included VAT (24%):"}</span>
                    <span className="font-mono">{vskAmount.toLocaleString("is-IS")} kr.-</span>
                  </div>

                  <div className="border-t-2 border-neutral-900 pt-3 flex justify-between items-baseline">
                    <span className="font-serif text-base sm:text-lg font-bold text-neutral-950">
                      {language === "is" ? "Heildarverð" : language === "es" ? "Total a pagar" : "Total"}
                    </span>
                    <span className="font-mono text-xl font-bold text-[#b2903b]">
                      {finalTotalISK.toLocaleString("is-IS")} kr.-
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
