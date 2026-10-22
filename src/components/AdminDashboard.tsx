import React, { useState, useEffect, useMemo } from "react";
import {
  ShieldCheck,
  Users,
  Search,
  RefreshCw,
  ExternalLink,
  X,
  UploadCloud,
  CheckCircle2,
  Calendar,
  Mail,
  User as UserIcon,
  HardDrive,
  Eye,
  LogOut,
  ArrowLeft,
  ArrowRight,
  Database,
  Crown,
  FileCheck,
  Copy,
  Check,
  Code,
  Package,
  Truck,
  CheckCircle,
  Clock,
  Tag,
  Receipt,
  Printer,
  ChevronRight,
  Sliders,
  DollarSign,
  Gift,
  Phone,
  MapPin,
  Sparkles,
  AlertCircle,
  Briefcase,
  Boxes,
  ClipboardList,
  Lock
} from "lucide-react";
import { Language } from "../translations";
import {
  auth,
  MASTER_ADMIN_UID,
  WORKER_UID,
  checkIsAdmin,
  checkIsWorker,
  checkIsStaffOrAdmin,
  fetchAllUsersWithFileCounts,
  fetchAllOrdersForAdmin,
  updateOrderStatusInFirestore,
  updateUserMembershipInFirestore,
  testStorageConnection,
  AdminUserSummary,
  OrderData,
  logoutUser,
  getEmailJsConfig,
  updateEmailJsConfig,
  sendFirstPurchasePromo
} from "../firebase";
import ReceiptModal from "./ReceiptModal";

interface AdminDashboardProps {
  language: Language;
  onBack: () => void;
  onSignOut: () => void;
  onSwitchToPersonalDashboard?: () => void;
  isWorkerMode?: boolean;
  allowToggleWorkerPreview?: boolean;
}

type TabType = "orders" | "users" | "discounts" | "storage";
type OrderStatusFilter = "all" | "preparing" | "shipped" | "delivered";

