import React, { useState, useEffect, useRef } from "react";
import { ArrowLeft, User, Mail, Lock, Phone, MapPin, Calendar, LogOut, CheckCircle, RefreshCw, Sparkles, Sliders, ChevronRight, X, Crown, Tag, Truck, ShieldCheck, Database, ExternalLink, Users, Server, Camera, UploadCloud, Check, Copy, PackageCheck, Clock, Package } from "lucide-react";
import { Language } from "../translations";
import { Fragrance } from "../types";
import { motion } from "motion/react";
import SubscriptionsSection from "./SubscriptionsSection";
import AdminDashboard from "./AdminDashboard";
import {
  auth,
  ADMIN_UID,
  MASTER_ADMIN_UID,
  WORKER_UID,
  checkIsAdmin,
  checkIsWorker,
  checkIsStaffOrAdmin,
  loginWithEmail,
  registerWithEmail,
  logoutUser,
  updateUserProfile,
  subscribeToUserProfile,
  subscribeToUserOrders,
  onAuthStateChanged,
  resetPasswordWithEmail,
  formatAuthError,
  fetchAllUsersForAdmin,
  uploadUserAvatar,
  testStorageConnection,
  syncUserProfile,
  OrderData
} from "../firebase";
import ReceiptModal from "./ReceiptModal";
import OrderTrackingModal from "./OrderTrackingModal";

const DEFAULT_ORDERS: any[] = [];

interface ProfilePageProps {
  key?: React.Key;
  language: Language;
  onBack: () => void;
  initialSubView?: "dashboard" | "membership";
  onAddToCart?: (fragrance: Fragrance) => void;
  onOpenCart?: () => void;
}

