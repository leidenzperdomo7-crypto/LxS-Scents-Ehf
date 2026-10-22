import React, { useState, useEffect } from "react";
import {
  X,
  Truck,
  PackageCheck,
  Clock,
  ExternalLink,
  MapPin,
  Calendar,
  CheckCircle2,
  RefreshCw,
  Play,
  RotateCcw,
  Sparkles,
  ShieldCheck,
  FileText
} from "lucide-react";
import { Language } from "../translations";
import { OrderData, updateOrderStatusInFirestore, auth, db } from "../firebase";
import { doc, onSnapshot } from "firebase/firestore";

interface OrderTrackingModalProps {
  order: OrderData;
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  onOpenReceipt?: (order: OrderData) => void;
}

export default function OrderTrackingModal({
  order: initialOrder,
  isOpen,
  onClose,
  language,
  onOpenReceipt
}: OrderTrackingModalProps) {
  const [liveOrder, setLiveOrder] = useState<OrderData>(initialOrder);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<boolean>(false);
  const [simIntervalId, setSimIntervalId] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setLiveOrder(initialOrder);
  }, [initialOrder]);

  // Subscribe to real-time order changes in Firestore
  useEffect(() => {
    if (!isOpen || !liveOrder.userId || !liveOrder.id) return;

    const orderRef = doc(db, "users", liveOrder.userId, "orders", liveOrder.id);
    const unsub = onSnapshot(
      orderRef,
      (snapshot) => {
        if (snapshot.exists()) {
          setLiveOrder(snapshot.data() as OrderData);
        }
      },
      (err) => {
        console.warn("Real-time tracking snapshot notice:", err);
      }
    );

    return () => {
      unsub();
    };
  }, [isOpen, liveOrder.userId, liveOrder.id]);

  // Cleanup simulation on unmount
  useEffect(() => {
    return () => {
      if (simIntervalId) clearInterval(simIntervalId);
    };
  }, [simIntervalId]);

  if (!isOpen) return null;

  const currentStep = liveOrder.statusStep || (liveOrder.status === "Entregado" ? 3 : liveOrder.status?.includes("Despachado") ? 2 : 1);

  const getStatusLabel = (step: number) => {
    if (step === 1) {
      return language === "is" ? "Í vinnslu (Lager & Ilmstofa)" : language === "es" ? "En preparación" : "In preparation";
    }
    if (step === 2) {
      const carrier = liveOrder.carrier || "Dropp/Íslandspóstur";
      return language === "is" ? `Sent af stað með ${carrier}` : language === "es" ? `Despachado con ${carrier}` : `Dispatched with ${carrier}`;
    }
    return language === "is" ? "Afhent viðtakanda" : language === "es" ? "Entregado" : "Delivered";
  };

  const handleUpdateStatus = async (newStep: number) => {
    setIsUpdatingStatus(true);
    let newStatusText = "En preparación";
    if (newStep === 2) {
      newStatusText = `Despachado con ${liveOrder.carrier || "Dropp/Íslandspóstur"}`;
    } else if (newStep === 3) {
      newStatusText = "Entregado";
    }

    try {
      if (auth.currentUser && liveOrder.userId === auth.currentUser.uid) {
        await updateOrderStatusInFirestore(liveOrder.userId, liveOrder.id, newStatusText, newStep, liveOrder.carrier, liveOrder.trackingNumber);
      } else {
        // Local state fallback if not currently authenticated
        setLiveOrder((prev) => ({
          ...prev,
          status: newStatusText,
          statusStep: newStep,
          updatedAt: new Date().toISOString()
        }));
      }

      // Also sync userOrders in localStorage
      try {
        const stored = JSON.parse(localStorage.getItem("userOrders") || "[]");
        if (Array.isArray(stored)) {
          const updated = stored.map((o: any) =>
            o.id === liveOrder.id
              ? { ...o, status: newStatusText, statusStep: newStep, fulfillmentStatus: newStatusText }
              : o
          );
          localStorage.setItem("userOrders", JSON.stringify(updated));
        }
      } catch (e) {
        console.warn("Notice syncing orders to localStorage:", e);
      }
    } catch (err) {
      console.warn("Notice updating order status in Firestore:", err);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Automated step-by-step dispatch simulation for interactive testing
  const handleToggleSimulation = () => {
    if (isSimulating) {
      if (simIntervalId) clearInterval(simIntervalId);
      setSimIntervalId(null);
      setIsSimulating(false);
      return;
    }

    setIsSimulating(true);
    let step = 1;
    handleUpdateStatus(1);

    const interval = setInterval(() => {
      step += 1;
      if (step <= 3) {
        handleUpdateStatus(step);
      } else {
        clearInterval(interval);
        setSimIntervalId(null);
        setIsSimulating(false);
      }
    }, 4500);

    setSimIntervalId(interval);
  };

  return (
    <div id="order-tracking-modal" className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs animate-luxury-entrance">
      <div className="bg-[#fbf9f5] border border-[#b2903b]/30 rounded-2xl max-w-2xl w-full max-h-[92vh] overflow-y-auto p-5 sm:p-7 shadow-2xl relative font-sans text-neutral-900">
        {/* Close button */}
        <button
          onClick={onClose}
          aria-label="Close tracking"
          className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-900 p-1.5 rounded-full hover:bg-neutral-200/50 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="border-b border-[#b2903b]/20 pb-4 mb-5">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-[#b2903b] font-bold">
              {language === "is" ? "RAUNTÍMA RAKNING" : language === "es" ? "SEGUIMIENTO EN TIEMPO REAL" : "LIVE SHIPMENT TRACKING"}
            </span>
            <span className="flex items-center gap-1 text-[10px] text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded-full font-mono font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Firestore Live
            </span>
          </div>
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="font-serif text-2xl sm:text-3xl italic font-bold text-neutral-900">
              {liveOrder.id}
            </h2>
            <div className="text-xs text-neutral-500 font-mono">
              {liveOrder.date || (liveOrder.createdAt ? new Date(liveOrder.createdAt).toLocaleDateString() : "")}
            </div>
          </div>
        </div>

        {/* Carrier Info Card */}
        <div className="bg-white border border-[#b2903b]/20 rounded-xl p-4 mb-6 shadow-xs flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-lg bg-[#b2903b]/10 border border-[#b2903b]/20 flex items-center justify-center text-[#b2903b]">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase text-neutral-400 font-bold tracking-wider block">
                {language === "is" ? "Flutningsaðili & Þjónusta" : language === "es" ? "Transportista & Servicio" : "Carrier & Service"}
              </span>
              <span className="text-sm font-bold text-neutral-900">
                {liveOrder.carrier || "Dropp"} {liveOrder.shippingMethod ? `• ${liveOrder.shippingMethod}` : ""}
              </span>
              <span className="text-[11px] text-neutral-500 block font-mono">
                {language === "is" ? "Áætlaður afhendingartími: 1 - 2 virkir dagar" : language === "es" ? "Entrega estimada: 1 - 2 días hábiles" : "Estimated: 1 - 2 business days"}
              </span>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[10px] font-mono uppercase text-neutral-400 font-bold tracking-wider block">
              {language === "is" ? "Sendingarnúmer" : language === "es" ? "Guía de Envío" : "Tracking Number"}
            </span>
            <span className="text-xs font-mono font-bold text-[#b2903b] bg-amber-50 px-2 py-0.5 rounded border border-amber-200 inline-block mt-0.5">
              {liveOrder.trackingNumber || "DP-849201"}
            </span>
            {liveOrder.trackingUrl && (
              <a
                href={liveOrder.trackingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 flex items-center gap-1 text-[10px] text-[#b2903b] hover:underline font-semibold justify-end"
              >
                <span>{language === "is" ? "Opna vefrakningu" : language === "es" ? "Ver en carrier" : "Open carrier track"}</span>
                <ExternalLink className="w-2.5 h-2.5" />
              </a>
            )}
          </div>
        </div>

        {/* 3-Step Interactive Timeline Progress Bar */}
        <div className="bg-white border border-[#b2903b]/20 rounded-xl p-5 sm:p-6 mb-6 shadow-xs">
          <div className="flex items-center justify-between mb-6">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-700">
              {language === "is" ? "Framvinda pöntunar:" : language === "es" ? "Progreso del Envío:" : "Order Progress:"}
            </span>
            <span className={`text-xs font-mono font-bold px-2.5 py-1 rounded-full ${
              currentStep === 3
                ? "bg-emerald-100 text-emerald-900 border border-emerald-300"
                : currentStep === 2
                ? "bg-amber-100 text-amber-900 border border-amber-300"
                : "bg-blue-100 text-blue-900 border border-blue-300"
            }`}>
              {getStatusLabel(currentStep)}
            </span>
          </div>

          <div className="relative pt-2 pb-4">
            {/* Step icons line */}
            <div className="grid grid-cols-3 gap-2 relative z-10 text-center">
              {/* Step 1 */}
              <div className="flex flex-col items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-500 shadow-sm ${
                    currentStep >= 1
                      ? "bg-[#b2903b] text-white ring-4 ring-[#b2903b]/20"
                      : "bg-neutral-200 text-neutral-500"
                  }`}
                >
                  <Clock className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-neutral-900 mt-2">
                  {language === "is" ? "1. Í vinnslu" : language === "es" ? "1. En preparación" : "1. Processing"}
                </span>
                <span className="text-[10px] text-neutral-500 font-mono mt-0.5">
                  Lager & Atelier
                </span>
              </div>

              {/* Step 2 */}
              <div className="flex flex-col items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-500 shadow-sm ${
                    currentStep >= 2
                      ? "bg-[#b2903b] text-white ring-4 ring-[#b2903b]/20"
                      : "bg-neutral-200 text-neutral-500"
                  }`}
                >
                  <Truck className="w-5 h-5" />
                </div>
                <span className={`text-xs font-bold mt-2 ${currentStep >= 2 ? "text-neutral-900" : "text-neutral-400"}`}>
                  {language === "is" ? "2. Sent af stað" : language === "es" ? "2. Despachado" : "2. Dispatched"}
                </span>
                <span className="text-[10px] text-neutral-500 font-mono mt-0.5">
                  {liveOrder.carrier || "Dropp / Póstur"}
                </span>
              </div>

              {/* Step 3 */}
              <div className="flex flex-col items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-500 shadow-sm ${
                    currentStep >= 3
                      ? "bg-emerald-600 text-white ring-4 ring-emerald-200"
                      : "bg-neutral-200 text-neutral-500"
                  }`}
                >
                  <PackageCheck className="w-5 h-5" />
                </div>
                <span className={`text-xs font-bold mt-2 ${currentStep >= 3 ? "text-emerald-800" : "text-neutral-400"}`}>
                  {language === "is" ? "3. Afhent" : language === "es" ? "3. Entregado" : "3. Delivered"}
                </span>
                <span className="text-[10px] text-neutral-500 font-mono mt-0.5">
                  {language === "is" ? "Á áfangastað" : language === "es" ? "En destino" : "At destination"}
                </span>
              </div>
            </div>

            {/* Connecting progress track */}
            <div className="absolute top-7 left-[16%] right-[16%] h-1 bg-neutral-200 -z-0 rounded-full">
              <div
                className="h-full bg-[#b2903b] transition-all duration-700 rounded-full"
                style={{
                  width: currentStep === 3 ? "100%" : currentStep === 2 ? "50%" : "0%"
                }}
              />
            </div>
          </div>

          {/* Detailed step description logs */}
          <div className="mt-4 pt-4 border-t border-neutral-100 space-y-3 text-xs">
            <div className={`p-3 rounded-lg flex items-start gap-3 transition-colors ${currentStep >= 1 ? "bg-amber-50/70 border border-amber-200/60" : "bg-neutral-50 opacity-60"}`}>
              <CheckCircle2 className={`w-4 h-4 mt-0.5 shrink-0 ${currentStep >= 1 ? "text-[#b2903b]" : "text-neutral-400"}`} />
              <div>
                <div className="font-semibold text-neutral-900">
                  {language === "is" ? "Skref 1: Pöntun móttekin og ilmvötn tilbúin til afhendingar" : language === "es" ? "Paso 1: Pedido recibido y envasado artesanal en Reykjavík" : "Step 1: Order received and compounded in Reykjavík atelier"}
                </div>
                <p className="text-[11px] text-neutral-600 mt-0.5">
                  {language === "is" 
                    ? "Sérfræðingar LxS SCENTS hafa tekið til pöntunina, handfyllt flöskurnar og sett í öruggar innsiglaðar umbúðir."
                    : language === "es"
                    ? "El equipo de LxS SCENTS ha preparado su pedido con control de calidad y empaque sellado."
                    : "LxS SCENTS team has verified and safety-sealed your fragrance order."}
                </p>
              </div>
            </div>

            <div className={`p-3 rounded-lg flex items-start gap-3 transition-colors ${currentStep >= 2 ? "bg-amber-50/70 border border-amber-200/60" : "bg-neutral-50 opacity-60"}`}>
              <CheckCircle2 className={`w-4 h-4 mt-0.5 shrink-0 ${currentStep >= 2 ? "text-[#b2903b]" : "text-neutral-400"}`} />
              <div>
                <div className="font-semibold text-neutral-900">
                  {language === "is" ? `Skref 2: Sent af stað með ${liveOrder.carrier || "Dropp/Íslandspóstur"}` : language === "es" ? `Paso 2: Despachado con ${liveOrder.carrier || "Dropp/Íslandspóstur"}` : `Step 2: Dispatched with ${liveOrder.carrier || "Dropp/Íslandspóstur"}`}
                </div>
                <p className="text-[11px] text-neutral-600 mt-0.5">
                  {language === "is"
                    ? "Pakki afhentur flutningsaðila. Sending er komin á flutningabíl eða í vinnslu á miðstöð."
                    : language === "es"
                    ? "El paquete fue entregado al transportista con código de seguimiento activo para rastreo en tiempo real."
                    : "Package picked up by courier service and currently in temperature-controlled transit."}
                </p>
              </div>
            </div>

            <div className={`p-3 rounded-lg flex items-start gap-3 transition-colors ${currentStep >= 3 ? "bg-emerald-50 border border-emerald-200" : "bg-neutral-50 opacity-60"}`}>
              <CheckCircle2 className={`w-4 h-4 mt-0.5 shrink-0 ${currentStep >= 3 ? "text-emerald-600" : "text-neutral-400"}`} />
              <div>
                <div className="font-semibold text-neutral-900">
                  {language === "is" ? "Skref 3: Afhent viðskiptavini" : language === "es" ? "Paso 3: Entregado con confirmación" : "Step 3: Delivered"}
                </div>
                <p className="text-[11px] text-neutral-600 mt-0.5">
                  {language === "is"
                    ? "Sending hefur verið afhent eða er tilbúin til afsóknar í Dropp lúgu / Póstboxi."
                    : language === "es"
                    ? "El pedido ha sido entregado exitosamente al destinatario o depositado en casillero inteligente."
                    : "The package has been delivered to the customer or ready for collection at the smart locker."}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Destination & Package summary */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div className="bg-white border border-[#b2903b]/20 rounded-xl p-4 text-xs">
            <span className="font-bold text-neutral-800 uppercase tracking-wider text-[10px] block mb-2 font-mono flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-[#b2903b]" />
              {language === "is" ? "Afhendingarstaður" : language === "es" ? "Dirección de Entrega" : "Delivery Address"}
            </span>
            <div className="font-semibold text-neutral-900">{liveOrder.customerName}</div>
            <div className="text-neutral-600">{liveOrder.customerAddress}</div>
            {liveOrder.customerApartment && <div className="text-neutral-600">{liveOrder.customerApartment}</div>}
            <div className="text-neutral-600">{liveOrder.customerCityZip}</div>
            <div className="text-neutral-600">{liveOrder.customerCountry || "Iceland"}</div>
            {liveOrder.customerPhone && <div className="text-neutral-500 font-mono mt-1">{liveOrder.customerPhone}</div>}
          </div>

          <div className="bg-white border border-[#b2903b]/20 rounded-xl p-4 text-xs flex flex-col justify-between">
            <div>
              <span className="font-bold text-neutral-800 uppercase tracking-wider text-[10px] block mb-2 font-mono flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-[#b2903b]" />
                {language === "is" ? "Vöruyfirlit" : language === "es" ? "Resumen de Productos" : "Package Items"}
              </span>
              <div className="space-y-1 max-h-24 overflow-y-auto pr-1">
                {liveOrder.items && liveOrder.items.length > 0 ? (
                  liveOrder.items.map((it, idx) => (
                    <div key={idx} className="flex justify-between text-neutral-700">
                      <span className="truncate max-w-[180px]">{it.name}</span>
                      <span className="font-mono font-bold">x{it.quantity}</span>
                    </div>
                  ))
                ) : (
                  <div className="text-neutral-600">{liveOrder.itemsSummary || "Ilmvörur frá LxS SCENTS"}</div>
                )}
              </div>
            </div>

            <div className="pt-2 border-t border-neutral-100 flex justify-between items-center text-xs mt-2">
              <span className="text-neutral-500 font-medium">{language === "is" ? "Samtals greitt:" : language === "es" ? "Total pagado:" : "Total paid:"}</span>
              <span className="font-mono font-bold text-[#b2903b] text-sm">
                {Number(liveOrder.total).toLocaleString("is-IS")} kr.-
              </span>
            </div>
          </div>
        </div>

        {/* Real-time Status Switcher & Dispatch Controls */}
        {(auth.currentUser?.email === "leidenzperdomo7@gmail.com" ||
          localStorage.getItem("user_uid") === "VempaKpo94cWuYAPH673GczZ6YX2" ||
          localStorage.getItem("user_uid") === "OTl3dDZpoKf8WrkDiFOnM8HFsBg1") && (
          <div className="bg-[#f0ebe0] border border-[#b2903b]/30 rounded-xl p-4 mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-800 flex items-center gap-1.5 font-mono">
                <Sparkles className="w-3.5 h-3.5 text-[#b2903b]" />
                {language === "is" ? "Stjórnandi: Uppfæra stöðu í Firestore" : language === "es" ? "Panel Staff: Actualizar estado en vivo" : "Staff Panel: Update Live Status"}
              </span>
              <span className="text-[10px] text-amber-900 bg-amber-200/60 px-2 py-0.5 rounded font-mono font-bold">Admin / Staff</span>
            </div>
            <p className="text-[11px] text-neutral-600 mb-3">
              {language === "is"
                ? "Uppfærðu raunverulega stöðu pöntunarinnar samstundis í gagnagrunninum:"
                : language === "es"
                ? "Actualiza el estado real de despacho en Firestore para este pedido:"
                : "Update the live order state directly in Firestore:"}
            </p>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => handleUpdateStatus(1)}
                disabled={isUpdatingStatus}
                className={`cursor-pointer px-3 py-1.5 rounded text-xs font-medium border transition-colors ${
                  currentStep === 1
                    ? "bg-[#b2903b] text-white border-[#b2903b]"
                    : "bg-white text-neutral-800 border-neutral-300 hover:border-[#b2903b]"
                }`}
              >
                1. {language === "is" ? "Í vinnslu" : language === "es" ? "En preparación" : "Processing"}
              </button>

              <button
                type="button"
                onClick={() => handleUpdateStatus(2)}
                disabled={isUpdatingStatus}
                className={`cursor-pointer px-3 py-1.5 rounded text-xs font-medium border transition-colors ${
                  currentStep === 2
                    ? "bg-[#b2903b] text-white border-[#b2903b]"
                    : "bg-white text-neutral-800 border-neutral-300 hover:border-[#b2903b]"
                }`}
              >
                2. {language === "is" ? "Sent af stað (Dropp/Póstur)" : language === "es" ? "Despachado con Dropp/Íslandspóstur" : "Dispatched"}
              </button>

              <button
                type="button"
                onClick={() => handleUpdateStatus(3)}
                disabled={isUpdatingStatus}
                className={`cursor-pointer px-3 py-1.5 rounded text-xs font-medium border transition-colors ${
                  currentStep === 3
                    ? "bg-emerald-600 text-white border-emerald-600"
                    : "bg-white text-neutral-800 border-neutral-300 hover:border-emerald-600"
                }`}
              >
                3. {language === "is" ? "Afhent" : language === "es" ? "Entregado" : "Delivered"}
              </button>
            </div>
          </div>
        )}

        {/* Modal Footer Actions */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-3 border-t border-[#b2903b]/20">
          {onOpenReceipt && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenReceipt(liveOrder);
              }}
              className="cursor-pointer inline-flex items-center gap-1.5 text-xs text-[#b2903b] hover:text-[#997c32] underline font-semibold"
            >
              <FileText className="w-4 h-4" />
              <span>{language === "is" ? "Skoða opinbera kaupkvittun" : language === "es" ? "Ver recibo fiscal de compra" : "View purchase receipt"}</span>
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer w-full sm:w-auto px-6 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-sans uppercase tracking-wider rounded font-medium transition-colors"
          >
            {language === "is" ? "Loka rakningu" : language === "es" ? "Cerrar seguimiento" : "Close tracking"}
          </button>
        </div>
      </div>
    </div>
  );
}