export default function AdminDashboard({
  language,
  onBack,
  onSignOut,
  onSwitchToPersonalDashboard,
  isWorkerMode = false,
  allowToggleWorkerPreview = false
}: AdminDashboardProps) {
  // Navigation tabs
  const [activeTab, setActiveTab] = useState<TabType>("orders");
  const [orderFilter, setOrderFilter] = useState<OrderStatusFilter>("all");

  // Determine current active role strictly from verified Firebase Auth user
  const isDedicatedWorkerUser = Boolean(auth.currentUser && checkIsWorker(auth.currentUser));
  const isMasterAdmin = Boolean(auth.currentUser && checkIsAdmin(auth.currentUser));

  // If logged in as worker, ALWAYS enforce workerMode. If master admin, allow preview toggle.
  const [workerPreviewActive, setWorkerPreviewActive] = useState<boolean>(isWorkerMode || isDedicatedWorkerUser);
  const effectiveWorkerMode = isDedicatedWorkerUser ? true : workerPreviewActive;
  const isAuthorized = Boolean(auth.currentUser && checkIsStaffOrAdmin(auth.currentUser));

  // Auto reset active tab to orders if worker mode is active and currently on restricted tab
  useEffect(() => {
    if (effectiveWorkerMode && (activeTab === "discounts" || activeTab === "storage")) {
      setActiveTab("orders");
    }
  }, [effectiveWorkerMode, activeTab]);

  // Data states
  const [users, setUsers] = useState<AdminUserSummary[]>([]);
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Modals & Selected items
  const [receiptOrder, setReceiptOrder] = useState<OrderData | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<AdminUserSummary | null>(null);
  const [editingOrder, setEditingOrder] = useState<OrderData | null>(null);
  const [toastMessage, setToastMessage] = useState<string>("");

  // Order status update form states inside modal
  const [newStatusStep, setNewStatusStep] = useState<number>(1);
  const [newCarrier, setNewCarrier] = useState<string>("Dropp");
  const [newTrackingNumber, setNewTrackingNumber] = useState<string>("");
  const [isUpdatingOrder, setIsUpdatingOrder] = useState<boolean>(false);

  // Membership modal editing (Admin only)
  const [editingMembershipUser, setEditingMembershipUser] = useState<AdminUserSummary | null>(null);
  const [newTier, setNewTier] = useState<string>("Klóne VIP");
  const [isUpdatingMembership, setIsUpdatingMembership] = useState<boolean>(false);

  // Storage tab diagnostics
  const [storageStatus, setStorageStatus] = useState<{ tested: boolean; success: boolean; message: string; bucket: string } | null>(null);
  const [isTestingStorage, setIsTestingStorage] = useState<boolean>(false);
  const [showStorageRules, setShowStorageRules] = useState<boolean>(false);
  const [copiedStorageRules, setCopiedStorageRules] = useState<boolean>(false);

  // EmailJS Promo Flyer configuration state
  const [emailJsConfigState, setEmailJsConfigState] = useState(getEmailJsConfig());
  const [emailJsTemplateInput, setEmailJsTemplateInput] = useState<string>(getEmailJsConfig().TEMPLATE_ID);
  const [emailJsServiceInput, setEmailJsServiceInput] = useState<string>(getEmailJsConfig().SERVICE_ID);
  const [emailJsKeyInput, setEmailJsKeyInput] = useState<string>(getEmailJsConfig().PUBLIC_KEY);
  const [isTestingEmailJs, setIsTestingEmailJs] = useState<boolean>(false);
  const [emailJsFeedback, setEmailJsFeedback] = useState<{ type: "success" | "error" | "info"; msg: string } | null>(null);

  const displayUid = effectiveWorkerMode ? WORKER_UID : (auth.currentUser?.uid || MASTER_ADMIN_UID);
  const displayEmail = auth.currentUser?.email || (effectiveWorkerMode ? "staff@lxsscents.com" : "leidenzperdomo7@gmail.com");

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 3500);
  };

  // Load all data from Firestore (strictly restricted to Admin and Staff)
  const loadDashboardData = async () => {
    if (!isAuthorized) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setErrorMsg("");
    try {
      const [usersData, ordersData] = await Promise.all([
        fetchAllUsersWithFileCounts(),
        fetchAllOrdersForAdmin()
      ]);
      setUsers(usersData);
      setOrders(ordersData);
    } catch (err: any) {
      console.error("Failed to load dashboard data:", err);
      setErrorMsg(err.message || "Could not retrieve data from Firestore.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  // Quick Order Status Advancement directly from card
  const handleQuickAdvanceStatus = async (order: OrderData, nextStep: number) => {
    let nextStatus = "En preparación";
    if (nextStep === 2) {
      nextStatus = `Despachado con ${order.carrier || "Dropp"}`;
    } else if (nextStep === 3) {
      nextStatus = "Entregado";
    }

    try {
      await updateOrderStatusInFirestore(
        order.userId,
        order.id,
        nextStatus,
        nextStep,
        order.carrier,
        order.trackingNumber
      );

      setOrders(prev =>
        prev.map(o =>
          o.id === order.id ? { ...o, statusStep: nextStep, status: nextStatus } : o
        )
      );

      showToast(
        language === "es"
          ? `Orden ${order.id} actualizada a: ${nextStatus}`
          : `Order ${order.id} updated to: ${nextStatus}`
      );
    } catch (err: any) {
      console.error("Error advancing order:", err);
      showToast(err.message || "Failed to update order");
    }
  };

  // Open Edit Order Modal
  const handleOpenEditOrder = (order: OrderData) => {
    setEditingOrder(order);
    setNewStatusStep(order.statusStep || 1);
    setNewCarrier(order.carrier || "Dropp");
    setNewTrackingNumber(order.trackingNumber || "");
  };

  // Save changes from Edit Order Modal
  const handleSaveOrderChanges = async () => {
    if (!editingOrder) return;
    setIsUpdatingOrder(true);
    let nextStatus = "En preparación";
    if (newStatusStep === 2) {
      nextStatus = `Despachado con ${newCarrier}`;
    } else if (newStatusStep === 3) {
      nextStatus = "Entregado";
    }

    try {
      await updateOrderStatusInFirestore(
        editingOrder.userId,
        editingOrder.id,
        nextStatus,
        newStatusStep,
        newCarrier,
        newTrackingNumber
      );

      setOrders(prev =>
        prev.map(o =>
          o.id === editingOrder.id
            ? {
                ...o,
                statusStep: newStatusStep,
                status: nextStatus,
                carrier: newCarrier,
                trackingNumber: newTrackingNumber,
                trackingUrl:
                  newCarrier === "Dropp"
                    ? `https://dropp.is/track/${newTrackingNumber}`
                    : `https://postur.is/track/${newTrackingNumber}`
              }
            : o
        )
      );

      showToast(
        language === "es"
          ? `¡Orden ${editingOrder.id} actualizada con éxito!`
          : `Order ${editingOrder.id} updated successfully!`
      );
      setEditingOrder(null);
    } catch (err: any) {
      console.error("Error saving order changes:", err);
      showToast(err.message || "Could not save order changes");
    } finally {
      setIsUpdatingOrder(false);
    }
  };

  // Update User Membership (Admin Only)
  const handleSaveMembership = async () => {
    if (!editingMembershipUser || effectiveWorkerMode) return;
    setIsUpdatingMembership(true);
    const isVip = newTier === "Klóne VIP" || newTier === "Gold VIP";
    try {
      await updateUserMembershipInFirestore(editingMembershipUser.id, {
        membershipTier: newTier,
        isKloneMember: isVip,
        points: isVip ? 150 : 50
      });

      setUsers(prev =>
        prev.map(u =>
          u.id === editingMembershipUser.id
            ? { ...u, membershipTier: newTier, isKloneMember: isVip, points: isVip ? 150 : 50 }
            : u
        )
      );

      showToast(
        language === "es"
          ? `Membresía actualizada a ${newTier} para ${editingMembershipUser.displayName}`
          : `Membership updated to ${newTier} for ${editingMembershipUser.displayName}`
      );
      setEditingMembershipUser(null);
    } catch (err: any) {
      console.error("Error updating membership:", err);
      showToast(err.message || "Could not update membership");
    } finally {
      setIsUpdatingMembership(false);
    }
  };

  // Test Storage
  const handleTestStorage = async () => {
    setIsTestingStorage(true);
    try {
      const result = await testStorageConnection();
      setStorageStatus({
        tested: true,
        success: result.success,
        message: result.message,
        bucket: result.bucket
      });
    } catch (err: any) {
      setStorageStatus({
        tested: true,
        success: false,
        message: err.message || "Error al conectar con Storage",
        bucket: "singular-berm-9mn89.firebasestorage.app"
      });
    } finally {
      setIsTestingStorage(false);
    }
  };

  // Computations & Metrics
  const ordersPreparing = useMemo(
    () => orders.filter(o => !o.statusStep || o.statusStep === 1 || o.status.toLowerCase().includes("preparac")),
    [orders]
  );
  const ordersShipped = useMemo(
    () => orders.filter(o => o.statusStep === 2 || o.status.toLowerCase().includes("despach") || o.status.toLowerCase().includes("enviad")),
    [orders]
  );
  const ordersDelivered = useMemo(
    () => orders.filter(o => o.statusStep === 3 || o.status.toLowerCase().includes("entregad")),
    [orders]
  );

  // Financial calculations (strictly only shown when NOT in worker mode)
  const totalRevenue = useMemo(
    () => orders.reduce((sum, o) => sum + (Number(o.total) || 0), 0),
    [orders]
  );

  const totalDiscountGranted = useMemo(
    () => orders.reduce((sum, o) => sum + (Number(o.discount) || 0), 0),
    [orders]
  );

  const vipMembersCount = useMemo(
    () => users.filter(u => u.isKloneMember || u.membershipTier === "Klóne VIP" || u.membershipTier === "vip").length,
    [users]
  );

  // Filtered Orders
  const filteredOrders = useMemo(() => {
    let list = orders;
    if (orderFilter === "preparing") {
      list = ordersPreparing;
    } else if (orderFilter === "shipped") {
      list = ordersShipped;
    } else if (orderFilter === "delivered") {
      list = ordersDelivered;
    }

    const q = searchQuery.toLowerCase().trim();
    if (!q) return list;

    return list.filter(o =>
      o.id.toLowerCase().includes(q) ||
      o.customerName?.toLowerCase().includes(q) ||
      o.customerEmail?.toLowerCase().includes(q) ||
      o.trackingNumber?.toLowerCase().includes(q) ||
      o.carrier?.toLowerCase().includes(q) ||
      o.shippingMethod?.toLowerCase().includes(q)
    );
  }, [orders, orderFilter, searchQuery, ordersPreparing, ordersShipped, ordersDelivered]);

  // Filtered Users
  const filteredUsers = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return users;

    return users.filter(u =>
      u.email.toLowerCase().includes(q) ||
      u.displayName?.toLowerCase().includes(q) ||
      u.id.toLowerCase().includes(q) ||
      u.phone?.toLowerCase().includes(q) ||
      u.cityZip?.toLowerCase().includes(q) ||
      u.membershipTier?.toLowerCase().includes(q)
    );
  }, [users, searchQuery]);

  // Format currency (only used in master owner mode)
  const formatIsk = (amount: number) => {
    return `${amount.toLocaleString("is-IS")} kr.`;
  };

  // Format date
  const formatDate = (dateStr?: string) => {
    if (!dateStr || dateStr === "N/A") return "—";
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString(language === "is" ? "is-IS" : language === "es" ? "es-ES" : "en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });
    } catch {
      return dateStr;
    }
  };

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-neutral-950 text-white flex items-center justify-center p-6 text-center font-sans">
        <div className="max-w-md bg-neutral-900 border border-neutral-800 rounded-2xl p-8 space-y-4">
          <div className="w-12 h-12 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold font-serif text-white">
            {language === "is" ? "Aðgangur bannaður" : language === "es" ? "Acceso Restringido" : "Access Restricted"}
          </h2>
          <p className="text-xs text-neutral-400 leading-relaxed">
            {language === "is"
              ? "Þetta stjórnborð er eingöngu ætlað stjórnanda og vöruhúsi LxS SCENTS. Notendagögn eru stranglega aðskilin."
              : language === "es"
              ? "Este panel está reservado exclusivamente para la administración y el equipo de almacén. Los datos de clientes están estrictamente aislados."
              : "This dashboard is exclusively accessible to administrators and warehouse staff. All customer data is strictly isolated."}
          </p>
          <button
            onClick={onBack}
            className="cursor-pointer w-full py-2.5 px-4 bg-[#b2903b] hover:bg-[#8a6d25] text-neutral-950 font-semibold rounded-lg text-xs uppercase tracking-wider transition-colors"
          >
            {language === "is" ? "Aftur í verslun" : language === "es" ? "Volver a la Tienda" : "Return to Store"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-[#fbfaf8] text-neutral-900 font-sans pb-28 select-none">
      {/* Toast Feedback */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-neutral-950 text-white border border-[#b2903b]/50 px-5 py-3 rounded-lg shadow-2xl flex items-center gap-3 text-xs animate-bounce font-medium">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Admin Sticky Navigation Bar */}
      <div className="bg-neutral-950 text-white border-b border-[#b2903b]/30 sticky top-0 z-30 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-wrap items-center justify-between gap-3">
          {/* Identity & Status */}
          <div className="flex items-center gap-3">
            {!effectiveWorkerMode ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/15 border border-amber-400/40 rounded-full text-amber-300 font-mono text-[11px] sm:text-xs font-semibold tracking-wider uppercase">
                <Crown className="w-4 h-4 text-amber-400" />
                <span>Master Admin (Dirección)</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-500/15 border border-blue-400/40 rounded-full text-blue-300 font-mono text-[11px] sm:text-xs font-semibold tracking-wider uppercase">
                <Truck className="w-4 h-4 text-blue-400" />
                <span>Panel Operativo (Almacén & Envíos)</span>
              </span>
            )}

            <span className="hidden md:inline-block text-xs text-neutral-400 font-mono">
              UID: <span className="text-neutral-200">{displayUid}</span>
            </span>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2 sm:gap-3 text-xs font-sans">
            {/* Master Admin preview toggle button */}
            {!isDedicatedWorkerUser && isMasterAdmin && (
              <button
                onClick={() => setWorkerPreviewActive(!workerPreviewActive)}
                className={`cursor-pointer px-3 py-1.5 rounded border text-xs font-medium transition-colors flex items-center gap-1.5 ${
                  effectiveWorkerMode
                    ? "bg-amber-500 text-neutral-950 font-bold border-amber-400"
                    : "bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border-neutral-700"
                }`}
                title="Alternar entre vista de dueño (con precios) y vista de empleado (sin precios)"
              >
                {effectiveWorkerMode ? (
                  <>
                    <Crown className="w-3.5 h-3.5 text-neutral-950" />
                    <span>Volver a Vista Dueño (Con Precios)</span>
                  </>
                ) : (
                  <>
                    <Eye className="w-3.5 h-3.5 text-blue-400" />
                    <span>Simular Vista Empleado (Sin Precios)</span>
                  </>
                )}
              </button>
            )}

            {onSwitchToPersonalDashboard && (
              <button
                onClick={onSwitchToPersonalDashboard}
                className="cursor-pointer text-neutral-300 hover:text-white px-2 py-1 transition-colors underline underline-offset-4"
              >
                {language === "es" ? "Vista de Cliente" : language === "is" ? "Skoða persónulegt yfirlit" : "Client view"}
              </button>
            )}

            <button
              onClick={onBack}
              className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-neutral-200 rounded border border-neutral-700 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>{language === "es" ? "Volver a la Tienda" : language === "is" ? "Aftur í verslun" : "Storefront"}</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {/* Header Title */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-neutral-200">
          <div>
            <div className="flex items-center gap-2 text-[#b2903b] text-xs font-semibold uppercase tracking-[0.2em] mb-1">
              {!effectiveWorkerMode ? (
                <>
                  <Crown className="w-4 h-4 text-[#b2903b]" />
                  <span>LxS SCENTS • Suite Directiva</span>
                </>
              ) : (
                <>
                  <Boxes className="w-4 h-4 text-[#b2903b]" />
                  <span>LxS SCENTS • Centro de Alistamiento & Envíos</span>
                </>
              )}
            </div>
            <h1 className="text-2xl sm:text-4xl font-serif font-bold text-neutral-950 tracking-tight">
              {!effectiveWorkerMode
                ? (language === "es"
                  ? "Gestión de Órdenes, Compras y Clientes"
                  : language === "is"
                  ? "Pantanir, Kaup og Notendastjórnun"
                  : "Orders, Fulfillment & Customer Suite")
                : (language === "es"
                  ? "Centro Operativo de Preparación y Envíos"
                  : "Operations & Order Fulfillment Hub")}
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-neutral-600">
              {!effectiveWorkerMode
                ? (language === "es"
                  ? "Monitorea el flujo comercial en tiempo real: compras en preparación, envíos en ruta, entregas, membresías VIP y facturación real."
                  : "Real-time control over orders, shipping pipeline, customer membership tiers, and purchase invoices.")
                : (language === "es"
                  ? "Información operativa en tiempo real para preparación de pedidos, empaque de fragancias, asignación de guías y despacho con Dropp/Íslandspóstur/DHL (sin datos financieros)."
                  : "Operational order preparation, packing, and dispatch logistics for warehouse staff (financials hidden).")}
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-md text-[11px] font-mono font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>En Vivo & Sincronizado</span>
            </span>

            {/* Endurhlaða / Actualizar button */}
            <button
              onClick={loadDashboardData}
              disabled={isLoading}
              className="cursor-pointer inline-flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-neutral-50 text-neutral-800 rounded-md border border-neutral-300 text-xs sm:text-sm font-medium shadow-xs transition-all active:scale-95 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-[#b2903b]" : ""}`} />
              <span>{language === "es" ? "Actualizar Datos" : language === "is" ? "Endurhlaða" : "Refresh"}</span>
            </button>

            {/* Skrá út / Cerrar sesión button placed right next to Endurhlaða */}
            <button
              onClick={async () => {
                try {
                  await logoutUser();
                } catch (e) {
                  console.warn("Logout notice:", e);
                }
                onSignOut();
              }}
              className="cursor-pointer inline-flex items-center gap-2 px-3.5 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-md border border-neutral-800 text-xs sm:text-sm font-medium shadow-xs transition-all active:scale-95"
              title={language === "is" ? "Skrá út" : language === "es" ? "Cerrar sesión" : "Log out"}
            >
              <LogOut className="w-3.5 h-3.5 text-neutral-300" />
              <span>{language === "is" ? "Skrá út" : language === "es" ? "Cerrar sesión" : "Log out"}</span>
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 4 LUXURY METRIC SUMMARY CARDS */}
        {/* ========================================================================= */}
        {!effectiveWorkerMode ? (
          /* MASTER ADMIN VIEW: INCLUDES SALES & FINANCIAL TOTALS */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 my-6">
            {/* Card 1: Total Orders */}
            <div
              onClick={() => {
                setActiveTab("orders");
                setOrderFilter("all");
              }}
              className="bg-white p-5 rounded-xl border border-neutral-200 shadow-xs cursor-pointer hover:border-[#b2903b]/60 transition-all group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-wider text-neutral-500 font-semibold font-mono">
                  {language === "es" ? "Total de Órdenes" : "Total Orders"}
                </span>
                <div className="w-10 h-10 bg-amber-50 text-[#b2903b] rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Package className="w-5 h-5" />
                </div>
              </div>
              <p className="text-3xl font-serif font-bold text-neutral-950 mt-2">
                {isLoading ? "..." : orders.length}
              </p>
              <div className="mt-3 flex items-center gap-1.5 flex-wrap text-[11px] font-mono">
                <span className="px-1.5 py-0.5 rounded bg-amber-100/80 text-amber-900 font-semibold">
                  {ordersPreparing.length} Prep
                </span>
                <span className="px-1.5 py-0.5 rounded bg-blue-100/80 text-blue-900 font-semibold">
                  {ordersShipped.length} Ruta
                </span>
                <span className="px-1.5 py-0.5 rounded bg-emerald-100/80 text-emerald-900 font-semibold">
                  {ordersDelivered.length} Entreg
                </span>
              </div>
            </div>

            {/* Card 2: Total Sales / Revenue */}
            <div className="bg-white p-5 rounded-xl border border-neutral-200 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-wider text-neutral-500 font-semibold font-mono">
                  {language === "es" ? "Ventas Totales" : "Total Revenue"}
                </span>
                <div className="w-10 h-10 bg-emerald-50 text-emerald-700 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-5 h-5" />
                </div>
              </div>
              <p className="text-2xl sm:text-3xl font-serif font-bold text-neutral-950 mt-2">
                {isLoading ? "..." : formatIsk(totalRevenue)}
              </p>
              <p className="text-[11px] text-neutral-500 mt-2 flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                <span>{language === "es" ? "Facturación procesada en ISK" : "Total processed in ISK"}</span>
              </p>
            </div>

            {/* Card 3: Registered Users & Memberships */}
            <div
              onClick={() => setActiveTab("users")}
              className="bg-white p-5 rounded-xl border border-neutral-200 shadow-xs cursor-pointer hover:border-[#b2903b]/60 transition-all group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-wider text-neutral-500 font-semibold font-mono">
                  {language === "es" ? "Usuarios Registrados" : "Registered Users"}
                </span>
                <div className="w-10 h-10 bg-indigo-50 text-indigo-700 rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Users className="w-5 h-5" />
                </div>
              </div>
              <p className="text-3xl font-serif font-bold text-neutral-950 mt-2">
                {isLoading ? "..." : users.length}
              </p>
              <p className="text-[11px] text-indigo-700 font-medium mt-2 flex items-center gap-1">
                <Crown className="w-3.5 h-3.5 text-[#b2903b]" />
                <span>{vipMembersCount} {language === "es" ? "Membresías Klóne VIP" : "VIP Members"}</span>
              </p>
            </div>

            {/* Card 4: Total Discounts Given */}
            <div
              onClick={() => setActiveTab("discounts")}
              className="bg-white p-5 rounded-xl border border-neutral-200 shadow-xs cursor-pointer hover:border-[#b2903b]/60 transition-all group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-wider text-neutral-500 font-semibold font-mono">
                  {language === "es" ? "Descuentos Otorgados" : "Discounts Given"}
                </span>
                <div className="w-10 h-10 bg-rose-50 text-rose-700 rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Gift className="w-5 h-5" />
                </div>
              </div>
              <p className="text-2xl sm:text-3xl font-serif font-bold text-neutral-950 mt-2">
                {isLoading ? "..." : formatIsk(totalDiscountGranted)}
              </p>
              <p className="text-[11px] text-rose-700 font-medium mt-2 flex items-center gap-1">
                <Tag className="w-3.5 h-3.5" />
                <span>{language === "es" ? "Beneficio total otorgado a clientes" : "Total customer discount"}</span>
              </p>
            </div>
          </div>
        ) : (
          /* WORKER / STAFF VIEW: STRICTLY OPERATIONAL (NO PRICES, NO FINANCIAL DATA) */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 my-6">
            {/* Card 1: Total Orders */}
            <div
              onClick={() => {
                setActiveTab("orders");
                setOrderFilter("all");
              }}
              className="bg-white p-5 rounded-xl border border-neutral-200 shadow-xs cursor-pointer hover:border-[#b2903b]/60 transition-all group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-wider text-neutral-500 font-semibold font-mono">
                  {language === "es" ? "Total de Pedidos" : "Total Orders"}
                </span>
                <div className="w-10 h-10 bg-neutral-100 text-neutral-700 rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform">
                  <ClipboardList className="w-5 h-5" />
                </div>
              </div>
              <p className="text-3xl font-serif font-bold text-neutral-950 mt-2">
                {isLoading ? "..." : orders.length}
              </p>
              <p className="text-[11px] text-neutral-500 mt-2">
                {language === "es" ? "Órdenes registradas en sistema" : "Total registered orders"}
              </p>
            </div>

            {/* Card 2: Preparing */}
            <div
              onClick={() => {
                setActiveTab("orders");
                setOrderFilter("preparing");
              }}
              className="bg-white p-5 rounded-xl border border-amber-200 shadow-xs cursor-pointer hover:border-amber-400 transition-all group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-wider text-amber-800 font-semibold font-mono">
                  {language === "es" ? "1. Por Preparar" : "1. To Prepare"}
                </span>
                <div className="w-10 h-10 bg-amber-50 text-amber-700 rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Clock className="w-5 h-5" />
                </div>
              </div>
              <p className="text-3xl font-serif font-bold text-amber-900 mt-2">
                {isLoading ? "..." : ordersPreparing.length}
              </p>
              <p className="text-[11px] text-amber-700 font-medium mt-2 flex items-center gap-1">
                <span>{language === "es" ? "En mesa de empaque / Almacén" : "In packing warehouse"}</span>
              </p>
            </div>

            {/* Card 3: Shipped / In Transit */}
            <div
              onClick={() => {
                setActiveTab("orders");
                setOrderFilter("shipped");
              }}
              className="bg-white p-5 rounded-xl border border-blue-200 shadow-xs cursor-pointer hover:border-blue-400 transition-all group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-wider text-blue-800 font-semibold font-mono">
                  {language === "es" ? "2. En Ruta / Despachados" : "2. In Transit"}
                </span>
                <div className="w-10 h-10 bg-blue-50 text-blue-700 rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Truck className="w-5 h-5" />
                </div>
              </div>
              <p className="text-3xl font-serif font-bold text-blue-900 mt-2">
                {isLoading ? "..." : ordersShipped.length}
              </p>
              <p className="text-[11px] text-blue-700 font-medium mt-2 flex items-center gap-1">
                <span>{language === "es" ? "Con Dropp / Íslandspóstur / DHL" : "With postal couriers"}</span>
              </p>
            </div>

            {/* Card 4: Delivered */}
            <div
              onClick={() => {
                setActiveTab("orders");
                setOrderFilter("delivered");
              }}
              className="bg-white p-5 rounded-xl border border-emerald-200 shadow-xs cursor-pointer hover:border-emerald-400 transition-all group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-wider text-emerald-800 font-semibold font-mono">
                  {language === "es" ? "3. Entregados" : "3. Delivered"}
                </span>
                <div className="w-10 h-10 bg-emerald-50 text-emerald-700 rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
              </div>
              <p className="text-3xl font-serif font-bold text-emerald-900 mt-2">
                {isLoading ? "..." : ordersDelivered.length}
              </p>
              <p className="text-[11px] text-emerald-700 font-medium mt-2 flex items-center gap-1">
                <span>{language === "es" ? "Completados satisfactoriamente" : "Successfully completed"}</span>
              </p>
            </div>
          </div>
        )}

        {/* Tab Navigation Controls */}
        <div className="flex flex-wrap items-center justify-between border-b border-neutral-200 pb-3 gap-3">
          <div className="flex items-center gap-2 overflow-x-auto">
            <button
              onClick={() => setActiveTab("orders")}
              className={`cursor-pointer px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 ${
                activeTab === "orders"
                  ? "bg-neutral-950 text-white shadow-xs"
                  : "bg-white text-neutral-600 hover:text-neutral-950 border border-neutral-200"
              }`}
            >
              <Package className="w-4 h-4 text-amber-400" />
              <span>{language === "es" ? "Gestión de Órdenes & Envíos" : "Orders & Fulfillment"}</span>
              <span className="ml-1 text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-white/20 text-white font-bold">
                {orders.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("users")}
              className={`cursor-pointer px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 ${
                activeTab === "users"
                  ? "bg-neutral-950 text-white shadow-xs"
                  : "bg-white text-neutral-600 hover:text-neutral-950 border border-neutral-200"
              }`}
            >
              <Users className="w-4 h-4 text-indigo-400" />
              <span>
                {!effectiveWorkerMode
                  ? (language === "es" ? "Clientes & Membresías" : "Customers & Members")
                  : (language === "es" ? "Directorio de Clientes" : "Customer Directory")}
              </span>
              <span className="ml-1 text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-white/20 text-white font-bold">
                {users.length}
              </span>
            </button>

            {/* Discounts Tab is ONLY available in Master Owner mode */}
            {!effectiveWorkerMode && (
              <button
                onClick={() => setActiveTab("discounts")}
                className={`cursor-pointer px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 ${
                  activeTab === "discounts"
                    ? "bg-neutral-950 text-white shadow-xs"
                    : "bg-white text-neutral-600 hover:text-neutral-950 border border-neutral-200"
                }`}
              >
                <Tag className="w-4 h-4 text-rose-400" />
                <span>{language === "es" ? "Descuentos & Facturas" : "Discounts & Invoices"}</span>
              </button>
            )}

            {!effectiveWorkerMode && (
              <button
                onClick={() => setActiveTab("storage")}
                className={`cursor-pointer px-3.5 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all flex items-center gap-1.5 ${
                  activeTab === "storage"
                    ? "bg-neutral-950 text-white shadow-xs"
                    : "bg-white text-neutral-600 hover:text-neutral-950 border border-neutral-200"
                }`}
              >
                <HardDrive className="w-3.5 h-3.5 text-[#b2903b]" />
                <span>Storage</span>
              </button>
            )}
          </div>

          {/* Search bar */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder={
                activeTab === "orders"
                  ? (language === "es" ? "Buscar orden, cliente, tracking..." : "Search order #, customer...")
                  : (language === "es" ? "Buscar cliente por correo o nombre..." : "Search user by email...")
              }
              className="w-full pl-9 pr-4 py-2 border border-neutral-300 rounded-lg text-xs sm:text-sm bg-white focus:outline-none focus:ring-1 focus:ring-[#b2903b] focus:border-[#b2903b]"
            />
          </div>
        </div>

        {/* ========================================================================= */}
        {/* TAB 1: ORDERS & FULFILLMENT PIPELINE */}
        {/* ========================================================================= */}
        {activeTab === "orders" && (
          <div className="mt-6 space-y-5">
            {/* Status Filter Pills */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setOrderFilter("all")}
                className={`cursor-pointer px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  orderFilter === "all"
                    ? "bg-[#b2903b] text-white shadow-xs"
                    : "bg-white text-neutral-700 border border-neutral-300 hover:bg-neutral-50"
                }`}
              >
                {language === "es" ? "Todas las Órdenes" : "All Orders"} ({orders.length})
              </button>

              <button
                onClick={() => setOrderFilter("preparing")}
                className={`cursor-pointer px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  orderFilter === "preparing"
                    ? "bg-amber-600 text-white shadow-xs"
                    : "bg-white text-amber-900 border border-amber-300 hover:bg-amber-50/50"
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>{language === "es" ? "1. En Preparación" : "1. Preparing"}</span>
                <span className="font-mono bg-amber-100 text-amber-950 px-1.5 py-0.2 rounded-full text-[10px]">
                  {ordersPreparing.length}
                </span>
              </button>

              <button
                onClick={() => setOrderFilter("shipped")}
                className={`cursor-pointer px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  orderFilter === "shipped"
                    ? "bg-blue-600 text-white shadow-xs"
                    : "bg-white text-blue-900 border border-blue-300 hover:bg-blue-50/50"
                }`}
              >
                <Truck className="w-3.5 h-3.5" />
                <span>{language === "es" ? "2. Despachadas / En Camino" : "2. Dispatched / In Transit"}</span>
                <span className="font-mono bg-blue-100 text-blue-950 px-1.5 py-0.2 rounded-full text-[10px]">
                  {ordersShipped.length}
                </span>
              </button>

              <button
                onClick={() => setOrderFilter("delivered")}
                className={`cursor-pointer px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  orderFilter === "delivered"
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "bg-white text-emerald-900 border border-emerald-300 hover:bg-emerald-50/50"
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{language === "es" ? "3. Entregadas" : "3. Delivered"}</span>
                <span className="font-mono bg-emerald-100 text-emerald-950 px-1.5 py-0.2 rounded-full text-[10px]">
                  {ordersDelivered.length}
                </span>
              </button>
            </div>

            {/* Orders List */}
            {isLoading ? (
              <div className="py-20 text-center space-y-3 bg-white rounded-xl border border-neutral-200">
                <RefreshCw className="w-8 h-8 text-[#b2903b] animate-spin mx-auto" />
                <p className="text-xs uppercase tracking-widest text-neutral-500 font-medium">
                  {language === "es" ? "Cargando órdenes y compras desde Firestore..." : "Loading orders from Firestore..."}
                </p>
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="py-16 text-center text-neutral-500 bg-white rounded-xl border border-neutral-200 space-y-3">
                <Package className="w-10 h-10 text-neutral-300 mx-auto" />
                <p className="text-sm font-semibold text-neutral-800">
                  {language === "es" ? "No se encontraron órdenes con ese criterio" : "No orders found"}
                </p>
                <p className="text-xs text-neutral-400 max-w-sm mx-auto">
                  {language === "es"
                    ? "Las compras realizadas en la tienda por los clientes aparecerán aquí automáticamente en tiempo real."
                    : "Purchases made in the store will appear here in real time."}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {filteredOrders.map(order => {
                  const step = order.statusStep || 1;
                  const isDelivered = step === 3;
                  const isShipped = step === 2;
                  const isPrep = step === 1;

                  return (
                    <div
                      key={order.id}
                      className="bg-white border border-neutral-200 hover:border-[#b2903b]/70 rounded-xl p-5 shadow-xs transition-all flex flex-col justify-between gap-4"
                    >
                      {/* Top Header of Order */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3.5 border-b border-neutral-100 gap-3">
                        <div className="flex items-center gap-3">
                          <span className="font-mono font-bold text-sm bg-neutral-900 text-amber-300 px-2.5 py-1 rounded">
                            {order.id}
                          </span>

                          <div>
                            <span className="font-semibold text-neutral-950 text-sm">
                              {order.customerName || order.customerEmail || "Cliente"}
                            </span>
                            <p className="text-[11px] text-neutral-400 font-mono">
                              {order.customerEmail} • {formatDate(order.createdAt)}
                            </p>
                          </div>
                        </div>

                        {/* Status Badge + (Price in Admin mode, or Item Count in Worker mode) */}
                        <div className="flex items-center gap-2">
                          <span
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold font-mono ${
                              isDelivered
                                ? "bg-emerald-100 text-emerald-900 border border-emerald-300"
                                : isShipped
                                ? "bg-blue-100 text-blue-900 border border-blue-300"
                                : "bg-amber-100 text-amber-900 border border-amber-300"
                            }`}
                          >
                            {isDelivered ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                            ) : isShipped ? (
                              <Truck className="w-3.5 h-3.5 text-blue-700" />
                            ) : (
                              <Clock className="w-3.5 h-3.5 text-amber-700" />
                            )}
                            <span>{order.status}</span>
                          </span>

                          {/* PRICE ONLY SHOWN TO MASTER ADMIN */}
                          {!effectiveWorkerMode ? (
                            <span className="text-base font-serif font-bold text-neutral-950 font-mono">
                              {formatIsk(Number(order.total) || 0)}
                            </span>
                          ) : (
                            <span className="text-xs font-mono font-semibold text-neutral-700 bg-neutral-100 px-2.5 py-1 rounded">
                              {order.items?.reduce((acc, it) => acc + (it.quantity || 1), 0) || 1} {language === "es" ? "artículos" : "items"}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Visual 3-Step Process Indicator */}
                      <div className="py-2">
                        <div className="flex items-center justify-between max-w-md mx-auto relative">
                          <div className="absolute top-1/2 left-0 right-0 -translate-y-1/2 h-1 bg-neutral-200 z-0"></div>
                          <div
                            className={`absolute top-1/2 left-0 -translate-y-1/2 h-1 bg-emerald-500 z-0 transition-all ${
                              step === 1 ? "w-1/4" : step === 2 ? "w-2/3" : "w-full"
                            }`}
                          ></div>

                          {/* Step 1 */}
                          <div className="relative z-10 flex flex-col items-center">
                            <div
                              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                                step >= 1 ? "bg-emerald-600 text-white" : "bg-neutral-200 text-neutral-500"
                              }`}
                            >
                              1
                            </div>
                            <span className="text-[10px] font-mono font-medium text-neutral-700 mt-1">
                              Preparando
                            </span>
                          </div>

                          {/* Step 2 */}
                          <div className="relative z-10 flex flex-col items-center">
                            <div
                              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                                step >= 2 ? "bg-emerald-600 text-white" : "bg-neutral-200 text-neutral-500"
                              }`}
                            >
                              2
                            </div>
                            <span className="text-[10px] font-mono font-medium text-neutral-700 mt-1">
                              En Camino
                            </span>
                          </div>

                          {/* Step 3 */}
                          <div className="relative z-10 flex flex-col items-center">
                            <div
                              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                                step === 3 ? "bg-emerald-600 text-white" : "bg-neutral-200 text-neutral-500"
                              }`}
                            >
                              3
                            </div>
                            <span className="text-[10px] font-mono font-medium text-neutral-700 mt-1">
                              Entregado
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Order Content & Logistics Info */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-neutral-50/70 p-3.5 rounded-lg text-xs">
                        {/* Products to Pack & Prepare */}
                        <div>
                          <p className="font-semibold text-neutral-700 uppercase tracking-wider text-[10px] font-mono mb-1">
                            {language === "es" ? "Artículos a Preparar" : "Items to Prepare"}
                          </p>
                          <p className="text-neutral-900 font-medium line-clamp-2">
                            {order.itemsSummary ||
                              (order.items && order.items.length > 0
                                ? order.items.map(it => `${it.name} (x${it.quantity})`).join(", ")
                                : "Perfumes LxS SCENTS")}
                          </p>

                          {/* Discount coupon badge only shown to master admin */}
                          {!effectiveWorkerMode && order.discountCode && (
                            <span className="mt-1.5 inline-flex items-center gap-1 text-[10px] font-mono bg-rose-50 text-rose-800 border border-rose-200 px-2 py-0.5 rounded font-semibold">
                              <Tag className="w-3 h-3" />
                              <span>Cupón: {order.discountCode} (-{formatIsk(order.discount || 0)})</span>
                            </span>
                          )}
                        </div>

                        {/* Shipping Details */}
                        <div>
                          <p className="font-semibold text-neutral-700 uppercase tracking-wider text-[10px] font-mono mb-1">
                            {language === "es" ? "Dirección y Destino" : "Delivery Address"}
                          </p>
                          <p className="text-neutral-800 font-medium">
                            {order.customerAddress || "Reykjavík"}
                            {order.customerApartment ? `, ${order.customerApartment}` : ""}
                          </p>
                          <p className="text-neutral-500 font-mono text-[11px]">
                            {order.customerCityZip || "101 Reykjavík"}, {order.customerCountry || "Iceland"}
                          </p>
                          {order.customerPhone && (
                            <p className="text-neutral-500 font-mono text-[11px] flex items-center gap-1 mt-0.5">
                              <Phone className="w-3 h-3" /> {order.customerPhone}
                            </p>
                          )}
                        </div>

                        {/* Logistics Carrier & Tracking Link */}
                        <div>
                          <p className="font-semibold text-neutral-700 uppercase tracking-wider text-[10px] font-mono mb-1">
                            {language === "es" ? "Transportista & Rastreo" : "Carrier & Tracking"}
                          </p>
                          <p className="text-neutral-900 font-medium flex items-center gap-1.5">
                            <Truck className="w-3.5 h-3.5 text-neutral-500" />
                            <span>{order.carrier || "Dropp"}</span>
                            <span className="text-[10px] text-neutral-400 font-mono">
                              ({order.shippingMethod || "Pick-up point"})
                            </span>
                          </p>
                          {order.trackingNumber && (
                            <div className="mt-1 flex items-center gap-2">
                              <span className="font-mono text-neutral-600 text-[11px]">
                                {order.trackingNumber}
                              </span>
                              {order.trackingUrl && (
                                <a
                                  href={order.trackingUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-0.5 text-[#b2903b] hover:underline font-semibold text-[11px]"
                                >
                                  <span>Rastrear</span>
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Interactive Actions for Admin & Worker */}
                      <div className="flex flex-wrap items-center justify-between pt-2 gap-2 text-xs">
                        <div className="flex items-center gap-2 flex-wrap">
                          {/* Status transition quick buttons */}
                          {step !== 1 && (
                            <button
                              onClick={() => handleQuickAdvanceStatus(order, 1)}
                              className="cursor-pointer px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 rounded border border-amber-300 font-medium transition-colors"
                            >
                              {language === "es" ? "Mover a En Preparación" : "Set Preparing"}
                            </button>
                          )}

                          {step !== 2 && (
                            <button
                              onClick={() => handleQuickAdvanceStatus(order, 2)}
                              className="cursor-pointer px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-900 rounded border border-blue-300 font-medium transition-colors"
                            >
                              {language === "es" ? "Marcar Despachado / Enviado" : "Mark Dispatched"}
                            </button>
                          )}

                          {step !== 3 && (
                            <button
                              onClick={() => handleQuickAdvanceStatus(order, 3)}
                              className="cursor-pointer px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 rounded border border-emerald-300 font-medium transition-colors"
                            >
                              {language === "es" ? "Marcar Entregado" : "Mark Delivered"}
                            </button>
                          )}

                          <button
                            onClick={() => handleOpenEditOrder(order)}
                            className="cursor-pointer px-2.5 py-1.5 bg-white hover:bg-neutral-100 text-neutral-700 rounded border border-neutral-300 font-medium transition-colors flex items-center gap-1"
                          >
                            <Sliders className="w-3 h-3 text-[#b2903b]" />
                            <span>{language === "es" ? "Editar Guía / Tracking" : "Edit Tracking"}</span>
                          </button>
                        </div>

                        {/* View document (Receipt with prices for Master Admin, or Packing Slip without prices for Worker) */}
                        <button
                          onClick={() => setReceiptOrder(order)}
                          className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded font-medium shadow-xs transition-colors"
                        >
                          <Receipt className="w-3.5 h-3.5 text-amber-300" />
                          <span>
                            {!effectiveWorkerMode
                              ? (language === "es" ? "Ver Factura / Recibo" : "View Invoice")
                              : (language === "es" ? "Ver Albarán / Hoja de Despacho" : "View Packing Slip")}
                          </span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: REGISTERED CUSTOMERS (AND MEMBERSHIPS FOR ADMIN) */}
        {/* ========================================================================= */}
        {activeTab === "users" && (
          <div className="mt-6 space-y-5">
            <div className="flex items-center justify-between text-xs text-neutral-500 font-mono">
              <span>{filteredUsers.length} {language === "es" ? "usuarios registrados en Firestore" : "registered users in Firestore"}</span>
              {!effectiveWorkerMode && (
                <span>{vipMembersCount} {language === "es" ? "socios con membresía activa" : "active VIP members"}</span>
              )}
            </div>

            <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs sm:text-sm">
                  <thead>
                    <tr className="bg-neutral-50 border-b border-neutral-200 text-neutral-600 font-semibold text-[11px] sm:text-xs uppercase tracking-wider font-mono">
                      <th className="py-3.5 px-4 sm:px-6">Cliente / Correo</th>
                      <th className="py-3.5 px-4">{language === "es" ? "Destino / Ciudad" : "Destination"}</th>
                      <th className="py-3.5 px-4 text-center">Compras / Facturas</th>
                      {!effectiveWorkerMode && <th className="py-3.5 px-4 text-center">Descuentos Usados</th>}
                      {!effectiveWorkerMode && <th className="py-3.5 px-4 text-right">Gasto Total</th>}
                      <th className="py-3.5 px-4 text-right">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {filteredUsers.map(user => {
                      const isVip = user.isKloneMember || user.membershipTier === "Klóne VIP" || user.membershipTier === "vip";
                      const userOrders = orders.filter(o => o.userId === user.id || o.customerEmail?.toLowerCase() === user.email.toLowerCase());
                      const userTotalSpent = userOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
                      const userTotalDiscounts = userOrders.reduce((sum, o) => sum + (Number(o.discount) || 0), 0);
                      const uniqueDiscounts = Array.from(new Set(userOrders.map(o => o.discountCode).filter(Boolean)));

                      return (
                        <tr
                          key={user.id}
                          className="hover:bg-amber-50/30 transition-colors cursor-pointer group"
                          onClick={() => setSelectedCustomer(user)}
                        >
                          {/* User Info */}
                          <td className="py-4 px-4 sm:px-6">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-neutral-100 border border-neutral-200 overflow-hidden flex-shrink-0 flex items-center justify-center">
                                {user.avatarUrl ? (
                                  <img
                                    src={user.avatarUrl}
                                    alt={user.displayName}
                                    loading="lazy"
                                    decoding="async"
                                    width={36}
                                    height={36}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <UserIcon className="w-4 h-4 text-neutral-400" />
                                )}
                              </div>
                              <div className="truncate max-w-[200px] sm:max-w-xs">
                                <span className="font-semibold text-neutral-950 font-sans block group-hover:text-[#b2903b] transition-colors">
                                  {user.displayName || user.email.split("@")[0]}
                                </span>
                                <span className="text-[11px] text-neutral-500 font-mono block">
                                  {user.email}
                                </span>
                                <span className="text-[10px] text-neutral-400 font-mono block">
                                  Reg: {formatDate(user.createdAt)}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Destination / City */}
                          <td className="py-4 px-4">
                            <span className="font-medium text-neutral-800 block text-xs">
                              {user.cityZip || "Reykjavík, Iceland"}
                            </span>
                            {user.phone && (
                              <span className="text-[11px] text-neutral-500 font-mono block">
                                {user.phone}
                              </span>
                            )}
                          </td>

                          {/* Orders count */}
                          <td className="py-4 px-4 text-center">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-neutral-100 text-neutral-800 border border-neutral-200">
                              <Package className="w-3 h-3 text-neutral-500" />
                              <span>{userOrders.length} {userOrders.length === 1 ? "orden" : "órdenes"}</span>
                            </span>
                          </td>

                          {/* Discounts applied (Admin only) */}
                          {!effectiveWorkerMode && (
                            <td className="py-4 px-4 text-center">
                              {uniqueDiscounts.length > 0 ? (
                                <div className="flex flex-col items-center gap-0.5">
                                  <span className="text-xs font-mono font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                                    -{formatIsk(userTotalDiscounts)}
                                  </span>
                                  <span className="text-[10px] text-neutral-400 font-mono">
                                    {uniqueDiscounts.join(", ")}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-xs text-neutral-400 font-mono">—</span>
                              )}
                            </td>
                          )}

                          {/* Total spent (Admin only) */}
                          {!effectiveWorkerMode && (
                            <td className="py-4 px-4 text-right font-serif font-bold text-neutral-950 font-mono">
                              {formatIsk(userTotalSpent)}
                            </td>
                          )}

                          {/* Action Button */}
                          <td className="py-4 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5" onClick={e => e.stopPropagation()}>
                              {!effectiveWorkerMode && (
                                <button
                                  onClick={() => {
                                    setEditingMembershipUser(user);
                                    setNewTier(user.membershipTier || "Klóne VIP");
                                  }}
                                  className="cursor-pointer text-xs px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded font-medium transition-colors"
                                  title="Cambiar nivel de membresía"
                                >
                                  Membresía
                                </button>
                              )}

                              <button
                                onClick={() => setSelectedCustomer(user)}
                                className="cursor-pointer text-xs px-2.5 py-1 bg-neutral-900 hover:bg-neutral-800 text-white rounded font-medium transition-colors flex items-center gap-1"
                              >
                                <span>Ver Pedidos</span>
                                <ArrowRight className="w-3 h-3" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: DISCOUNTS & INVOICES OVERVIEW (MASTER ADMIN ONLY) */}
        {/* ========================================================================= */}
        {!effectiveWorkerMode && activeTab === "discounts" && (
          <div className="mt-6 space-y-6">
            {/* Header info */}
            <div className="bg-white p-6 rounded-xl border border-neutral-200 shadow-xs">
              <h3 className="font-serif text-lg font-bold text-neutral-900 mb-1">
                {language === "es" ? "Resumen Financiero de Descuentos & Facturación" : "Discounts & Invoicing Summary"}
              </h3>
              <p className="text-xs text-neutral-600 mb-4">
                {language === "es"
                  ? "Historial consolidado de cupones de descuento otorgados en las compras y registro de todas las facturas emitidas."
                  : "Consolidated discount benefits awarded and full invoice registry."}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono">
                <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-200">
                  <span className="text-neutral-500 uppercase text-[10px]">Facturas Emitidas</span>
                  <p className="text-xl font-bold font-serif text-neutral-900 mt-1">{orders.length}</p>
                </div>
                <div className="p-3 bg-rose-50 rounded-lg border border-rose-200 text-rose-900">
                  <span className="text-rose-600 uppercase text-[10px]">Total Ahorro en Cupones</span>
                  <p className="text-xl font-bold font-serif mt-1">-{formatIsk(totalDiscountGranted)}</p>
                </div>
                <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200 text-emerald-900">
                  <span className="text-emerald-600 uppercase text-[10px]">Ingreso Neto Cobrado</span>
                  <p className="text-xl font-bold font-serif mt-1">{formatIsk(totalRevenue)}</p>
                </div>
              </div>
            </div>

            {/* EmailJS & Zoho Promo Flyer Configuration */}
            <div className="bg-white p-6 rounded-xl border border-neutral-200 shadow-xs">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-neutral-100">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-[#b2903b]/10 text-[#b2903b]">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-serif font-bold text-base text-neutral-900">
                      {language === "es" ? "Configuración de Flyer de Bienvenida (EmailJS & Zoho)" : "Welcome Flyer Settings (EmailJS & Zoho)"}
                    </h4>
                    <p className="text-xs text-neutral-500">
                      {language === "es"
                        ? "Envío automático de flyer con código LXSSCENTS10 (10% descuento) para la primera compra"
                        : "Automatic 10% discount promo flyer (LXSSCENTS10) for first-time customers"}
                    </p>
                  </div>
                </div>

                <a
                  href="https://dashboard.emailjs.com/admin/templates"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-[#b2903b] hover:text-[#7d5b24] font-medium transition-colors"
                >
                  <span>Dashboard EmailJS</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

              <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div>
                  <label className="block text-neutral-600 font-mono text-[11px] mb-1 font-semibold uppercase">
                    Service ID
                  </label>
                  <input
                    type="text"
                    value={emailJsServiceInput}
                    onChange={(e) => setEmailJsServiceInput(e.target.value)}
                    placeholder="service_k8k3rsu"
                    className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg font-mono text-neutral-800 text-xs focus:outline-none focus:border-[#b2903b]"
                  />
                </div>

                <div>
                  <label className="block text-neutral-600 font-mono text-[11px] mb-1 font-semibold uppercase">
                    Template ID
                  </label>
                  <input
                    type="text"
                    value={emailJsTemplateInput}
                    onChange={(e) => setEmailJsTemplateInput(e.target.value)}
                    placeholder="tbbqmfn o template_..."
                    className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg font-mono text-neutral-800 text-xs focus:outline-none focus:border-[#b2903b]"
                  />
                </div>

                <div>
                  <label className="block text-neutral-600 font-mono text-[11px] mb-1 font-semibold uppercase">
                    Public Key
                  </label>
                  <input
                    type="text"
                    value={emailJsKeyInput}
                    onChange={(e) => setEmailJsKeyInput(e.target.value)}
                    placeholder="y1-LgfmzrOxoiyKKK"
                    className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg font-mono text-neutral-800 text-xs focus:outline-none focus:border-[#b2903b]"
                  />
                </div>
              </div>

              <p className="mt-3 text-[11px] text-neutral-500 leading-relaxed">
                {language === "es"
                  ? "Nota: Si tu plantilla en EmailJS tiene otro identificador (por ejemplo, con prefijo 'template_'), cámbialo aquí. Las variables esperadas en tu plantilla son {{to_email}}, {{customer_name}}, y opcionalmente {{promo_code}}."
                  : "Note: If your template in EmailJS has a different ID (e.g. with 'template_' prefix), you can customize it here. Expected template variables are {{to_email}}, {{customer_name}}, and {{promo_code}}."}
              </p>

              {emailJsFeedback && (
                <div className={`mt-3 p-3 rounded-lg text-xs flex items-center gap-2 ${
                  emailJsFeedback.type === "success"
                    ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                    : emailJsFeedback.type === "error"
                    ? "bg-amber-50 text-amber-800 border border-amber-200"
                    : "bg-blue-50 text-blue-800 border border-blue-200"
                }`}>
                  <Sparkles className="w-4 h-4 shrink-0" />
                  <span>{emailJsFeedback.msg}</span>
                </div>
              )}

              <div className="mt-4 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    updateEmailJsConfig({
                      serviceId: emailJsServiceInput,
                      templateId: emailJsTemplateInput,
                      publicKey: emailJsKeyInput,
                    });
                    setEmailJsConfigState(getEmailJsConfig());
                    setEmailJsFeedback({
                      type: "success",
                      msg: language === "es" ? "Configuración de EmailJS guardada correctamente." : "EmailJS configuration saved successfully."
                    });
                    setTimeout(() => setEmailJsFeedback(null), 4000);
                  }}
                  className="cursor-pointer px-4 py-2 bg-[#b2903b] hover:bg-[#9a7b2e] text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-xs"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{language === "es" ? "Guardar Credenciales" : "Save Credentials"}</span>
                </button>

                <button
                  type="button"
                  disabled={isTestingEmailJs}
                  onClick={async () => {
                    setIsTestingEmailJs(true);
                    setEmailJsFeedback({
                      type: "info",
                      msg: language === "es" ? "Enviando prueba de correo..." : "Sending test email..."
                    });
                    try {
                      updateEmailJsConfig({
                        serviceId: emailJsServiceInput,
                        templateId: emailJsTemplateInput,
                        publicKey: emailJsKeyInput,
                      });
                      const adminEmail = auth.currentUser?.email || "leidenzperdomo7@gmail.com";
                      const ok = await sendFirstPurchasePromo(adminEmail, "Admin Tester", "TEST-FLYER");
                      if (ok) {
                        setEmailJsFeedback({
                          type: "success",
                          msg: language === "es" ? `¡Prueba enviada con éxito a ${adminEmail}!` : `Test email sent successfully to ${adminEmail}!`
                        });
                      } else {
                        setEmailJsFeedback({
                          type: "error",
                          msg: language === "es" ? "No se pudo conectar con el template en EmailJS. Verifica el Template ID en tu dashboard." : "Could not reach template in EmailJS. Please verify the Template ID."
                        });
                      }
                    } catch (e: any) {
                      setEmailJsFeedback({
                        type: "error",
                        msg: `Error: ${e?.message || String(e)}`
                      });
                    } finally {
                      setIsTestingEmailJs(false);
                    }
                  }}
                  className="cursor-pointer px-4 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>{isTestingEmailJs ? (language === "es" ? "Enviando..." : "Sending...") : (language === "es" ? "Enviar Prueba a mi Correo" : "Send Test to My Email")}</span>
                </button>
              </div>
            </div>

            {/* List of all Invoices / Orders with Discount breakdown */}
            <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden shadow-xs">
              <div className="p-4 bg-neutral-50 border-b border-neutral-200 font-semibold text-xs text-neutral-700 uppercase font-mono tracking-wider">
                {language === "es" ? "Listado de Facturas y Cupones Utilizados" : "Invoices and Applied Discounts"}
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs sm:text-sm">
                  <thead>
                    <tr className="bg-neutral-50/50 border-b border-neutral-200 text-neutral-600 font-semibold text-[11px] sm:text-xs uppercase tracking-wider font-mono">
                      <th className="py-3 px-4">Factura / Orden</th>
                      <th className="py-3 px-4">Fecha</th>
                      <th className="py-3 px-4">Cliente</th>
                      <th className="py-3 px-4">Cupón / Descuento</th>
                      <th className="py-3 px-4 text-right">Subtotal</th>
                      <th className="py-3 px-4 text-right">Total Cobrado</th>
                      <th className="py-3 px-4 text-right">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {orders.map(order => {
                      const discountAmount = Number(order.discount) || 0;
                      return (
                        <tr key={order.id} className="hover:bg-amber-50/30 transition-colors">
                          <td className="py-3.5 px-4 font-mono font-bold text-neutral-900">
                            {order.id}
                          </td>
                          <td className="py-3.5 px-4 font-mono text-[11px] text-neutral-500">
                            {formatDate(order.createdAt)}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="font-semibold text-neutral-900 block">{order.customerName || "Cliente"}</span>
                            <span className="text-[11px] text-neutral-500 font-mono block">{order.customerEmail}</span>
                          </td>
                          <td className="py-3.5 px-4">
                            {order.discountCode ? (
                              <span className="inline-flex items-center gap-1 font-mono text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                                <Tag className="w-3 h-3" />
                                <span>{order.discountCode} (-{formatIsk(discountAmount)})</span>
                              </span>
                            ) : (
                              <span className="text-neutral-400 font-mono text-xs">Sin cupón</span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono text-neutral-600">
                            {formatIsk(Number(order.subtotal) || Number(order.total) || 0)}
                          </td>
                          <td className="py-3.5 px-4 text-right font-serif font-bold text-neutral-950 font-mono">
                            {formatIsk(Number(order.total) || 0)}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <button
                              onClick={() => setReceiptOrder(order)}
                              className="cursor-pointer inline-flex items-center gap-1 text-xs font-semibold text-[#b2903b] hover:text-[#8a6d25] hover:underline"
                            >
                              <Receipt className="w-3.5 h-3.5" />
                              <span>Ver Factura</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: FIREBASE STORAGE & DIAGNOSTICS */}
        {/* ========================================================================= */}
        {activeTab === "storage" && (
          <div className="mt-6 space-y-6">
            <div className="bg-white rounded-xl border border-neutral-200 p-6 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-amber-50 border border-amber-200 text-[#b2903b] flex items-center justify-center">
                    <UploadCloud className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-serif font-bold text-lg text-neutral-950">
                      Firebase Cloud Storage
                    </h3>
                    <p className="text-xs text-neutral-500 font-mono mt-0.5">
                      Bucket: <span className="text-neutral-800 font-bold">singular-berm-9mn89.firebasestorage.app</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleTestStorage}
                    disabled={isTestingStorage}
                    className="cursor-pointer inline-flex items-center gap-1.5 px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg text-xs font-semibold transition-colors disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isTestingStorage ? "animate-spin text-amber-300" : ""}`} />
                    <span>{isTestingStorage ? "Probando..." : "Comprobar Conexión Storage"}</span>
                  </button>
                </div>
              </div>

              {storageStatus && (
                <div className={`mt-4 p-3.5 rounded-lg text-xs flex items-start gap-2.5 ${storageStatus.success ? "bg-emerald-50 text-emerald-900 border border-emerald-200" : "bg-amber-50 text-amber-900 border border-amber-200"}`}>
                  {storageStatus.success ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" /> : <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />}
                  <div>
                    <p className="font-semibold">{storageStatus.message}</p>
                    <p className="text-[10px] text-neutral-500 font-mono mt-0.5">{storageStatus.bucket}</p>
                  </div>
                </div>
              )}

              {/* Storage Rules View */}
              <div className="mt-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-neutral-700 font-mono">
                    Reglas de Seguridad Activas (storage.rules)
                  </span>
                  <button
                    onClick={() => {
                      const rules = `rules_version = '2';\nservice firebase.storage {\n  match /b/{bucket}/o {\n    match /users/{userId}/{allPaths=**} {\n      allow read: if request.auth != null\n        && (request.auth.uid == userId\n        || request.auth.uid == 'VempaKpo94cWuYAPH673GczZ6YX2'\n        || request.auth.uid == 'OTl3dDZpoKf8WrkDiFOnM8HFsBg1');\n      allow write: if request.auth != null\n        && request.auth.uid == userId;\n    }\n  }\n}`;
                      navigator.clipboard?.writeText(rules);
                      setCopiedStorageRules(true);
                      setTimeout(() => setCopiedStorageRules(false), 2500);
                    }}
                    className="cursor-pointer inline-flex items-center gap-1.5 text-xs text-[#b2903b] hover:text-[#8a6d25] font-semibold"
                  >
                    {copiedStorageRules ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedStorageRules ? "¡Copiado!" : "Copiar Reglas"}</span>
                  </button>
                </div>
                <pre className="p-4 bg-neutral-950 text-amber-100 rounded-lg font-mono text-xs overflow-x-auto leading-relaxed border border-neutral-800">
{`rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /users/{userId}/{allPaths=**} {
      allow read: if request.auth != null
        && (request.auth.uid == userId
        || request.auth.uid == 'VempaKpo94cWuYAPH673GczZ6YX2'
        || request.auth.uid == 'OTl3dDZpoKf8WrkDiFOnM8HFsBg1');
      allow write: if request.auth != null
        && request.auth.uid == userId;
    }
  }
}`}
                </pre>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* MODAL: CUSTOMER PROFILE & ALL THEIR ORDERS/DISPATCHES */}
      {/* ========================================================================= */}
      {selectedCustomer && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs animate-fadeIn"
          onClick={() => setSelectedCustomer(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-neutral-200"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="bg-neutral-950 text-white px-6 py-5 flex items-center justify-between border-b border-[#b2903b]/30">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-neutral-800 border border-neutral-700 overflow-hidden flex items-center justify-center flex-shrink-0">
                  {selectedCustomer.avatarUrl ? (
                    <img
                      src={selectedCustomer.avatarUrl}
                      alt={selectedCustomer.displayName}
                      loading="lazy"
                      decoding="async"
                      width={48}
                      height={48}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <UserIcon className="w-6 h-6 text-neutral-400" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-serif font-bold text-xl text-white">
                      {selectedCustomer.displayName || "Cliente"}
                    </h3>
                    {(selectedCustomer.isKloneMember || selectedCustomer.membershipTier === "Klóne VIP") && (
                      <span className="bg-amber-400/20 text-amber-300 border border-amber-400/40 text-[10px] px-2 py-0.5 rounded font-mono font-bold flex items-center gap-1">
                        <Crown className="w-3 h-3 text-amber-300" />
                        <span>VIP</span>
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-neutral-400 font-mono mt-0.5">{selectedCustomer.email}</p>
                </div>
              </div>

              <button
                onClick={() => setSelectedCustomer(null)}
                className="cursor-pointer text-neutral-400 hover:text-white p-2 rounded-full hover:bg-neutral-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Customer Details Summary Ribbon */}
            <div className="bg-neutral-50 px-6 py-3.5 border-b border-neutral-200 flex flex-wrap items-center justify-between gap-4 text-xs font-mono">
              <div>
                <span className="text-neutral-500">Membresía: </span>
                <span className="font-bold text-neutral-900">{selectedCustomer.membershipTier || "Estándar"}</span>
                <span className="text-neutral-400"> ({selectedCustomer.points || 50} pts)</span>
              </div>

              <div>
                <span className="text-neutral-500">Dirección: </span>
                <span className="font-medium text-neutral-900">
                  {selectedCustomer.address || "No especificada"}
                  {selectedCustomer.cityZip ? `, ${selectedCustomer.cityZip}` : ""}
                </span>
              </div>

              <div>
                <span className="text-neutral-500">Registrado: </span>
                <span className="text-neutral-800">{formatDate(selectedCustomer.createdAt)}</span>
              </div>
            </div>

            {/* Modal Body: All Invoices & Orders for this customer */}
            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-serif font-bold text-base text-neutral-900 flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-[#b2903b]" />
                  <span>
                    {!effectiveWorkerMode
                      ? (language === "es" ? "Todas las Órdenes y Facturas de este Cliente" : "All Customer Orders & Invoices")
                      : (language === "es" ? "Historial de Pedidos y Envíos de este Cliente" : "Customer Order History")}
                  </span>
                </h4>
                <span className="text-xs font-mono text-neutral-500">
                  {orders.filter(o => o.userId === selectedCustomer.id || o.customerEmail?.toLowerCase() === selectedCustomer.email.toLowerCase()).length} {language === "es" ? "órdenes totales" : "orders total"}
                </span>
              </div>

              {(() => {
                const customerOrders = orders.filter(
                  o => o.userId === selectedCustomer.id || o.customerEmail?.toLowerCase() === selectedCustomer.email.toLowerCase()
                );

                if (customerOrders.length === 0) {
                  return (
                    <div className="py-12 text-center text-neutral-500 border border-dashed border-neutral-300 rounded-xl p-6">
                      <Package className="w-8 h-8 text-neutral-300 mx-auto mb-2" />
                      <p className="text-sm font-medium text-neutral-700">
                        {language === "es" ? "Este cliente aún no ha realizado compras" : "No orders for this customer yet"}
                      </p>
                    </div>
                  );
                }

                return (
                  <div className="space-y-3">
                    {customerOrders.map(ord => (
                      <div
                        key={ord.id}
                        className="bg-neutral-50/80 border border-neutral-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-[#b2903b] transition-all"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-xs bg-neutral-900 text-amber-300 px-2 py-0.5 rounded">
                              {ord.id}
                            </span>
                            <span className="text-xs font-mono text-neutral-500">
                              {formatDate(ord.createdAt)}
                            </span>
                            <span className="text-xs font-semibold text-neutral-800">
                              • {ord.status}
                            </span>
                          </div>

                          <p className="text-xs text-neutral-700 mt-1">
                            {ord.itemsSummary || (ord.items ? ord.items.map(it => `${it.name} (x${it.quantity})`).join(", ") : "Perfumes")}
                          </p>

                          {!effectiveWorkerMode && ord.discountCode && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-mono text-rose-700 bg-rose-50 px-1.5 py-0.2 rounded border border-rose-200 mt-1">
                              Cupón: {ord.discountCode} (-{formatIsk(ord.discount || 0)})
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-3 justify-between sm:justify-end">
                          {!effectiveWorkerMode ? (
                            <span className="font-serif font-bold text-sm text-neutral-950 font-mono">
                              {formatIsk(Number(ord.total) || 0)}
                            </span>
                          ) : (
                            <span className="text-xs font-mono text-neutral-500 font-semibold">
                              {ord.items?.length || 1} {language === "es" ? "artículos" : "items"}
                            </span>
                          )}

                          <button
                            onClick={() => setReceiptOrder(ord)}
                            className="cursor-pointer inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 bg-[#b2903b] hover:bg-[#8a6d25] text-white rounded-md transition-colors"
                          >
                            <Receipt className="w-3.5 h-3.5" />
                            <span>
                              {!effectiveWorkerMode
                                ? (language === "es" ? "Ver Factura" : "View Invoice")
                                : (language === "es" ? "Ver Albarán" : "View Slip")}
                            </span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>

            {/* Modal Footer */}
            <div className="bg-neutral-50 px-6 py-4 border-t border-neutral-200 flex justify-between items-center">
              {!effectiveWorkerMode && (
                <button
                  onClick={() => {
                    setEditingMembershipUser(selectedCustomer);
                    setNewTier(selectedCustomer.membershipTier || "Klóne VIP");
                  }}
                  className="cursor-pointer inline-flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 rounded-lg transition-colors"
                >
                  <Crown className="w-3.5 h-3.5 text-[#b2903b]" />
                  <span>{language === "es" ? "Modificar Membresía de Cliente" : "Edit Customer Membership"}</span>
                </button>
              )}

              <button
                onClick={() => setSelectedCustomer(null)}
                className="cursor-pointer px-4 py-2 bg-neutral-200 hover:bg-neutral-300 text-neutral-800 rounded-lg text-xs font-semibold transition-colors ml-auto"
              >
                {language === "es" ? "Cerrar" : "Close"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: EDIT ORDER & LOGISTICS / TRACKING */}
      {/* ========================================================================= */}
      {editingOrder && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs animate-fadeIn"
          onClick={() => setEditingOrder(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-neutral-200"
            onClick={e => e.stopPropagation()}
          >
            <div className="bg-neutral-950 text-white px-6 py-4 flex items-center justify-between border-b border-[#b2903b]/30">
              <div className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-amber-300" />
                <h3 className="font-serif font-bold text-lg text-white">
                  {language === "es" ? "Actualizar Estado & Guía de Envío" : "Update Order & Logistics"}
                </h3>
              </div>
              <button
                onClick={() => setEditingOrder(null)}
                className="cursor-pointer text-neutral-400 hover:text-white p-1 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-200 font-mono">
                <span className="text-neutral-500">Orden: </span>
                <span className="font-bold text-neutral-900">{editingOrder.id}</span> • {editingOrder.customerName}
              </div>

              {/* Status Step selector */}
              <div>
                <label className="font-semibold text-neutral-700 block mb-1">
                  {language === "es" ? "Etapa del Proceso de Compra:" : "Fulfillment Step:"}
                </label>
                <select
                  value={newStatusStep}
                  onChange={e => setNewStatusStep(Number(e.target.value))}
                  className="w-full p-2.5 border border-neutral-300 rounded-lg text-xs bg-white font-medium focus:outline-none focus:ring-1 focus:ring-[#b2903b]"
                >
                  <option value={1}>1. En preparación (En almacén / Preparando fragancias)</option>
                  <option value={2}>2. Despachado / Enviado (En camino con transportista)</option>
                  <option value={3}>3. Entregado (Recibido con éxito por el cliente)</option>
                </select>
              </div>

              {/* Carrier selector */}
              <div>
                <label className="font-semibold text-neutral-700 block mb-1">
                  {language === "es" ? "Empresa de Transporte:" : "Shipping Carrier:"}
                </label>
                <select
                  value={newCarrier}
                  onChange={e => setNewCarrier(e.target.value)}
                  className="w-full p-2.5 border border-neutral-300 rounded-lg text-xs bg-white font-medium focus:outline-none focus:ring-1 focus:ring-[#b2903b]"
                >
                  <option value="Dropp">Dropp (Afhendingarstaður / Póstbox)</option>
                  <option value="Íslandspóstur">Íslandspóstur (Póstbox eða Heimkeyrsla)</option>
                  <option value="DHL Express">DHL Express (International Tracked)</option>
                </select>
              </div>

              {/* Tracking number input */}
              <div>
                <label className="font-semibold text-neutral-700 block mb-1">
                  {language === "es" ? "Número de Guía / Tracking Code:" : "Tracking Code:"}
                </label>
                <input
                  type="text"
                  value={newTrackingNumber}
                  onChange={e => setNewTrackingNumber(e.target.value)}
                  placeholder="Ej: IS-948201 o DROPP-84920"
                  className="w-full p-2.5 border border-neutral-300 rounded-lg text-xs font-mono focus:outline-none focus:ring-1 focus:ring-[#b2903b]"
                />
                <p className="text-[10px] text-neutral-400 mt-1 font-mono">
                  {language === "es"
                    ? "El cliente podrá hacer clic en su cuenta para ver la ruta del paquete en vivo."
                    : "The customer can track this in their portal in real time."}
                </p>
              </div>
            </div>

            <div className="bg-neutral-50 px-6 py-4 border-t border-neutral-200 flex justify-end gap-2">
              <button
                onClick={() => setEditingOrder(null)}
                className="cursor-pointer px-4 py-2 bg-neutral-200 hover:bg-neutral-300 text-neutral-800 rounded-lg text-xs font-semibold"
              >
                {language === "es" ? "Cancelar" : "Cancel"}
              </button>
              <button
                onClick={handleSaveOrderChanges}
                disabled={isUpdatingOrder}
                className="cursor-pointer px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 flex items-center gap-1.5"
              >
                {isUpdatingOrder ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-300" />
                ) : (
                  <Check className="w-3.5 h-3.5 text-amber-300" />
                )}
                <span>{language === "es" ? "Guardar y Notificar" : "Save Changes"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: EDIT CUSTOMER MEMBERSHIP TIER (MASTER ADMIN ONLY) */}
      {/* ========================================================================= */}
      {!effectiveWorkerMode && editingMembershipUser && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs animate-fadeIn"
          onClick={() => setEditingMembershipUser(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-neutral-200"
            onClick={e => e.stopPropagation()}
          >
            <div className="bg-neutral-950 text-white px-6 py-4 flex items-center justify-between border-b border-[#b2903b]/30">
              <div className="flex items-center gap-2">
                <Crown className="w-5 h-5 text-amber-400" />
                <h3 className="font-serif font-bold text-lg text-white">
                  {language === "es" ? "Asignar Membresía a Cliente" : "Assign Customer Membership"}
                </h3>
              </div>
              <button
                onClick={() => setEditingMembershipUser(null)}
                className="cursor-pointer text-neutral-400 hover:text-white p-1 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-200 font-mono">
                <span className="text-neutral-500">Cliente: </span>
                <span className="font-bold text-neutral-900">{editingMembershipUser.displayName}</span>
                <p className="text-[11px] text-neutral-500 mt-0.5">{editingMembershipUser.email}</p>
              </div>

              <div>
                <label className="font-semibold text-neutral-700 block mb-1">
                  {language === "es" ? "Seleccionar Nivel de Membresía:" : "Select Membership Tier:"}
                </label>
                <select
                  value={newTier}
                  onChange={e => setNewTier(e.target.value)}
                  className="w-full p-2.5 border border-neutral-300 rounded-lg text-xs bg-white font-medium focus:outline-none focus:ring-1 focus:ring-[#b2903b]"
                >
                  <option value="Klóne VIP">Klóne VIP (Acceso VIP, Envíos Prioritarios, 150 Pts)</option>
                  <option value="Gold VIP">Gold VIP (Acceso Exclusivo a Catas)</option>
                  <option value="LxS Privilège">LxS Privilège (Atelier Concierge)</option>
                  <option value="Estándar">Estándar (Usuario Estándar / Sin Suscripción)</option>
                </select>
              </div>

              <div className="p-3 bg-amber-50 text-amber-900 border border-amber-200 rounded-lg text-[11px] leading-relaxed">
                <strong>✨ Beneficio:</strong> La membresía VIP le otorga al usuario acceso preferencial, insignias doradas en su perfil y descuentos automáticos en sus compras en LxS SCENTS.
              </div>
            </div>

            <div className="bg-neutral-50 px-6 py-4 border-t border-neutral-200 flex justify-end gap-2">
              <button
                onClick={() => setEditingMembershipUser(null)}
                className="cursor-pointer px-4 py-2 bg-neutral-200 hover:bg-neutral-300 text-neutral-800 rounded-lg text-xs font-semibold"
              >
                {language === "es" ? "Cancelar" : "Cancel"}
              </button>
              <button
                onClick={handleSaveMembership}
                disabled={isUpdatingMembership}
                className="cursor-pointer px-4 py-2 bg-[#b2903b] hover:bg-[#8a6d25] text-white rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 flex items-center gap-1.5"
              >
                {isUpdatingMembership ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-white" />
                ) : (
                  <Check className="w-3.5 h-3.5 text-white" />
                )}
                <span>{language === "es" ? "Actualizar Membresía" : "Update Membership"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: OFFICIAL RECEIPT OR PACKING SLIP (CONTROLLED BY ROLE) */}
      {/* ========================================================================= */}
      {receiptOrder && (
        <ReceiptModal
          order={receiptOrder}
          isOpen={!!receiptOrder}
          onClose={() => setReceiptOrder(null)}
          language={language}
          hidePrices={effectiveWorkerMode}
        />
      )}
    </div>
  );
}