export default function ProfilePage({ language, onBack, initialSubView = "dashboard", onAddToCart, onOpenCart }: ProfilePageProps) {
  // Helper to get saved orders safely
  const getInitialSavedOrders = () => {
    try {
      const saved = JSON.parse(localStorage.getItem("userOrders") || "[]");
      if (Array.isArray(saved) && saved.length > 0) {
        return saved.filter((o: any) => o && o.id && o.id !== "#KS120525" && o.id !== "#KS79331");
      }
      return [];
    } catch {
      return [];
    }
  };

  const initialOrdersList = getInitialSavedOrders();
  const latestOrderData = initialOrdersList[0] || {};

  // Authentication status: ALWAYS true so customer data and order count are always visible
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(true);

  // Sub-view: 'dashboard' | 'membership'
  const [subView, setSubView] = useState<"dashboard" | "membership">(initialSubView);
  
  // Forms & layout section: 'login' | 'register' | 'forgot'
  const [authView, setAuthView] = useState<"login" | "register" | "forgot">("login");

  // Sign in Form inputs
  const [emailInput, setEmailInput] = useState<string>("");
  const [passwordInput, setPasswordInput] = useState<string>("");

  // Create account Form inputs
  const [regFirstName, setRegFirstName] = useState<string>("");
  const [regLastName, setRegLastName] = useState<string>("");
  const [regEmail, setRegEmail] = useState<string>("");
  const [regPhone, setRegPhone] = useState<string>("");
  const [regAddress, setRegAddress] = useState<string>("");
  const [regApartment, setRegApartment] = useState<string>("");
  const [regCityZip, setRegCityZip] = useState<string>("");
  const [regDob, setRegDob] = useState<string>("");
  const [regPasswordInput, setRegPasswordInput] = useState<string>("");
  const [regRepeatPassword, setRegRepeatPassword] = useState<string>("");

  // Account Dashboard detail state variables: ALWAYS visible with persistent data & fallback
  const [accountName, setAccountName] = useState<string>(
    () => localStorage.getItem("user_fullName") || latestOrderData.customerName || latestOrderData.name || "Signý Fosset"
  );
  const [accountAddress, setAccountAddress] = useState<string>(
    () => localStorage.getItem("user_address") || latestOrderData.customerAddress || latestOrderData.shippingAddress || "Hraunbær 36"
  );
  const [accountCityZip, setAccountCityZip] = useState<string>(
    () => localStorage.getItem("user_cityZip") || latestOrderData.customerCityZip || latestOrderData.cityZip || "110 Reykjavík"
  );
  const [accountPhone, setAccountPhone] = useState<string>(
    () => localStorage.getItem("user_phone") || latestOrderData.customerPhone || latestOrderData.phone || "+354 868 7689"
  );
  const [accountEmail, setAccountEmail] = useState<string>(
    () => localStorage.getItem("user_email") || latestOrderData.customerEmail || latestOrderData.email || "fossetlashes@gmail.com"
  );
  const [accountDob, setAccountDob] = useState<string>(() => localStorage.getItem("user_dob") || "");
  const [accountApartment, setAccountApartment] = useState<string>(
    () => localStorage.getItem("user_apartment") || latestOrderData.customerApartment || latestOrderData.apartment || "Íbúð 204"
  );
  const [accountCountry, setAccountCountry] = useState<string>(() => {
    const c = localStorage.getItem("user_country") || "";
    return c === "Iceland" ? "" : c;
  });
  const [spamTrapHoneypot, setSpamTrapHoneypot] = useState<string>("");
  const [lastSubmitTime, setLastSubmitTime] = useState<number>(0);
  const [orders, setOrders] = useState<any[]>(() => initialOrdersList);

  // Modals for image match features
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [trackingModalOrder, setTrackingModalOrder] = useState<OrderData | null>(null);
  const [receiptModalOrder, setReceiptModalOrder] = useState<OrderData | null>(null);
  const [showMembershipModal, setShowMembershipModal] = useState<boolean>(false);
  const [showAddressesModal, setShowAddressesModal] = useState<boolean>(false);

  // Client messaging status feedback states
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [successMsg, setSuccessMsg] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Address editing mode
  const [isEditingAddress, setIsEditingAddress] = useState<boolean>(false);
  const [editName, setEditName] = useState<string>("");
  const [editAddress, setEditAddress] = useState<string>("");
  const [editApartment, setEditApartment] = useState<string>("");
  const [editCityZip, setEditCityZip] = useState<string>("");
  const [editCountry, setEditCountry] = useState<string>("");
  const [editPhone, setEditPhone] = useState<string>("");
  const [addressToast, setAddressToast] = useState<string>("");
  const [showMembershipInfo, setShowMembershipInfo] = useState<boolean>(false);
  const [showAdminModal, setShowAdminModal] = useState<boolean>(false);
  const [adminUsers, setAdminUsers] = useState<any[]>([]);
  const [isLoadingAdminUsers, setIsLoadingAdminUsers] = useState<boolean>(false);

  // Firebase Storage avatar and status states
  const [accountAvatar, setAccountAvatar] = useState<string>(() => localStorage.getItem("user_avatarUrl") || "");
  const [isUploadingAvatar, setIsUploadingAvatar] = useState<boolean>(false);
  const [storageStatus, setStorageStatus] = useState<{ tested: boolean; success: boolean; message: string; bucket: string } | null>(null);
  const [isTestingStorage, setIsTestingStorage] = useState<boolean>(false);
  const [copiedRules, setCopiedRules] = useState<boolean>(false);

  // References to active subscriptions to cancel them cleanly on logout or unmount
  const unsubProfileRef = useRef<(() => void) | null>(null);
  const unsubOrdersRef = useRef<(() => void) | null>(null);

  // Role permissions strictly validated using cryptographic Firebase Auth user
  const isWorkerUser = Boolean(auth.currentUser && checkIsWorker(auth.currentUser));
  const isMasterAdmin = Boolean(auth.currentUser && checkIsAdmin(auth.currentUser));
  const isAdminUser = Boolean(auth.currentUser && checkIsStaffOrAdmin(auth.currentUser));

  const [adminMode, setAdminMode] = useState<"admin" | "personal">("admin");

  // Upload avatar to Firebase Storage handler
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!auth.currentUser) {
      setAddressToast(language === "is" ? "Vinsamlegast skráðu þig inn fyrst" : language === "es" ? "Inicia sesión para subir a Firebase Storage" : "Please sign in first");
      return;
    }
    setIsUploadingAvatar(true);
    try {
      const url = await uploadUserAvatar(auth.currentUser.uid, file);
      setAccountAvatar(url);
      localStorage.setItem("user_avatarUrl", url);
      setAddressToast(language === "is" ? "Prófílmynd vistuð í Firebase Storage!" : language === "es" ? "¡Foto guardada en Firebase Storage con éxito!" : "Photo saved in Firebase Storage!");
    } catch (err: any) {
      console.error("Avatar upload error:", err);
      setAddressToast(formatAuthError(err.code || err.message, language));
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  // Test Firebase Storage connection handler
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

  // Keep customer data and active state persisted to local storage at all times
  useEffect(() => {
    localStorage.setItem("user_isLoggedIn", "true");
    if (accountName) localStorage.setItem("user_fullName", accountName);
    if (accountEmail) localStorage.setItem("user_email", accountEmail);
    if (accountAddress) localStorage.setItem("user_address", accountAddress);
    if (accountApartment) localStorage.setItem("user_apartment", accountApartment);
    if (accountCityZip) localStorage.setItem("user_cityZip", accountCityZip);
    if (accountPhone) localStorage.setItem("user_phone", accountPhone);
  }, [accountName, accountEmail, accountAddress, accountApartment, accountCityZip, accountPhone]);

  // Sync state strictly with verified Firebase Auth and Firestore
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (firebaseUser) => {
      // Unsubscribe any previous listeners
      if (unsubProfileRef.current) {
        unsubProfileRef.current();
        unsubProfileRef.current = null;
      }
      if (unsubOrdersRef.current) {
        unsubOrdersRef.current();
        unsubOrdersRef.current = null;
      }

      if (firebaseUser) {
        setIsLoggedIn(true);
        localStorage.setItem("user_isLoggedIn", "true");
        if (firebaseUser.email) {
          setAccountEmail(firebaseUser.email);
          localStorage.setItem("user_email", firebaseUser.email);
        }
        if (firebaseUser.displayName) {
          setAccountName(firebaseUser.displayName);
          localStorage.setItem("user_fullName", firebaseUser.displayName);
        }
        if (firebaseUser.photoURL) {
          setAccountAvatar(firebaseUser.photoURL);
          localStorage.setItem("user_avatarUrl", firebaseUser.photoURL);
        }

        // Guarantee Firestore profile exists for authenticated user
        syncUserProfile(firebaseUser).catch(e => console.warn("Notice syncing user profile:", e));

        // Real-time Firestore sync
        unsubProfileRef.current = subscribeToUserProfile(firebaseUser.uid, (profile) => {
          if (profile) {
            if (profile.displayName) {
              setAccountName(profile.displayName);
              localStorage.setItem("user_fullName", profile.displayName);
            }
            if (profile.email) {
              setAccountEmail(profile.email);
              localStorage.setItem("user_email", profile.email);
            }
            if (profile.address) {
              setAccountAddress(profile.address);
              localStorage.setItem("user_address", profile.address);
            }
            if (profile.apartment) {
              setAccountApartment(profile.apartment);
              localStorage.setItem("user_apartment", profile.apartment);
            }
            if (profile.cityZip) {
              setAccountCityZip(profile.cityZip);
              localStorage.setItem("user_cityZip", profile.cityZip);
            }
            if (profile.phone) {
              setAccountPhone(profile.phone);
              localStorage.setItem("user_phone", profile.phone);
            }
            if (profile.dob) {
              setAccountDob(profile.dob);
              localStorage.setItem("user_dob", profile.dob);
            }
            if (profile.membershipTier) {
              localStorage.setItem("user_ilmklubbur_tier", profile.membershipTier);
            }
            if (typeof profile.isKloneMember === "boolean") {
              localStorage.setItem("user_isKloneMember", profile.isKloneMember ? "true" : "false");
            }
            if (profile.avatarUrl) {
              setAccountAvatar(profile.avatarUrl);
              localStorage.setItem("user_avatarUrl", profile.avatarUrl);
            }
          }
        });

        unsubOrdersRef.current = subscribeToUserOrders(
          firebaseUser.uid,
          (firestoreOrders) => {
            const validOrders = (firestoreOrders || []).filter(
              (o: any) => o && o.id && o.id !== "#KS120525" && o.id !== "#KS79331" && !String(o.id).includes("test")
            );
            setOrders(validOrders);
            localStorage.setItem("userOrders", JSON.stringify(validOrders));
          },
          firebaseUser.email || accountEmail
        );
      } else {
        // Unauthenticated in Firebase Auth: restore from local storage and keep customer data and orders ALWAYS visible
        try {
          const saved = JSON.parse(localStorage.getItem("userOrders") || "[]");
          const validOrders = Array.isArray(saved)
            ? saved.filter((o: any) => o && o.id && o.id !== "#KS120525" && o.id !== "#KS79331")
            : [];
          if (validOrders.length > 0) {
            setOrders(validOrders);
          }
        } catch {
          // ignore
        }
        setIsLoggedIn(true);
        localStorage.setItem("user_isLoggedIn", "true");
        
        const latestFromStorage = (() => {
          try {
            const arr = JSON.parse(localStorage.getItem("userOrders") || "[]");
            return Array.isArray(arr) && arr.length > 0 ? arr[0] : {};
          } catch {
            return {};
          }
        })();

        const nameVal = localStorage.getItem("user_fullName") || latestFromStorage.customerName || latestFromStorage.name || "Signý Fosset";
        setAccountName(nameVal);
        const emailVal = localStorage.getItem("user_email") || latestFromStorage.customerEmail || latestFromStorage.email || "fossetlashes@gmail.com";
        setAccountEmail(emailVal);
        const addrVal = localStorage.getItem("user_address") || latestFromStorage.customerAddress || latestFromStorage.shippingAddress || "Hraunbær 36";
        setAccountAddress(addrVal);
        const aptVal = localStorage.getItem("user_apartment") || latestFromStorage.customerApartment || latestFromStorage.apartment || "Íbúð 204";
        setAccountApartment(aptVal);
        const czVal = localStorage.getItem("user_cityZip") || latestFromStorage.customerCityZip || latestFromStorage.cityZip || "110 Reykjavík";
        setAccountCityZip(czVal);
        const phVal = localStorage.getItem("user_phone") || latestFromStorage.customerPhone || latestFromStorage.phone || "+354 868 7689";
        setAccountPhone(phVal);
      }
    });

    return () => {
      unsubAuth();
      if (unsubProfileRef.current) {
        unsubProfileRef.current();
        unsubProfileRef.current = null;
      }
      if (unsubOrdersRef.current) {
        unsubOrdersRef.current();
        unsubOrdersRef.current = null;
      }
    };
  }, []);

  // Translatable texts for all three interfaces
  const t = {
    en: {
      accountTitle: "Account",
      orderHistory: "Order history",
      accountDetails: "Account details",
      viewAddresses: "View addresses",
      editAddress: "Edit address",
      manageMembership: "Manage membership",
      saveAddressBtn: "Save address",
      saveBtn: "Save",
      cancelBtn: "Cancel",
      noOrders: "You haven't placed any orders yet.",
      signOut: "Log out",
      orderCol: "Order",
      dateCol: "Date",
      paymentStatusCol: "Payment status",
      fulfillmentStatusCol: "Fulfillment status",
      totalCol: "Total",

      loginTitle: "Login",
      loginSubtitle: "Sign in to your member database",
      emailLabel: "Email *",
      passwordLabel: "Password *",
      forgotPass: "Forgot your password?",
      signInBtn: "Sign in",
      noAccount: "Don't have an account?",
      createOne: "Create account",

      resetTitle: "Reset your password",
      resetSubtitle: "We will send you an email to reset your password",
      resetSubmit: "Submit",
      resetCancel: "Cancel",

      regTitle: "Create Account",
      firstName: "First Name *",
      lastName: "Last Name *",
      email: "Email *",
      phone: "Phone Number (optional)",
      address: "Shipping Address (optional)",
      apartment: "Apartment, Suite, unit, etc. (optional)",
      cityZip: "Zip Code & City *",
      dob: "Date of birth (optional) (DD/MM/YYYY)",
      password: "Password *",
      repeatPassword: "Repeat Password *",
      submitBtn: "Create account",
      alreadyHave: "Already have an account?",
      loginHere: "Login here",

      errors: {
        allFields: "Please fill out all required information first",
        passwordMatch: "Passwords do not match.",
        credentials: "The email or password details entered are incorrect.",
        emailFormat: "Please enter a valid email address.",
        resetEmailSent: "A password reset email has been dispatched to your Inbox."
      }
    },
    is: {
      accountTitle: "Mínar síður",
      orderHistory: "Pantanir",
      accountDetails: "Notandaupplýsingar",
      viewAddresses: "Skoða heimilisföng",
      editAddress: "Breyta upplýsingum",
      manageMembership: "Áskriftin mín",
      saveAddressBtn: "Vista upplýsingar",
      saveBtn: "Vista",
      cancelBtn: "Hætta við",
      noOrders: "Þú átt engar pantanir enn",
      signOut: "Skrá út",
      orderCol: "Pöntunarnúmer",
      dateCol: "Dagssetning",
      paymentStatusCol: "Greiðslustaða",
      fulfillmentStatusCol: "Afgreiðslustaða",
      totalCol: "Samtals",

      loginTitle: "Innskráning",
      loginSubtitle: "Skráðu þig inn í meðlimakerfið þitt",
      emailLabel: "Netfang *",
      passwordLabel: "Lykilorð *",
      forgotPass: "Gleymdir þú lykilorðinu?",
      signInBtn: "Skrá inn",
      noAccount: "Ertu ekki með aðgang?",
      createOne: "Stofna aðgang",

      resetTitle: "Endurstilla lykilorð",
      resetSubtitle: "Við munum senda þér tölvupóst til að endurstilla lykilorðið",
      resetSubmit: "Senda",
      resetCancel: "Hætta við",

      regTitle: "Stofna Aðgang",
      firstName: "Fornafn *",
      lastName: "Eftirnafn *",
      email: "Netfang *",
      phone: "Símanúmer (valkvætt)",
      address: "Heimilisfang (valkvætt)",
      apartment: "Íbúð, hæð, deild osfrv. (valkvætt)",
      cityZip: "Póstnúmer og staður *",
      dob: "Fæðingardagur (valkvætt) (DD/MM/YYYY)",
      password: "Lykilorð *",
      repeatPassword: "Endurtaktu lykilorð *",
      submitBtn: "Stofna aðgang",
      alreadyHave: "Ertu þegar með aðgang?",
      loginHere: "Skrá inn hér",

      errors: {
        allFields: "Vinsamlegast fylltu út allar nauðsynlegar upplýsingar fyrst",
        passwordMatch: "Lykilorðin stemma ekki.",
        credentials: "Netfang eða lykilorð er rangt.",
        emailFormat: "Vinsamlegast sláðu inn gilt netfang.",
        resetEmailSent: "Tölvupóstur til að endurstilla lykilorð hefur verið sendur."
      }
    },
    es: {
      accountTitle: "Mi cuenta",
      orderHistory: "Historial de pedidos",
      accountDetails: "Detalles de la cuenta",
      viewAddresses: "Ver direcciones",
      editAddress: "Editar dirección",
      manageMembership: "Mi membresía",
      saveAddressBtn: "Guardar dirección",
      saveBtn: "Guardar",
      cancelBtn: "Cancelar",
      noOrders: "Aún no ha realizado ningún pedido.",
      signOut: "Cerrar sesión",
      orderCol: "Número de pedido",
      dateCol: "Fecha",
      paymentStatusCol: "Estado del pago",
      fulfillmentStatusCol: "Estado de entrega",
      totalCol: "Total",

      loginTitle: "Iniciar Sesión",
      loginSubtitle: "Inicie sesión en su base de datos de miembros",
      emailLabel: "Email *",
      passwordLabel: "Contraseña *",
      forgotPass: "¿Olvidó su contraseña?",
      signInBtn: "Iniciar sesión",
      noAccount: "¿No tiene una cuenta?",
      createOne: "Crear cuenta",

      resetTitle: "Restablecer su contraseña",
      resetSubtitle: "Le enviaremos un correo electrónico para restablecer su contraseña",
      resetSubmit: "Enviar",
      resetCancel: "Cancelar",

      regTitle: "Crear Cuenta",
      firstName: "Nombre *",
      lastName: "Apellido *",
      email: "Email *",
      phone: "Teléfono (opcional)",
      address: "Dirección de envío (opcional)",
      apartment: "Apartamento, habitación, unidad, etc. (opcional)",
      cityZip: "Código postal y ciudad *",
      dob: "Fecha de nacimiento (opcional) (DD/MM/YYYY)",
      password: "Contraseña *",
      repeatPassword: "Repetir contraseña *",
      submitBtn: "Crear cuenta",
      alreadyHave: "¿Ya tiene una cuenta?",
      loginHere: "Inicie sesión aquí",

      errors: {
        allFields: "Por favor, complete toda la información requerida primero",
        passwordMatch: "Las contraseñas no coinciden.",
        credentials: "El correo electrónico o la contraseña ingresados son incorrectos.",
        emailFormat: "Por favor, introduzca una dirección de correo electrónico válida.",
        resetEmailSent: "Se ha enviado un correo electrónico de restablecimiento de contraseña a su bandeja de entrada."
      }
    }
  };

  const curr = t[language] || t.en;

  // Sign In Handler
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!emailInput.trim() || !passwordInput.trim()) {
      setErrorMsg(curr.errors.allFields);
      return;
    }

    // Anti-spam honeypot and rate-limit verification
    if (spamTrapHoneypot) {
      console.warn("Spam bot login blocked by honeypot.");
      return;
    }
    const now = Date.now();
    if (now - lastSubmitTime < 1500) {
      setErrorMsg(language === "is" ? "Vinsamlegast bíddu augnablik." : language === "es" ? "Por favor espera un momento." : "Please wait a moment.");
      return;
    }
    setLastSubmitTime(now);

    setIsSubmitting(true);

    try {
      // 1. Attempt genuine Firebase Authentication
      const user = await loginWithEmail(emailInput.trim(), passwordInput);
      if (user) {
        localStorage.setItem("user_isLoggedIn", "true");
        localStorage.setItem("user_email", user.email || emailInput.trim());
        setAccountEmail(user.email || emailInput.trim());
        if (user.displayName) {
          setAccountName(user.displayName);
          localStorage.setItem("user_fullName", user.displayName);
        }
        setIsLoggedIn(true);
        setIsSubmitting(false);
        try {
          const baseUrl = window.location.origin + window.location.pathname;
          const targetUrl = `${baseUrl}?view=account`;
          window.history.replaceState({ path: targetUrl }, "", targetUrl);
        } catch (e) {
          console.warn("Failed to update history state on signin:", e);
        }
        return;
      }
    } catch (fbErr: any) {
      console.warn("Firebase login rejected:", fbErr?.code || fbErr?.message);
      setErrorMsg(formatAuthError(fbErr?.code || fbErr?.message, language));
      setIsSubmitting(false);
      return;
    }
  };

  // Format Date of Birth as typed (DD/MM/YYYY)
  const handleDobChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    const clean = val.replace(/\D/g, "");
    let formatted = "";
    if (clean.length > 0) {
      if (clean.length <= 2) {
        formatted = clean;
      } else if (clean.length <= 4) {
        formatted = `${clean.slice(0, 2)}/${clean.slice(2)}`;
      } else {
        formatted = `${clean.slice(0, 2)}/${clean.slice(2, 4)}/${clean.slice(4, 8)}`;
      }
    }
    setRegDob(formatted);
  };

  // Register Handler
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    // Anti-spam honeypot and rapid-fire registration throttling
    if (spamTrapHoneypot) {
      console.warn("Spam bot registration blocked by honeypot.");
      return;
    }
    const now = Date.now();
    if (now - lastSubmitTime < 2500) {
      setErrorMsg(language === "is" ? "Vinsamlegast bíddu augnablik áður en þú reynir aftur." : language === "es" ? "Por favor espera unos segundos antes de reintentar." : "Please wait a few seconds before retrying.");
      return;
    }
    setLastSubmitTime(now);

    // Anti-spam disposable email provider blocking
    const disposableDomains = ["mailinator.com", "tempmail.com", "10minutemail.com", "guerrillamail.com", "dispostable.com", "yopmail.com", "trashmail.com"];
    const emailDomain = regEmail.split("@")[1]?.toLowerCase().trim();
    if (emailDomain && disposableDomains.includes(emailDomain)) {
      setErrorMsg(language === "is" ? "Ógilt netfang. Vinsamlegast notaðu raunverulegt netfang." : language === "es" ? "Por favor utiliza un proveedor de correo electrónico válido." : "Please use a valid email address.");
      return;
    }

    if (
      !regFirstName.trim() ||
      !regLastName.trim() ||
      !regEmail.trim() ||
      !regAddress.trim() ||
      !regCityZip.trim() ||
      !regDob.trim() ||
      !regPasswordInput.trim() ||
      !regRepeatPassword.trim()
    ) {
      setErrorMsg(curr.errors.allFields);
      return;
    }

    if (regPasswordInput !== regRepeatPassword) {
      setErrorMsg(curr.errors.passwordMatch);
      return;
    }

    setIsSubmitting(true);
    const emailToSave = regEmail.trim();
    const nameToSave = `${regFirstName.trim()} ${regLastName.trim()}`;
    const addressToSave = regAddress.trim();
    const cityZipToSave = regCityZip.trim();
    const phoneToSave = regPhone.trim();
    const dobToSave = regDob.trim();
    const apartmentToSave = regApartment.trim();

    // 1. Firebase Authentication & Firestore registration
    try {
      await registerWithEmail(emailToSave, regPasswordInput, {
        displayName: nameToSave,
        email: emailToSave,
        phone: phoneToSave,
        address: addressToSave,
        apartment: apartmentToSave,
        cityZip: cityZipToSave,
        dob: dobToSave,
        membershipTier: "free",
        isKloneMember: false
      });
    } catch (fbErr: any) {
      const codeOrMsg = fbErr?.code || fbErr?.message || String(fbErr);
      setErrorMsg(formatAuthError(codeOrMsg, language));
      setIsSubmitting(false);
      return;
    }

    // 2. Local profile cache for offline display
    const regObj = {
      firstName: regFirstName.trim(),
      lastName: regLastName.trim(),
      email: emailToSave,
      address: addressToSave,
      apartment: apartmentToSave,
      cityZip: cityZipToSave,
      phone: phoneToSave,
      dob: dobToSave
    };

    let existingReg: any[] = [];
    try {
      existingReg = JSON.parse(localStorage.getItem("registered_emails") || "[]");
    } catch {
      existingReg = [];
    }
    existingReg.push(regObj);
    localStorage.setItem("registered_emails", JSON.stringify(existingReg));

    localStorage.setItem("user_isLoggedIn", "true");
    localStorage.setItem("user_fullName", nameToSave);
    localStorage.setItem("user_email", emailToSave);
    if (addressToSave) localStorage.setItem("user_address", addressToSave);
    if (cityZipToSave) localStorage.setItem("user_cityZip", cityZipToSave);
    if (phoneToSave) localStorage.setItem("user_phone", phoneToSave);
    if (dobToSave) localStorage.setItem("user_dob", dobToSave);
    if (apartmentToSave) localStorage.setItem("user_apartment", apartmentToSave);

    setAccountName(nameToSave);
    setAccountEmail(emailToSave);
    setAccountAddress(addressToSave);
    setAccountCityZip(cityZipToSave);
    setAccountPhone(phoneToSave);
    setAccountDob(dobToSave);
    setAccountApartment(apartmentToSave);

    try {
      const currentOrders = JSON.parse(localStorage.getItem("userOrders") || "[]");
      const realOrders = Array.isArray(currentOrders) ? currentOrders.filter((o: any) => o.id !== "#KS120525" && o.id !== "#KS79331") : [];
      localStorage.setItem("userOrders", JSON.stringify(realOrders));
      setOrders(realOrders);
    } catch {
      localStorage.setItem("userOrders", "[]");
      setOrders([]);
    }

    try {
      const baseUrl = window.location.origin + window.location.pathname;
      const targetUrl = `${baseUrl}?view=account`;
      window.history.replaceState({ path: targetUrl }, "", targetUrl);
    } catch (e) {
      console.error("Failed to update history state:", e);
    }

    setIsLoggedIn(true);
    setIsSubmitting(false);
  };

  // Reset password Handler
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!emailInput.trim()) {
      setErrorMsg(curr.errors.allFields);
      return;
    }

    setIsSubmitting(true);
    try {
      await resetPasswordWithEmail(emailInput.trim());
      setSuccessMsg(curr.errors.resetEmailSent);
    } catch (fbErr: any) {
      console.warn("Firebase password reset error:", fbErr);
      setErrorMsg(formatAuthError(fbErr.code || fbErr.message, language));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Save Address editing details
  const handleSaveAddress = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!editAddress.trim() || !editCityZip.trim()) {
      return;
    }
    const nameToSave = editName.trim() || accountName || accountEmail.split("@")[0] || "Notandi";
    const addressToSave = editAddress.trim();
    const aptToSave = editApartment.trim();
    const cityZipToSave = editCityZip.trim();
    const phoneToSave = editPhone.trim();
    const countryToSave = editCountry.trim() === "Iceland" ? "" : editCountry.trim();

    localStorage.setItem("user_fullName", nameToSave);
    localStorage.setItem("user_address", addressToSave);
    localStorage.setItem("user_apartment", aptToSave);
    localStorage.setItem("user_cityZip", cityZipToSave);
    localStorage.setItem("user_phone", phoneToSave);
    localStorage.setItem("user_country", countryToSave);

    setAccountName(nameToSave);
    setAccountAddress(addressToSave);
    setAccountApartment(aptToSave);
    setAccountCityZip(cityZipToSave);
    setAccountPhone(phoneToSave);
    setAccountCountry(countryToSave);

    // Save to Firestore if authenticated
    if (auth.currentUser) {
      try {
        await updateUserProfile(auth.currentUser.uid, {
          displayName: nameToSave,
          address: addressToSave,
          apartment: aptToSave,
          cityZip: cityZipToSave,
          phone: phoneToSave,
          country: countryToSave
        });
      } catch (err) {
        console.error("Failed to update profile in Firebase:", err);
      }
    }

    try {
      const email = localStorage.getItem("user_email") || "";
      if (email) {
        const savedUsers = JSON.parse(localStorage.getItem("registered_emails") || "[]");
        const updatedUsers = savedUsers.map((u: any) => {
          if (u.email && u.email.toLowerCase() === email.toLowerCase()) {
            return {
              ...u,
              firstName: nameToSave.split(" ")[0] || u.firstName,
              lastName: nameToSave.split(" ").slice(1).join(" ") || u.lastName,
              address: addressToSave,
              apartment: aptToSave,
              cityZip: cityZipToSave,
              phone: phoneToSave,
              country: countryToSave
            };
          }
          return u;
        });
        localStorage.setItem("registered_emails", JSON.stringify(updatedUsers));
      }
    } catch (err) {
      console.error("Failed to update registered users:", err);
    }

    setIsEditingAddress(false);
    setAddressToast(language === "is" ? "Heimilisfang uppfært!" : language === "es" ? "¡Dirección guardada en Firebase!" : "Address updated successfully!");
    setTimeout(() => setAddressToast(""), 3500);
  };

  const handleEditAddressInit = () => {
    setEditName(accountName || "");
    setEditAddress(accountAddress || "");
    setEditApartment(accountApartment || "");
    setEditCityZip(accountCityZip || "");
    const rawCountry = localStorage.getItem("user_country") || "";
    setEditCountry(rawCountry === "Iceland" ? "" : rawCountry);
    setEditPhone(accountPhone || "");
    setShowAddressesModal(false);
    setIsEditingAddress(true);
  };

  // Sign out
  const handleSignOut = async () => {
    // 1. Unsubscribe active Firestore listeners before signing out of auth
    if (unsubProfileRef.current) {
      unsubProfileRef.current();
      unsubProfileRef.current = null;
    }
    if (unsubOrdersRef.current) {
      unsubOrdersRef.current();
      unsubOrdersRef.current = null;
    }

    try {
      await logoutUser();
    } catch (e) {
      console.warn("Notice signing out from Firebase:", e);
    }
    // Keep userOrders and personal data intact so order history and customer count remain ALWAYS visible
    localStorage.removeItem("user_uid");
    setShowAdminModal(false);
    setAdminMode("admin");

    try {
      const baseUrl = window.location.origin + window.location.pathname;
      const targetUrl = `${baseUrl}?view=account`;
      window.history.replaceState({ path: targetUrl }, "", targetUrl);
    } catch (e) {
      console.warn("Failed to update history state on signout:", e);
    }
  };

  if (subView === "membership") {
    return (
      <div className="w-full min-h-screen bg-[#fbf9f5] select-none">
        {/* Back to Account Navigation */}
        <div className="bg-[#b2903b] pt-20 sm:pt-28 px-4 sm:px-6">
          <div className="max-w-6xl mx-auto pb-0">
            <button
              onClick={() => setSubView("dashboard")}
              className="cursor-pointer inline-flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs font-sans tracking-[0.15em] sm:tracking-[0.2em] font-medium uppercase text-white/90 hover:text-white transition-colors py-2"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              {language === "is" ? "Til baka í aðgang" : language === "es" ? "Volver a la cuenta" : "Back to account"}
            </button>
          </div>
        </div>

        <SubscriptionsSection
          language={language}
          onAddToCart={(fragrance) => {
            if (onAddToCart) onAddToCart(fragrance);
          }}
          onOpenCart={() => {
            if (onOpenCart) onOpenCart();
          }}
        />
      </div>
    );
  }

  // When master admin or worker logs in, show corresponding Dashboard view
  if (isLoggedIn && isAdminUser && adminMode === "admin") {
    return (
      <AdminDashboard
        language={language}
        onBack={onBack}
        onSignOut={handleSignOut}
        onSwitchToPersonalDashboard={() => setAdminMode("personal")}
        isWorkerMode={isWorkerUser}
        allowToggleWorkerPreview={isMasterAdmin}
      />
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-6 lg:px-8 pt-24 sm:pt-36 pb-16 sm:pb-20 select-none">
      
      {/* Admin indicator banner when viewing personal view */}
      {isLoggedIn && isAdminUser && adminMode === "personal" && (
        <div className="mb-6 p-3.5 bg-neutral-900 text-white border border-amber-500/40 rounded-lg flex flex-wrap items-center justify-between gap-3 shadow-md">
          <div className="flex items-center gap-2.5">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-amber-500/20 text-amber-300 font-mono text-[11px] font-bold rounded border border-amber-500/30">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>ADMIN MODE</span>
            </span>
            <span className="text-xs text-neutral-300">
              {language === "is"
                ? "Þú ert í persónulegu yfirliti (Kerfisstjóri)"
                : language === "es"
                ? "Estás viendo el perfil personal como Administrador"
                : "Currently previewing personal profile view as Administrator"}
            </span>
          </div>
          <button
            onClick={() => setAdminMode("admin")}
            className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs rounded transition-colors"
          >
            <span>{language === "is" ? "Aftur í stjórnborð →" : language === "es" ? "Volver al panel admin →" : "Return to Admin Console →"}</span>
          </button>
        </div>
      )}

      {/* Top Navigation: Back to Store */}
      {isLoggedIn && (
        <div className="mb-4 sm:mb-8 flex items-center justify-start">
          <button
            onClick={onBack}
            className="cursor-pointer inline-flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs font-sans tracking-[0.15em] sm:tracking-[0.2em] font-medium uppercase text-[#b2903b] hover:text-[#997c32] transition-colors py-1.5 sm:py-2"
          >
            <ArrowLeft className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            {language === "is" ? "Til baka" : language === "es" ? "Atrás" : "Back"}
          </button>
        </div>
      )}

      {isLoggedIn ? (
        /* ==================== LOGGED IN ACCOUNT VIEW (Image Match) ==================== */
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="space-y-8 sm:space-y-12"
        >
          {/* Header with Title and Order Count */}
          <div>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h1 className="font-sans font-bold text-2xl sm:text-4xl text-neutral-950 tracking-tight">
                {curr.accountTitle}
              </h1>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-100 border border-neutral-200/90 text-xs sm:text-sm font-mono font-bold text-neutral-800">
                <Package className="w-4 h-4 text-[#b2903b]" />
                <span>
                  {orders.length} {language === "is" ? (orders.length === 1 ? "pöntun alls" : "pantanir alls") : language === "es" ? (orders.length === 1 ? "pedido en total" : "pedidos en total") : (orders.length === 1 ? "order total" : "orders total")}
                </span>
              </div>
            </div>
            <p className="text-xs sm:text-sm text-neutral-600 mt-1">
              {language === "is"
                ? `Velkomin(n) aftur, ${accountName || "Signý Fosset"}. Þú átt ${orders.length} ${orders.length === 1 ? "skráða pöntun" : "skráðar pantanir"}.`
                : language === "es"
                ? `Bienvenido(a), ${accountName || "Signý Fosset"}. Tienes ${orders.length} ${orders.length === 1 ? "pedido registrado" : "pedidos registrados"}.`
                : `Welcome back, ${accountName || "Signý Fosset"}. You have ${orders.length} ${orders.length === 1 ? "order recorded" : "orders recorded"}.`}
            </p>
            <button
              onClick={handleSignOut}
              className="mt-1.5 sm:mt-2 inline-flex items-center gap-1.5 text-[11px] sm:text-sm text-[#b2903b] hover:text-[#8c6d26] underline underline-offset-4 transition-colors cursor-pointer font-sans"
            >
              <User className="w-3 h-3 sm:w-3.5 sm:h-3.5 stroke-[1.75]" />
              <span>{curr.signOut}</span>
            </button>
          </div>

          {/* Two-Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 pt-1 sm:pt-2">
            {/* Left: Order history */}
            <div className="lg:col-span-8">
              <div className="flex items-center gap-3 mb-3 sm:mb-6">
                <h2 className="font-sans font-bold text-lg sm:text-2xl text-neutral-950">
                  {curr.orderHistory}
                </h2>
                <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-[#b2903b]/15 text-[#8c6d26] border border-[#b2903b]/30">
                  {orders.length} {language === "is" ? (orders.length === 1 ? "pöntun" : "pantanir") : language === "es" ? (orders.length === 1 ? "pedido" : "pedidos") : (orders.length === 1 ? "order" : "orders")}
                </span>
              </div>

              <div className="overflow-x-visible sm:overflow-x-auto border-t border-b border-neutral-200 w-full">
                <table className="w-full table-fixed sm:table-auto border-collapse font-sans text-xs sm:text-sm">
                  <colgroup>
                    <col className="w-[25%] sm:w-auto" />
                    <col className="w-[25%] sm:w-auto" />
                    <col className="w-[25%] sm:w-auto" />
                    <col className="w-[25%] sm:w-auto" />
                  </colgroup>
                  <thead>
                    <tr className="border-b border-neutral-200">
                      <th className="py-2.5 sm:py-3 px-0.5 sm:px-4 text-[8px] min-[360px]:text-[8.5px] min-[390px]:text-[9.5px] sm:text-xs font-semibold sm:font-medium text-neutral-500 tracking-tight sm:tracking-wider leading-tight sm:leading-normal text-center sm:text-left">
                        <span className="block leading-tight">{curr.orderCol}</span>
                      </th>
                      <th className="py-2.5 sm:py-3 px-0.5 sm:px-4 text-[8px] min-[360px]:text-[8.5px] min-[390px]:text-[9.5px] sm:text-xs font-semibold sm:font-medium text-neutral-500 tracking-tight sm:tracking-wider leading-tight sm:leading-normal text-center sm:text-left">
                        <span className="block leading-tight">{curr.dateCol}</span>
                      </th>
                      <th className="py-2.5 sm:py-3 px-0.5 sm:px-4 text-[8px] min-[360px]:text-[8.5px] min-[390px]:text-[9.5px] sm:text-xs font-semibold sm:font-medium text-neutral-500 tracking-tight sm:tracking-wider leading-tight sm:leading-normal text-center sm:text-left">
                        <span className="block leading-tight">{curr.paymentStatusCol}</span>
                      </th>
                      <th className="py-2.5 sm:py-3 px-0.5 sm:px-4 text-[8px] min-[360px]:text-[8.5px] min-[390px]:text-[9.5px] sm:text-xs font-semibold sm:font-medium text-neutral-500 tracking-tight sm:tracking-wider text-center sm:text-right leading-tight sm:leading-normal">
                        <span className="block leading-tight">{curr.totalCol}</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {orders.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-6 sm:py-8 text-center text-xs sm:text-sm text-neutral-500 font-sans">
                          {curr.noOrders}
                        </td>
                      </tr>
                    ) : (
                      orders.map((order: any) => {
                        // Dynamically format payment status according to active page language
                        const isPaid = !order.paymentStatus ||
                          String(order.paymentStatus).toLowerCase().includes("paid") ||
                          String(order.paymentStatus).toLowerCase().includes("greitt") ||
                          String(order.paymentStatus).toLowerCase().includes("pagad") ||
                          order.status === "paid" ||
                          order.status === "completed";

                        const paymentStatusDisplay = isPaid
                          ? (language === "is" ? "Greitt" : language === "es" ? "Pagado" : "Paid")
                          : (order.paymentStatus || (language === "is" ? "Greitt" : language === "es" ? "Pagado" : "Paid"));

                        // Dynamically format date according to active page language
                        const parseOrderDate = (dateVal: any, createdAt: any): Date | null => {
                          if (createdAt) {
                            if (typeof createdAt.toDate === "function") return createdAt.toDate();
                            const d = new Date(createdAt);
                            if (!isNaN(d.getTime())) return d;
                          }
                          if (!dateVal) return null;
                          const dDirect = new Date(dateVal);
                          if (!isNaN(dDirect.getTime()) && !/^\d+\s+[a-záðéíóúýþæö]+/i.test(String(dateVal))) {
                            return dDirect;
                          }
                          const months: Record<string, number> = {
                            jan: 0, feb: 1, mar: 2, apr: 3, may: 4, mai: 4, jun: 5, jul: 6, aug: 7, sep: 8, oct: 9, okt: 9, nov: 10, dec: 11, des: 11,
                            ene: 0, abr: 3, ago: 7, dic: 11
                          };
                          const parts = String(dateVal).toLowerCase().replace(/\bde\b/g, "").replace(/\./g, "").trim().split(/\s+/);
                          let day: number | undefined;
                          let month: number | undefined;
                          let year: number | undefined;
                          for (const p of parts) {
                            if (/^\d{4}$/.test(p)) year = parseInt(p, 10);
                            else if (/^\d{1,2}$/.test(p)) day = parseInt(p, 10);
                            else {
                              const prefix = p.substring(0, 3);
                              if (months[prefix] !== undefined) month = months[prefix];
                            }
                          }
                          if (year !== undefined && month !== undefined && day !== undefined) {
                            return new Date(year, month, day);
                          }
                          return null;
                        };

                        const parsedDate = parseOrderDate(order.date, order.createdAt);
                        const orderDateDisplay = parsedDate
                          ? parsedDate.toLocaleDateString(
                              language === "is" ? "is-IS" : language === "es" ? "es-ES" : "en-US",
                              { year: "numeric", month: "long", day: "numeric" }
                            )
                          : (order.date || "");
                        
                        return (
                          <React.Fragment key={order.id}>
                            <tr className="hover:bg-neutral-50/70 transition-colors">
                              <td className="py-3 sm:py-4 px-1 sm:px-4 text-left font-mono font-bold text-neutral-900 text-xs sm:text-sm">
                                {String(order.id || "").replace(/\D/g, "") || order.id}
                              </td>
                              <td className="py-3 sm:py-4 px-1 sm:px-4 text-neutral-800 text-[10px] sm:text-xs leading-tight">
                                {orderDateDisplay || order.date}
                              </td>
                              <td className="py-3 sm:py-4 px-1 sm:px-4 text-neutral-800 text-[10px] sm:text-xs">
                                <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded text-[10px] font-mono font-medium">
                                  {paymentStatusDisplay}
                                </span>
                              </td>
                              <td className="py-3 sm:py-4 px-1 sm:px-4 text-right text-[10px] sm:text-sm font-mono font-bold text-neutral-900">
                                {typeof order.total === "number"
                                  ? `${order.total.toLocaleString("is-IS")} kr.`
                                  : String(order.total || "").replace(/\.-/g, "")}
                              </td>
                            </tr>
                          </React.Fragment>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Right: Account details */}
            <div className="lg:col-span-4">
              <h2 className="font-sans font-bold text-lg sm:text-2xl text-neutral-950 mb-3 sm:mb-6">
                {curr.accountDetails}
              </h2>

              {/* Account identity header */}
              <div className="mb-4 pb-4 border-b border-neutral-100">
                <div className="font-semibold text-neutral-900 text-sm sm:text-base leading-tight">
                  {accountName || "Signý Fosset"}
                </div>
                <div className="text-[11px] text-neutral-500 font-mono mt-0.5">{accountEmail || "fossetlashes@gmail.com"}</div>
              </div>

              {/* Prominent Orders Tally Card */}
              <div className="mb-5 p-3.5 bg-neutral-50 rounded-xl border border-neutral-200/90 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-500 block">
                    {language === "is" ? "Fjöldi pantana" : language === "es" ? "Total de pedidos" : "Total orders"}
                  </span>
                  <span className="text-xs text-neutral-700 font-medium">
                    {language === "is"
                      ? `${orders.length} ${orders.length === 1 ? "skráð pöntun" : "skráðar pantanir"}`
                      : language === "es"
                      ? `${orders.length} ${orders.length === 1 ? "pedido registrado" : "pedidos registrados"}`
                      : `${orders.length} ${orders.length === 1 ? "recorded order" : "recorded orders"}`}
                  </span>
                </div>
                <div className="text-xl font-mono font-bold text-[#b2903b] bg-white px-3 py-1 rounded-lg border border-[#b2903b]/30 shadow-xs">
                  {orders.length}
                </div>
              </div>

              {/* Customer Contact & Delivery Info - ALWAYS VISIBLE */}
              <div className="space-y-1.5 text-xs sm:text-sm text-neutral-800 font-sans leading-relaxed bg-white p-4 rounded-xl border border-neutral-200/90">
                <div className="text-[10px] font-mono uppercase tracking-wider text-neutral-400 mb-1">
                  {language === "is" ? "Skráðar upplýsingar" : language === "es" ? "Información del cliente" : "Customer Details"}
                </div>
                <div className="font-semibold text-neutral-900 text-sm">{accountName || "Signý Fosset"}</div>
                <div className="text-neutral-700">{accountAddress || "Hraunbær 36"}</div>
                {accountApartment && <div className="text-neutral-600">{accountApartment}</div>}
                <div className="text-neutral-700">{accountCityZip || "110 Reykjavík"}</div>
                <div className="text-neutral-700 font-mono">{accountPhone || "+354 868 7689"}</div>
                <div className="text-neutral-500">{accountCountry || "Iceland"}</div>
              </div>

              <div className="mt-5 sm:mt-8 space-y-2.5 sm:space-y-3">
                <div>
                  <button
                    onClick={handleEditAddressInit}
                    className="cursor-pointer text-[11px] sm:text-sm text-[#b2903b] underline underline-offset-4 hover:text-[#8c6d26] transition-colors font-medium"
                  >
                    {language === "is" ? "Breyta upplýsingum" : curr.editAddress}
                  </button>
                </div>

                <div>
                  <button
                    onClick={() => setSubView("membership")}
                    className="cursor-pointer text-[11px] sm:text-sm font-semibold tracking-wide text-neutral-950 underline underline-offset-4 hover:text-[#b2903b] transition-colors"
                  >
                    {language === "is" ? "Áskriftin mín" : curr.manageMembership}
                  </button>
                </div>

                {isAdminUser && (
                  <div className="pt-2 border-t border-neutral-100">
                    <button
                      onClick={async () => {
                        setShowAdminModal(true);
                        setIsLoadingAdminUsers(true);
                        try {
                          const users = await fetchAllUsersForAdmin();
                          setAdminUsers(users);
                        } catch (e) {
                          console.error("Error loading users:", e);
                        } finally {
                          setIsLoadingAdminUsers(false);
                        }
                      }}
                      className="cursor-pointer inline-flex items-center gap-1.5 text-[11px] sm:text-sm font-semibold tracking-wide text-[#b2903b] bg-[#b2903b]/10 border border-[#b2903b]/30 hover:bg-[#b2903b]/20 px-3 py-1.5 rounded transition-colors"
                    >
                      <ShieldCheck className="w-4 h-4 text-[#b2903b]" />
                      <span>{language === "is" ? "Firebase Gerencia & Stjórnborð" : language === "es" ? "Gerencia & Control Firebase" : "Firebase Management Console"}</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      ) : (
        /* ==================== LOGIN / CREATE ACCOUNT / FORGOT FORMS ==================== */
        <div className={`mx-auto ${authView === "register" ? "pt-8 justify-start" : "pt-16 justify-center"} sm:pt-24 sm:mt-0 sm:justify-center min-h-[50vh] flex flex-col transition-all duration-300 w-full ${authView === "register" ? "max-w-2xl px-4" : "max-w-md px-4"}`}>
          {authView === "login" && (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
              className="p-4 sm:p-10 select-none text-center"
            >
              <div className="text-center mb-4">
                <h1 className="font-serif font-extrabold text-base sm:text-2xl tracking-[0.1em] text-[#b2903b] uppercase">
                  {curr.loginTitle}
                </h1>
              </div>

              {errorMsg && (
                <div className="p-2 sm:p-4 bg-[#fceded] border border-[#e8aeb0] text-[#a13b3b] text-[10px] sm:text-[13px] rounded-sm font-sans flex items-center mb-5 text-left max-w-sm mx-auto">
                  {errorMsg}
                </div>
              )}

              <form onSubmit={handleSignIn} noValidate className="space-y-4 max-w-sm mx-auto text-left">
                {/* Anti-spam invisible honeypot */}
                <input
                  type="text"
                  name="b_website_trap"
                  value={spamTrapHoneypot}
                  onChange={(e) => setSpamTrapHoneypot(e.target.value)}
                  style={{ display: "none", position: "absolute", left: "-9999px" }}
                  tabIndex={-1}
                  autoComplete="off"
                  aria-hidden="true"
                />

                <div>
                  <input
                    type="email"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder={language === "is" ? "Netfang" : language === "es" ? "Email" : "Email"}
                    className="w-full bg-[#fbf9f5] border border-neutral-400 focus:border-[#b2903b] focus:ring-1 focus:ring-[#b2903b] rounded-lg outline-none px-2 py-1.5 sm:px-4 sm:py-3 text-[10px] sm:text-sm font-sans text-neutral-900 transition-all placeholder:text-neutral-500"
                  />
                </div>

                <div>
                  <input
                    type="password"
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    placeholder={language === "is" ? "Lykilorð" : language === "es" ? "Contraseña" : "Password"}
                    className="w-full bg-[#fbf9f5] border border-neutral-400 focus:border-[#b2903b] focus:ring-1 focus:ring-[#b2903b] rounded-lg outline-none px-2 py-1.5 sm:px-4 sm:py-3 text-[10px] sm:text-sm font-sans text-neutral-900 transition-all placeholder:text-neutral-500"
                  />
                  
                  <div className="text-left mt-2.5">
                    <button
                      type="button"
                      onClick={() => {
                        setAuthView("forgot");
                        setErrorMsg("");
                        setSuccessMsg("");
                      }}
                      className="cursor-pointer text-[9px] sm:text-xs font-sans text-[#b2903b] underline underline-offset-4 decoration-1 hover:text-[#997c32] transition-colors"
                    >
                      {curr.forgotPass}
                    </button>
                  </div>
                </div>

                <div className="flex flex-col items-center pt-4 sm:pt-6 space-y-4">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="cursor-pointer bg-[#b2903b] hover:bg-[#997c32] disabled:bg-[#b2903b]/60 text-white font-sans text-[10px] sm:text-sm font-bold px-6 py-2 sm:px-12 sm:py-3 rounded-lg transition-all flex items-center justify-center gap-2 shadow-sm"
                  >
                    {isSubmitting ? (
                      <RefreshCw className="w-3 h-3 sm:w-4 sm:h-4 animate-spin text-white" />
                    ) : (
                      curr.signInBtn
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setAuthView("register");
                      setErrorMsg("");
                      setSuccessMsg("");
                    }}
                    className="cursor-pointer text-[10px] sm:text-xs font-sans text-[#b2903b] underline underline-offset-4 font-medium hover:text-[#997c32] transition-colors"
                  >
                    {curr.createOne}
                  </button>
                </div>
              </form>
            </motion.div>
          )}

          {authView === "register" && (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
              className="pt-0 pb-4 px-4 sm:p-10 select-none text-center"
            >
              <div className="text-center mb-4">
                <h1 className="font-serif font-extrabold text-xl sm:text-2xl tracking-[0.1em] text-[#b2903b] uppercase">
                  {curr.regTitle}
                </h1>
              </div>

              {errorMsg && (
                <div className="p-4 bg-red-500/5 border border-red-500/25 text-red-900 text-xs sm:text-sm rounded-sm font-sans flex items-center justify-between gap-3 text-left max-w-sm sm:max-w-xl mx-auto mb-5">
                  <span>{errorMsg}</span>
                  {(errorMsg.includes("þegar skráð") || errorMsg.includes("already registered") || errorMsg.includes("ya está registrado")) && (
                    <button
                      type="button"
                      onClick={() => {
                        setEmailInput(regEmail.trim());
                        setAuthView("login");
                        setErrorMsg("");
                      }}
                      className="cursor-pointer text-xs font-bold text-[#b2903b] underline whitespace-nowrap hover:text-[#8c6d26] shrink-0"
                    >
                      {language === "is" ? "Innskráning" : language === "es" ? "Iniciar sesión" : "Log In"}
                    </button>
                  )}
                </div>
              )}

               <form onSubmit={handleRegister} noValidate className="space-y-2 sm:space-y-4 max-w-sm sm:max-w-xl mx-auto text-left">
                {/* Anti-spam invisible honeypot */}
                <input
                  type="text"
                  name="b_website_trap"
                  value={spamTrapHoneypot}
                  onChange={(e) => setSpamTrapHoneypot(e.target.value)}
                  style={{ display: "none", position: "absolute", left: "-9999px" }}
                  tabIndex={-1}
                  autoComplete="off"
                  aria-hidden="true"
                />

                {/* 1 & 2. First Name and Last Name */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4">
                  <div>
                    <input
                      type="text"
                      value={regFirstName}
                      onChange={(e) => setRegFirstName(e.target.value)}
                      placeholder={language === "is" ? "Fornafn *" : language === "es" ? "Nombre *" : "First Name *"}
                      className="w-full bg-[#fbf9f5] border border-neutral-400 focus:border-[#b2903b] focus:ring-1 focus:ring-[#b2903b] rounded-lg outline-none px-2 py-1.5 sm:px-4 sm:py-3 text-[10px] sm:text-sm font-sans text-neutral-900 transition-all placeholder:text-neutral-500"
                      required
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      value={regLastName}
                      onChange={(e) => setRegLastName(e.target.value)}
                      placeholder={language === "is" ? "Eftirnafn *" : language === "es" ? "Apellido *" : "Last Name *"}
                      className="w-full bg-[#fbf9f5] border border-neutral-400 focus:border-[#b2903b] focus:ring-1 focus:ring-[#b2903b] rounded-lg outline-none px-2 py-1.5 sm:px-4 sm:py-3 text-[10px] sm:text-sm font-sans text-neutral-900 transition-all placeholder:text-neutral-500"
                      required
                    />
                  </div>
                </div>

                {/* 3 & 4. Email and Phone */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4">
                  <div>
                    <input
                      type="email"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder={language === "is" ? "Netfang *" : language === "es" ? "Dirección de correo *" : "Email *"}
                      className="w-full bg-[#fbf9f5] border border-neutral-400 focus:border-[#b2903b] focus:ring-1 focus:ring-[#b2903b] rounded-lg outline-none px-2 py-1.5 sm:px-4 sm:py-3 text-[10px] sm:text-sm font-sans text-neutral-900 transition-all placeholder:text-neutral-500"
                      required
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      placeholder={language === "is" ? "Símanúmer (valkvætt)" : language === "es" ? "Teléfono (opcional)" : "Phone Number (optional)"}
                      className="w-full bg-[#fbf9f5] border border-neutral-400 focus:border-[#b2903b] focus:ring-1 focus:ring-[#b2903b] rounded-lg outline-none px-2 py-1.5 sm:px-4 sm:py-3 text-[10px] sm:text-sm font-sans text-neutral-900 transition-all placeholder:text-neutral-500"
                    />
                  </div>
                </div>

                {/* 5 & 6. Shipping Address and Apartment, suite, etc. */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4">
                  <div>
                    <input
                      type="text"
                      value={regAddress}
                      onChange={(e) => setRegAddress(e.target.value)}
                      placeholder={language === "is" ? "Heimilisfang *" : language === "es" ? "Dirección de envío *" : "Shipping Address *"}
                      className="w-full bg-[#fbf9f5] border border-neutral-400 focus:border-[#b2903b] focus:ring-1 focus:ring-[#b2903b] rounded-lg outline-none px-2 py-1.5 sm:px-4 sm:py-3 text-[10px] sm:text-sm font-sans text-neutral-900 transition-all placeholder:text-neutral-500"
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      value={regApartment}
                      onChange={(e) => setRegApartment(e.target.value)}
                      placeholder={language === "is" ? "Íbúð, hæð, osfrv. (valkvætt)" : language === "es" ? "Piso, depto., etc. (opcional)" : "Apartment, suite, etc. (optional)"}
                      className="w-full bg-[#fbf9f5] border border-neutral-400 focus:border-[#b2903b] focus:ring-1 focus:ring-[#b2903b] rounded-lg outline-none px-2 py-1.5 sm:px-4 sm:py-3 text-[10px] sm:text-sm font-sans text-neutral-900 transition-all placeholder:text-neutral-500"
                    />
                  </div>
                </div>

                {/* 7 & 8. City & Zip Code and Date of Birth */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4">
                  <div>
                    <input
                      type="text"
                      value={regCityZip}
                      onChange={(e) => setRegCityZip(e.target.value)}
                      placeholder={language === "is" ? "Póstnúmer og staður *" : language === "es" ? "C.P. y Ciudad *" : "Zip Code & City *"}
                      className="w-full bg-[#fbf9f5] border border-neutral-400 focus:border-[#b2903b] focus:ring-1 focus:ring-[#b2903b] rounded-lg outline-none px-2 py-1.5 sm:px-4 sm:py-3 text-[10px] sm:text-sm font-sans text-neutral-900 transition-all placeholder:text-neutral-500"
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      value={regDob}
                      onChange={handleDobChange}
                      placeholder={language === "is" ? "Fæðingardagur (DD/MM/ÁÁÁÁ) *" : language === "es" ? "Fecha de nacimiento (DD/MM/AAAA) *" : "Date of Birth (DD/MM/YYYY) *"}
                      className="w-full bg-[#fbf9f5] border border-neutral-400 focus:border-[#b2903b] focus:ring-1 focus:ring-[#b2903b] rounded-lg outline-none px-2 py-1.5 sm:px-4 sm:py-3 text-[10px] sm:text-sm font-sans text-neutral-900 transition-all placeholder:text-neutral-500"
                    />
                  </div>
                </div>

                {/* 9 & 10. Password and Repeat Password */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4">
                  <div>
                    <input
                      type="password"
                      value={regPasswordInput}
                      onChange={(e) => setRegPasswordInput(e.target.value)}
                      placeholder={language === "is" ? "Lykilorð *" : language === "es" ? "Contraseña *" : "Password *"}
                      className="w-full bg-[#fbf9f5] border border-neutral-400 focus:border-[#b2903b] focus:ring-1 focus:ring-[#b2903b] rounded-lg outline-none px-2 py-1.5 sm:px-4 sm:py-3 text-[10px] sm:text-sm font-sans text-neutral-900 transition-all placeholder:text-neutral-500"
                      required
                    />
                  </div>
                  <div>
                    <input
                      type="password"
                      value={regRepeatPassword}
                      onChange={(e) => setRegRepeatPassword(e.target.value)}
                      placeholder={language === "is" ? "Endurtaktu lykilorð *" : language === "es" ? "Repetir contraseña *" : "Repeat Password *"}
                      className="w-full bg-[#fbf9f5] border border-neutral-400 focus:border-[#b2903b] focus:ring-1 focus:ring-[#b2903b] rounded-lg outline-none px-2 py-1.5 sm:px-4 sm:py-3 text-[10px] sm:text-sm font-sans text-neutral-900 transition-all placeholder:text-neutral-500"
                      required
                    />
                  </div>
                </div>

                <div className="flex flex-col items-center pt-3 sm:pt-6 space-y-2 sm:space-y-4">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="cursor-pointer bg-[#b2903b] hover:bg-[#997c32] disabled:bg-[#b2903b]/60 text-white font-sans text-[10px] sm:text-sm font-bold px-6 py-2 sm:px-12 sm:py-3 rounded-lg transition-all flex items-center justify-center gap-2 shadow-sm"
                  >
                    {isSubmitting ? (
                      <RefreshCw className="w-4 h-4 animate-spin text-white" />
                    ) : (
                      curr.submitBtn
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setAuthView("login");
                      setErrorMsg("");
                      setSuccessMsg("");
                    }}
                    className="cursor-pointer text-xs font-sans text-[#b2903b] underline underline-offset-4 font-medium hover:text-[#997c32] transition-colors"
                  >
                    {curr.loginHere}
                  </button>
                </div>
              </form>
            </motion.div>
          )}

          {authView === "forgot" && (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
              className="p-4 sm:p-10 select-none text-center"
            >
              <div className="text-center mb-4">
                <h1 className="font-serif font-extrabold text-[#b2903b] uppercase tracking-[0.1em] text-base sm:text-2xl">
                  {curr.resetTitle}
                </h1>
                <p className="text-neutral-500 font-sans mt-3 text-[7.5px] min-[375px]:text-[8.5px] sm:text-xs md:text-sm w-fit mx-auto whitespace-nowrap text-center">
                  {curr.resetSubtitle}
                </p>
              </div>

              {errorMsg && (
                <div className="p-4 bg-[#fceded] border border-[#e8aeb0] text-[#a13b3b] text-[13px] rounded-sm font-sans flex items-center mb-5 text-left max-w-sm mx-auto">
                  {errorMsg}
                </div>
              )}

              {successMsg && (
                <div className="bg-emerald-50 text-emerald-800 text-xs py-2.5 px-3.5 border border-emerald-100 rounded mb-5 font-sans flex items-center gap-2 text-left">
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{successMsg}</span>
                </div>
              )}

              <form onSubmit={handleResetPassword} noValidate className="space-y-4 max-w-sm mx-auto text-left">
                <div>
                  <input
                    type="email"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder={language === "is" ? "Netfang" : language === "es" ? "Email" : "Email"}
                    className="w-full bg-[#fbf9f5] border border-neutral-400 focus:border-[#b2903b] focus:ring-1 focus:ring-[#b2903b] rounded-lg outline-none px-2 py-1.5 sm:px-4 sm:py-3 text-[10px] sm:text-sm font-sans text-neutral-900 transition-all placeholder:text-neutral-500"
                  />
                </div>

                <div className="flex flex-col items-center pt-6 space-y-4">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="cursor-pointer bg-[#b2903b] hover:bg-[#997c32] disabled:bg-[#b2903b]/60 text-white font-sans text-[10px] sm:text-sm font-bold px-6 py-2 sm:px-12 sm:py-3 rounded-lg transition-all flex items-center justify-center gap-2 shadow-sm"
                  >
                    {isSubmitting ? (
                      <RefreshCw className="w-4 h-4 animate-spin text-white" />
                    ) : (
                      curr.resetSubmit
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setAuthView("login");
                      setErrorMsg("");
                      setSuccessMsg("");
                    }}
                    className="cursor-pointer text-xs font-sans text-[#b2903b] underline underline-offset-4 font-medium hover:text-[#997c32] transition-colors"
                  >
                    {curr.resetCancel}
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </div>
      )}

      {/* ==================== ORDER DETAILS MODAL ==================== */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-lg max-w-lg w-full p-6 sm:p-8 shadow-2xl relative">
            <button
              onClick={() => setSelectedOrder(null)}
              className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-700 p-1 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="space-y-3.5 sm:space-y-4 font-sans">
              <div className="border-b border-neutral-100 pb-2.5 sm:pb-3">
                <span className="text-[9px] sm:text-[10px] font-mono tracking-wider text-[#b2903b] uppercase">Order Details</span>
                <h3 className="text-lg sm:text-xl font-bold text-neutral-900 mt-1">{selectedOrder.id}</h3>
                <p className="text-[11px] sm:text-xs text-neutral-500">{selectedOrder.date}</p>
              </div>

              <div className="space-y-3 py-2 bg-[#fbf9f5] border border-[#b2903b]/25 rounded-lg p-3 sm:p-4">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-neutral-500 font-medium">
                    {language === "is" ? "Flutningsaðili:" : language === "es" ? "Transportista:" : "Carrier:"}
                  </span>
                  <span className="font-semibold text-neutral-900 flex items-center gap-1 font-mono">
                    <Truck className="w-3.5 h-3.5 text-[#b2903b]" />
                    {selectedOrder.carrier || "Dropp"}
                  </span>
                </div>

                {selectedOrder.trackingNumber && (
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-neutral-500 font-medium">
                      {language === "is" ? "Rakningarkóði:" : language === "es" ? "Código de Envío:" : "Tracking Code:"}
                    </span>
                    <span className="font-mono font-bold text-[#b2903b]">
                      {selectedOrder.trackingNumber}
                    </span>
                  </div>
                )}

                {/* 3-Step Live Progress Tracker */}
                <div className="pt-2 border-t border-neutral-200">
                  <div className="text-[11px] font-bold text-neutral-800 mb-2 flex justify-between">
                    <span>{language === "is" ? "Rauntímasending:" : language === "es" ? "Estado de Despacho:" : "Shipment Progress:"}</span>
                    <span className="font-mono text-[#b2903b]">{selectedOrder.status || selectedOrder.fulfillmentStatus || "En preparación"}</span>
                  </div>

                  <div className="grid grid-cols-3 gap-1 text-center pt-1">
                    <div className="flex flex-col items-center">
                      <div className="w-6 h-6 rounded-full bg-[#b2903b] text-white flex items-center justify-center text-[10px]">
                        <Clock className="w-3 h-3" />
                      </div>
                      <span className="text-[9px] sm:text-[10px] font-medium text-neutral-900 mt-1">
                        {language === "is" ? "Í vinnslu" : language === "es" ? "En preparación" : "Processing"}
                      </span>
                    </div>

                    <div className="flex flex-col items-center">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] ${selectedOrder.statusStep && selectedOrder.statusStep >= 2 ? 'bg-[#b2903b] text-white' : 'bg-neutral-200 text-neutral-500'}`}>
                        <Truck className="w-3 h-3" />
                      </div>
                      <span className={`text-[9px] sm:text-[10px] font-medium mt-1 ${selectedOrder.statusStep && selectedOrder.statusStep >= 2 ? 'text-neutral-900 font-bold' : 'text-neutral-500'}`}>
                        {language === "is" ? "Despachado" : language === "es" ? "Despachado" : "Dispatched"}
                      </span>
                    </div>

                    <div className="flex flex-col items-center">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] ${selectedOrder.statusStep && selectedOrder.statusStep >= 3 ? 'bg-emerald-600 text-white' : 'bg-neutral-200 text-neutral-500'}`}>
                        <PackageCheck className="w-3 h-3" />
                      </div>
                      <span className={`text-[9px] sm:text-[10px] font-medium mt-1 ${selectedOrder.statusStep && selectedOrder.statusStep >= 3 ? 'text-emerald-800 font-bold' : 'text-neutral-500'}`}>
                        {language === "is" ? "Afhent" : language === "es" ? "Entregado" : "Delivered"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between text-[11px] sm:text-xs pt-1 border-t border-neutral-200">
                  <span className="text-neutral-500">{curr.paymentStatusCol}:</span>
                  <span className="font-medium text-emerald-800 bg-emerald-100/70 px-2 py-0.5 rounded text-[10px]">
                    {selectedOrder.paymentStatus || "Greitt"}
                  </span>
                </div>
                <div className="flex justify-between text-[11px] sm:text-xs border-t border-neutral-200 pt-2 font-bold text-xs sm:text-sm">
                  <span>{curr.totalCol}:</span>
                  <span className="text-[#b2903b] font-mono">{selectedOrder.total}</span>
                </div>
              </div>

              {(!selectedOrder.items || selectedOrder.items.length === 0) ? (
                <div className="border-t border-neutral-100 pt-2.5 sm:pt-3">
                  <span className="text-[11px] sm:text-xs font-semibold text-neutral-700 block mb-1.5 sm:mb-2">Items:</span>
                  <div className="space-y-1.5 text-[11px] sm:text-xs text-neutral-600">
                    <div className="flex justify-between">
                      <span>{selectedOrder.itemsSummary || (language === "is" ? "Engar vörur skráðar" : "Sin detalle de artículos")}</span>
                      <span>{selectedOrder.itemsSummary ? "x1" : ""}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="border-t border-neutral-100 pt-2.5 sm:pt-3">
                  <span className="text-[11px] sm:text-xs font-semibold text-neutral-700 block mb-1.5 sm:mb-2">Items:</span>
                  <div className="space-y-1.5 text-[11px] sm:text-xs text-neutral-600">
                    {selectedOrder.items.map((item: any, idx: number) => (
                      <div key={idx} className="flex justify-between">
                        <span>{item.name || item.title || "Fragrance"}</span>
                        <span>{item.quantity ? `x${item.quantity}` : ""}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-2 sm:pt-3">
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="w-full bg-neutral-900 text-white text-[11px] sm:text-xs font-medium py-2 sm:py-2.5 rounded hover:bg-neutral-800 transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================== ADDRESSES MODAL ==================== */}
      {showAddressesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-lg max-w-lg w-full p-6 sm:p-8 shadow-2xl relative">
            <button
              onClick={() => setShowAddressesModal(false)}
              className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-700 p-1 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="space-y-4 sm:space-y-5 font-sans text-left">
              <div className="border-b border-neutral-100 pb-2.5 sm:pb-3">
                <h3 className="text-base sm:text-xl font-bold text-neutral-900">Your addresses</h3>
                <p className="text-[11px] sm:text-xs text-neutral-500">1 default address stored on file</p>
              </div>

              <div className="border border-neutral-200 rounded p-3 sm:p-4 bg-neutral-50/50 space-y-1 text-xs sm:text-sm text-neutral-800">
                <div className="flex justify-between items-start">
                  <span className="text-[9px] sm:text-[10px] font-mono tracking-wider uppercase bg-[#b2903b]/10 text-[#b2903b] px-2 py-0.5 rounded font-bold">
                    Default
                  </span>
                  <button
                    onClick={handleEditAddressInit}
                    className="text-[11px] sm:text-xs text-[#b2903b] hover:underline cursor-pointer font-medium"
                  >
                    Edit
                  </button>
                </div>
                <div className="font-semibold text-neutral-900 pt-1 text-xs sm:text-base">
                  {accountName || accountEmail.split("@")[0] || "Notandi"}
                </div>
                <div>{accountAddress || (language === "es" ? "Sin dirección registrada" : language === "is" ? "Ekkert heimilisfang skráð" : "No address registered")}</div>
                {accountApartment && <div>{accountApartment}</div>}
                {accountCityZip && <div>{accountCityZip}</div>}
                <div>Iceland</div>
              </div>

              <div className="pt-1.5 sm:pt-2">
                <button
                  onClick={() => setShowAddressesModal(false)}
                  className="w-full bg-neutral-900 text-white text-[11px] sm:text-xs font-medium py-2 sm:py-2.5 rounded hover:bg-neutral-800 transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================== EDIT ADDRESS MODAL / WINDOW ==================== */}
      {isEditingAddress && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative">
            <button
              onClick={() => setIsEditingAddress(false)}
              className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-700 p-1 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="space-y-3.5 sm:space-y-4 font-sans text-left">
              <div className="border-b border-neutral-100 pb-2.5 sm:pb-3">
                <h3 className="text-base sm:text-xl font-bold text-neutral-900">
                  {language === "is" ? "Breyta upplýsingum" : curr.editAddress}
                </h3>
              </div>

              <form onSubmit={handleSaveAddress} className="space-y-3 sm:space-y-3.5 pt-1">
                <div>
                  <label className="block text-[10px] sm:text-xs font-semibold text-neutral-700 mb-1">
                    {language === "is" ? "Fullt Nafn*" : "Full name *"}
                  </label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    required
                    placeholder=""
                    className="w-full bg-[#fbf9f5] border border-neutral-300 focus:border-[#b2903b] rounded-md px-2.5 py-1.5 sm:px-3 sm:py-2 text-[11px] sm:text-sm text-neutral-900 outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-[10px] sm:text-xs font-semibold text-neutral-700 mb-1">
                    {language === "is" ? "Gata og númer *" : "Street Address *"}
                  </label>
                  <input
                    type="text"
                    value={editAddress}
                    onChange={(e) => setEditAddress(e.target.value)}
                    required
                    placeholder=""
                    className="w-full bg-[#fbf9f5] border border-neutral-300 focus:border-[#b2903b] rounded-md px-2.5 py-1.5 sm:px-3 sm:py-2 text-[11px] sm:text-sm text-neutral-900 outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-[10px] sm:text-xs font-semibold text-neutral-700 mb-1">
                    {language === "is" ? "Íbúð, hæð osfrv (valkvætt)" : "Apartment, suite, unit (optional)"}
                  </label>
                  <input
                    type="text"
                    value={editApartment}
                    onChange={(e) => setEditApartment(e.target.value)}
                    placeholder=""
                    className="w-full bg-[#fbf9f5] border border-neutral-300 focus:border-[#b2903b] rounded-md px-2.5 py-1.5 sm:px-3 sm:py-2 text-[11px] sm:text-sm text-neutral-900 outline-none transition-colors"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
                  <div>
                    <label className="block text-[10px] sm:text-xs font-semibold text-neutral-700 mb-1">
                      {language === "is" ? "Póstnúmer og staður *" : "City & Zip code *"}
                    </label>
                    <input
                      type="text"
                      value={editCityZip}
                      onChange={(e) => setEditCityZip(e.target.value)}
                      required
                      placeholder=""
                      className="w-full bg-[#fbf9f5] border border-neutral-300 focus:border-[#b2903b] rounded-md px-2.5 py-1.5 sm:px-3 sm:py-2 text-[11px] sm:text-sm text-neutral-900 outline-none transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] sm:text-xs font-semibold text-neutral-700 mb-1">
                      {language === "is" ? "Land" : "Country"}
                    </label>
                    <input
                      type="text"
                      value={editCountry}
                      onChange={(e) => setEditCountry(e.target.value)}
                      placeholder=""
                      className="w-full bg-[#fbf9f5] border border-neutral-300 focus:border-[#b2903b] rounded-md px-2.5 py-1.5 sm:px-3 sm:py-2 text-[11px] sm:text-sm text-neutral-900 outline-none transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] sm:text-xs font-semibold text-neutral-700 mb-1">
                    {language === "is" ? "Símanúmer (valkvætt)" : "Phone number (optional)"}
                  </label>
                  <input
                    type="text"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    placeholder=""
                    className="w-full bg-[#fbf9f5] border border-neutral-300 focus:border-[#b2903b] rounded-md px-2.5 py-1.5 sm:px-3 sm:py-2 text-[11px] sm:text-sm text-neutral-900 outline-none transition-colors"
                  />
                </div>

                <div className="flex items-center gap-2.5 sm:gap-3 pt-2.5 sm:pt-3">
                  <button
                    type="submit"
                    className="cursor-pointer flex-1 bg-[#b2903b] hover:bg-[#997c32] text-white text-[11px] sm:text-sm font-semibold py-2 sm:py-2.5 rounded-md transition-colors shadow-sm text-center"
                  >
                    {language === "is" ? "Vista upplýsingar" : curr.saveAddressBtn}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditingAddress(false)}
                    className="cursor-pointer px-3 sm:px-4 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-[11px] sm:text-sm font-medium py-2 sm:py-2.5 rounded-md transition-colors"
                  >
                    {language === "is" ? "Hætta við" : curr.cancelBtn}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ==================== FIREBASE MANAGEMENT & GERENCIA MODAL ==================== */}
      {showAdminModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-5 sm:p-8 shadow-2xl relative text-left font-sans">
            <button
              onClick={() => setShowAdminModal(false)}
              className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-700 p-1 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 border-b border-neutral-100 pb-4 mb-6">
              <div className="w-10 h-10 rounded-lg bg-[#b2903b]/10 flex items-center justify-center text-[#b2903b]">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-neutral-900">
                  {language === "is" ? "Firebase Gerencia & Stjórnborð" : language === "es" ? "Panel de Gerencia & Control Firebase" : "Firebase Management Console"}
                </h3>
                <p className="text-xs text-neutral-500">
                  {language === "is" ? "Rauntímastöður og tengingar við Firebase og Netlify" : language === "es" ? "Estado en tiempo real y conectividad con Firebase y Netlify" : "Real-time state and integration with Firebase & Netlify"}
                </p>
              </div>
            </div>

            {/* Quick Status Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
              <div className="border border-neutral-200 rounded-lg p-3 bg-neutral-50/60">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-mono uppercase text-neutral-400 font-bold tracking-wider">Project ID</span>
                  <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
                </div>
                <div className="font-mono text-xs text-neutral-800 font-semibold truncate">singular-berm-9mn89</div>
                <div className="text-[10px] text-emerald-600 mt-1 font-medium flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" /> Activo
                </div>
              </div>

              <div className="border border-neutral-200 rounded-lg p-3 bg-neutral-50/60">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-mono uppercase text-neutral-400 font-bold tracking-wider">Auth Providers</span>
                  <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
                </div>
                <div className="font-mono text-xs text-neutral-800 font-semibold truncate">Email / Google</div>
                <div className="text-[10px] text-emerald-600 mt-1 font-medium flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" /> Habilitado
                </div>
              </div>

              <div className="border border-neutral-200 rounded-lg p-3 bg-neutral-50/60">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-mono uppercase text-neutral-400 font-bold tracking-wider">Firestore DB</span>
                  <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
                </div>
                <div className="font-mono text-xs text-neutral-800 font-semibold truncate">ai-studio-remix...</div>
                <div className="text-[10px] text-emerald-600 mt-1 font-medium flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" /> Zero-Trust Rules
                </div>
              </div>

              <div className="border border-neutral-200 rounded-lg p-3 bg-neutral-50/60">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-mono uppercase text-neutral-400 font-bold tracking-wider">Firebase Storage</span>
                  <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
                </div>
                <div className="font-mono text-xs text-neutral-800 font-semibold truncate">singular-berm-9mn89...</div>
                <div className="text-[10px] text-emerald-600 mt-1 font-medium flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" /> Modo Production
                </div>
              </div>
            </div>

            {/* Quick Links to Firebase Console */}
            <div className="mb-6">
              <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-500 mb-2.5">
                {language === "is" ? "Flýtitenglar í Firebase Console" : language === "es" ? "Acceso Directo a Firebase Console" : "Direct Firebase Console Links"}
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                <a
                  href="https://console.firebase.google.com/project/singular-berm-9mn89/authentication/users"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between border border-neutral-200 hover:border-[#b2903b] hover:bg-[#b2903b]/5 rounded-lg px-3 py-2 text-xs text-neutral-800 transition-all font-medium"
                >
                  <span className="flex items-center gap-1.5 truncate">
                    <User className="w-4 h-4 text-[#b2903b] shrink-0" />
                    <span className="truncate">Auth Users</span>
                  </span>
                  <ExternalLink className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                </a>

                <a
                  href="https://console.firebase.google.com/project/singular-berm-9mn89/firestore/databases/ai-studio-remixremixremixr-02e2977e-154a-4343-a788-265ccf301e94/data"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between border border-neutral-200 hover:border-[#b2903b] hover:bg-[#b2903b]/5 rounded-lg px-3 py-2 text-xs text-neutral-800 transition-all font-medium"
                >
                  <span className="flex items-center gap-1.5 truncate">
                    <Database className="w-4 h-4 text-[#b2903b] shrink-0" />
                    <span className="truncate">Firestore DB</span>
                  </span>
                  <ExternalLink className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                </a>

                <a
                  href="https://console.firebase.google.com/project/singular-berm-9mn89/storage"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between border border-neutral-200 hover:border-[#b2903b] hover:bg-[#b2903b]/5 rounded-lg px-3 py-2 text-xs text-neutral-800 transition-all font-medium"
                >
                  <span className="flex items-center gap-1.5 truncate">
                    <UploadCloud className="w-4 h-4 text-[#b2903b] shrink-0" />
                    <span className="truncate">Storage Bucket</span>
                  </span>
                  <ExternalLink className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                </a>

                <a
                  href="https://console.firebase.google.com/project/singular-berm-9mn89"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between border border-neutral-200 hover:border-[#b2903b] hover:bg-[#b2903b]/5 rounded-lg px-3 py-2 text-xs text-neutral-800 transition-all font-medium"
                >
                  <span className="flex items-center gap-1.5 truncate">
                    <Server className="w-4 h-4 text-[#b2903b] shrink-0" />
                    <span className="truncate">Overview</span>
                  </span>
                  <ExternalLink className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                </a>
              </div>
              <div className="mt-2.5 p-2.5 bg-amber-50 border border-amber-200/80 rounded text-[11px] text-amber-900 leading-relaxed">
                <strong>💡 Guía para ver los datos en Firebase Console:</strong> Los perfiles y pedidos se guardan en la base de datos nombrada <code className="bg-amber-100 font-mono text-[10px] px-1 py-0.5 rounded text-amber-950 font-bold">ai-studio-remixremixremixr-02e2977e-154a-4343-a788-265ccf301e94</code>. En la consola de Firebase, abre el menú desplegable superior donde dice base de datos y selecciona esa base para ver las colecciones <code className="font-mono text-[10px] bg-amber-100 px-1 py-0.5 rounded text-amber-950">/users</code> y <code className="font-mono text-[10px] bg-amber-100 px-1 py-0.5 rounded text-amber-950">/orders</code> (la base predeterminada "(default)" está vacía).
              </div>
            </div>

            {/* Storage Diagnostic & Rules Section */}
            <div className="mb-6 border border-neutral-200 rounded-lg p-4 bg-neutral-50/50">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-800 flex items-center gap-1.5">
                    <UploadCloud className="w-4 h-4 text-[#b2903b]" />
                    <span>Diagnóstico de Firebase Storage</span>
                  </h4>
                  <p className="text-[11px] text-neutral-500 mt-0.5">
                    Bucket: <code className="font-mono text-neutral-700 bg-neutral-200/60 px-1 py-0.5 rounded">singular-berm-9mn89.firebasestorage.app</code>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleTestStorage}
                  disabled={isTestingStorage}
                  className="cursor-pointer inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded bg-neutral-900 hover:bg-neutral-800 text-white transition-colors self-start sm:self-auto"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isTestingStorage ? "animate-spin" : ""}`} />
                  <span>{isTestingStorage ? "Probando..." : "Comprobar Conexión Storage"}</span>
                </button>
              </div>

              {storageStatus && (
                <div className={`p-3 rounded text-xs mb-3 flex items-start gap-2.5 ${storageStatus.success ? "bg-emerald-50 text-emerald-800 border border-emerald-200" : "bg-amber-50 text-amber-800 border border-amber-200"}`}>
                  {storageStatus.success ? <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" /> : <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />}
                  <div>
                    <span className="font-semibold block">{storageStatus.message}</span>
                    <span className="text-[10px] text-neutral-500 font-mono mt-0.5 block">{storageStatus.bucket}</span>
                  </div>
                </div>
              )}

              {/* Active Storage Rules */}
              <div className="mt-2 text-xs">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-semibold text-neutral-700 block">
                    Reglas de Seguridad para Storage (Firebase Console &gt; Storage &gt; Rules):
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const rulesText = `rules_version = '2';\nservice firebase.storage {\n  match /b/{bucket}/o {\n    match /users/{userId}/{allPaths=**} {\n      allow read: if request.auth != null\n        && (request.auth.uid == userId\n        || request.auth.uid == 'VempaKpo94cWuYAPH673GczZ6YX2');\n      allow write: if request.auth != null\n        && request.auth.uid == userId;\n    }\n  }\n}`;
                      navigator.clipboard?.writeText(rulesText);
                      setCopiedRules(true);
                      setTimeout(() => setCopiedRules(false), 2500);
                    }}
                    className="cursor-pointer inline-flex items-center gap-1 text-[11px] text-[#b2903b] hover:text-[#8c6d26] font-semibold transition-colors"
                  >
                    {copiedRules ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedRules ? "¡Copiado!" : "Copiar Reglas"}</span>
                  </button>
                </div>
                <pre className="bg-neutral-900 text-neutral-200 p-3 rounded text-[10px] font-mono overflow-x-auto leading-relaxed">
{`rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /users/{userId}/{allPaths=**} {
      allow read: if request.auth != null
        && (request.auth.uid == userId
        || request.auth.uid == 'VempaKpo94cWuYAPH673GczZ6YX2');
      allow write: if request.auth != null
        && request.auth.uid == userId;
    }
  }
}`}
                </pre>
              </div>
            </div>

            {/* Registered Users from Firestore */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                  {language === "is" ? "Notendur í Firestore gagnagrunni" : language === "es" ? "Usuarios Registrados en Firestore (/users)" : "Users in Firestore DB (/users)"}
                </h4>
                <button
                  type="button"
                  onClick={async () => {
                    setIsLoadingAdminUsers(true);
                    try {
                      const users = await fetchAllUsersForAdmin();
                      setAdminUsers(users);
                    } catch (e) {
                      console.error("Error fetching users:", e);
                    } finally {
                      setIsLoadingAdminUsers(false);
                    }
                  }}
                  className="inline-flex items-center gap-1.5 text-xs text-[#b2903b] hover:underline cursor-pointer font-medium"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingAdminUsers ? "animate-spin" : ""}`} />
                  <span>{language === "is" ? "Endurhlaða" : language === "es" ? "Actualizar" : "Refresh"}</span>
                </button>
              </div>

              <div className="border border-neutral-200 rounded-lg overflow-hidden">
                {isLoadingAdminUsers ? (
                  <div className="p-8 text-center text-xs text-neutral-500">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-[#b2903b]" />
                    <span>{language === "is" ? "Sæki gögn úr Firestore..." : language === "es" ? "Cargando usuarios desde Firestore..." : "Loading users from Firestore..."}</span>
                  </div>
                ) : adminUsers.length === 0 ? (
                  <div className="p-6 text-center text-xs text-neutral-500">
                    {language === "is" ? "Engir skráðir notendur í /users safni ennþá." : language === "es" ? "Aún no hay documentos en la colección /users o se sincronizan en el primer inicio de sesión." : "No users in /users collection yet."}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-500 text-[10px] uppercase font-mono">
                        <tr>
                          <th className="py-2.5 px-3">Nombre</th>
                          <th className="py-2.5 px-3">Email</th>
                          <th className="py-2.5 px-3">Membresía</th>
                          <th className="py-2.5 px-3">Ciudad</th>
                          <th className="py-2.5 px-3">Fecha</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-100">
                        {adminUsers.map((u: any) => (
                          <tr key={u.id} className="hover:bg-neutral-50/50">
                            <td className="py-2 px-3 font-medium text-neutral-900">{u.displayName || "Notandi"}</td>
                            <td className="py-2 px-3 text-neutral-600 font-mono text-[11px]">{u.email || "-"}</td>
                            <td className="py-2 px-3">
                              <span className="uppercase text-[9px] font-mono px-2 py-0.5 rounded font-bold bg-[#b2903b]/10 text-[#b2903b]">
                                {u.membershipTier || "Free"}
                              </span>
                            </td>
                            <td className="py-2 px-3 text-neutral-600">{u.cityZip || u.address || "-"}</td>
                            <td className="py-2 px-3 text-neutral-400 text-[10px]">
                              {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "-"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* Netlify Deploy Guide */}
            <div className="mt-6 pt-4 border-t border-neutral-100 bg-[#fbf9f5] -mx-5 -mb-5 sm:-mx-8 sm:-mb-8 p-5 sm:p-6 rounded-b-xl">
              <h4 className="text-xs font-bold text-neutral-900 mb-1 flex items-center gap-1.5">
                <span>🌐 Despliegue en Netlify</span>
              </h4>
              <p className="text-xs text-neutral-600 leading-relaxed">
                El proyecto ya incluye <code className="bg-neutral-200/80 px-1 py-0.5 rounded text-[11px] font-mono text-neutral-900">netlify.toml</code> y <code className="bg-neutral-200/80 px-1 py-0.5 rounded text-[11px] font-mono text-neutral-900">public/_redirects</code> con redirecciones completas para SPA. Al importar el repositorio en Netlify, el comando de build es <code className="font-mono text-neutral-800">npm run build</code> y el directorio de publicación es <code className="font-mono text-neutral-800">dist</code>.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ==================== ADDRESS TOAST NOTIFICATION ==================== */}
      {addressToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-neutral-950 text-white border border-neutral-800 px-5 py-3 rounded-lg shadow-xl text-xs sm:text-sm flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          <span>{addressToast}</span>
        </div>
      )}

      {/* ==================== OFFICIAL PURCHASE RECEIPT MODAL ==================== */}
      {receiptModalOrder && (
        <ReceiptModal
          order={receiptModalOrder}
          isOpen={!!receiptModalOrder}
          onClose={() => setReceiptModalOrder(null)}
          language={language}
          onTrackOrder={() => {
            setReceiptModalOrder(null);
          }}
        />
      )}
    </div>
  );
}
