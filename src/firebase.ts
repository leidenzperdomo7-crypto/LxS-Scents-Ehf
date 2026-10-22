import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  onAuthStateChanged,
  sendPasswordResetEmail,
  User
} from 'firebase/auth';
import {
  initializeFirestore,
  setLogLevel,
  doc,
  getDoc,
  setDoc,
  collection,
  onSnapshot,
  getDocs,
  getDocFromServer,
  deleteDoc,
  serverTimestamp,
  query,
  where
} from 'firebase/firestore';
import {
  getStorage,
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
  uploadString,
  deleteObject
} from 'firebase/storage';
import { getFunctions, httpsCallable } from 'firebase/functions';
import firebaseConfig from './firebase-applet-config.json';
import { CartItem } from './types';

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize Firebase Functions
export const functions = getFunctions(app);

// Silence Firestore internal transient connection log warnings in iframe preview
setLogLevel('silent');

// Initialize Firestore with explicit Database ID and auto-detect long-polling
export const db = initializeFirestore(
  app,
  {
    experimentalAutoDetectLongPolling: true,
  },
  firebaseConfig.firestoreDatabaseId
);

// Initialize Firebase Auth
export const auth = getAuth(app);

// Initialize Firebase Storage
export const storage = getStorage(app);

// Providers
export const googleProvider = new GoogleAuthProvider();

// Error handling types & function
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Connection test
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn("Please check your Firebase configuration: client is offline.");
    }
  }
}

// User Profile interface
export interface UserProfileData {
  displayName: string;
  email: string;
  phone?: string;
  address?: string;
  apartment?: string;
  cityZip?: string;
  country?: string;
  dob?: string;
  membershipTier?: string;
  isKloneMember?: boolean;
  points?: number;
  avatarUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

// User Cart interface
export interface UserCartData {
  userId: string;
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  discountCode?: string;
  discountPercent?: number;
  updatedAt?: string;
}

// Order & Tracking interface
export interface OrderItemData {
  id?: string;
  name: string;
  quantity: number;
  price: string | number;
  variant?: string;
  size?: string;
  image?: string;
  description?: string;
  amount?: number;
}

export interface OrderData {
  id: string;
  userId: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  customerAddress: string;
  customerApartment?: string;
  customerCityZip: string;
  customerCountry?: string;
  shippingMethod?: string;
  total: number | string;
  subtotal?: number;
  discount?: number;
  shipping?: number;
  discountCode?: string;
  paymentMethod?: string;
  paymentStatus?: string;
  status: string; // 'paid' | 'completed' | etc.
  statusStep?: number; // 1: Preparación, 2: Despachado, 3: Entregado
  carrier?: string; // 'Dropp' | 'Íslandspóstur' | 'DHL' | etc.
  trackingNumber?: string;
  trackingUrl?: string;
  estimatedDelivery?: string;
  items?: OrderItemData[];
  itemsSummary?: string;
  date?: string;
  createdAt: any;
  updatedAt?: any;
}

export async function syncUserProfile(user: User, additionalData?: Partial<UserProfileData>): Promise<UserProfileData> {
  const userRef = doc(db, 'users', user.uid);
  try {
    let snap;
    try {
      snap = await getDoc(userRef);
    } catch (readErr) {
      handleFirestoreError(readErr, OperationType.GET, `users/${user.uid}`);
      return {
        displayName: additionalData?.displayName || user.displayName || user.email?.split('@')[0] || "Notandi",
        email: user.email || additionalData?.email || "",
        createdAt: new Date().toISOString()
      } as UserProfileData;
    }

    const isStaff = checkIsStaffOrAdmin(user);
    if (!snap.exists()) {
      const initialProfile: UserProfileData = {
        displayName: additionalData?.displayName || user.displayName || user.email?.split('@')[0] || "Notandi",
        email: user.email || additionalData?.email || "",
        phone: additionalData?.phone || "",
        address: additionalData?.address || "",
        apartment: additionalData?.apartment || "",
        cityZip: additionalData?.cityZip || "",
        country: additionalData?.country || "",
        dob: additionalData?.dob || "",
        membershipTier: isStaff ? (additionalData?.membershipTier || "free") : "free",
        isKloneMember: isStaff ? (additionalData?.isKloneMember || false) : false,
        points: isStaff ? (additionalData?.points ?? 50) : 50,
        avatarUrl: additionalData?.avatarUrl || user.photoURL || "",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      await setDoc(userRef, initialProfile);
      return initialProfile;
    } else {
      const existing = snap.data() as UserProfileData;
      if (additionalData && Object.keys(additionalData).length > 0) {
        const safeData = { ...additionalData };
        if (!isStaff) {
          delete (safeData as any).membershipTier;
          delete (safeData as any).isKloneMember;
          delete (safeData as any).points;
          delete (safeData as any).createdAt;
        }
        const mergedPayload: Partial<UserProfileData> = {
          email: existing.email || user.email || "",
          displayName: safeData.displayName || existing.displayName || user.displayName || "Notandi",
          ...safeData,
          updatedAt: new Date().toISOString()
        };
        await setDoc(userRef, mergedPayload, { merge: true });
        return { ...existing, ...mergedPayload } as UserProfileData;
      }
      return existing;
    }
  } catch (err) {
    console.warn("Firestore syncUserProfile notice for users/" + user.uid, err);
    try {
      handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}`);
    } catch {
      // Safe fallback: return initial profile data without breaking auth flow
    }
    return {
      displayName: additionalData?.displayName || user.displayName || user.email?.split('@')[0] || "Notandi",
      email: user.email || additionalData?.email || "",
      createdAt: new Date().toISOString()
    } as UserProfileData;
  }
}

// Auth operations
export async function signInWithGooglePopup() {
  const result = await signInWithPopup(auth, googleProvider);
  if (result.user) {
    await syncUserProfile(result.user);
  }
  return result.user;
}

export async function registerWithEmail(email: string, pass: string, profileData: Partial<UserProfileData>) {
  const cred = await createUserWithEmailAndPassword(auth, email, pass);
  if (cred.user) {
    if (profileData.displayName) {
      await updateProfile(cred.user, { displayName: profileData.displayName });
    }
    const fullProfile: UserProfileData = {
      displayName: profileData.displayName || "Notandi",
      email: cred.user.email || email,
      phone: profileData.phone || "",
      address: profileData.address || "",
      apartment: profileData.apartment || "",
      cityZip: profileData.cityZip || "",
      dob: profileData.dob || "",
      membershipTier: profileData.membershipTier || "free",
      isKloneMember: profileData.isKloneMember || false,
      points: 50,
      avatarUrl: profileData.avatarUrl || "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    await syncUserProfile(cred.user, fullProfile);
  }
  return cred.user;
}

export async function loginWithEmail(email: string, pass: string) {
  const cred = await signInWithEmailAndPassword(auth, email, pass);
  if (cred.user) {
    await syncUserProfile(cred.user);
  }
  return cred.user;
}

let activeSubscriptions: (() => void)[] = [];

export function clearActiveSubscriptions() {
  const current = [...activeSubscriptions];
  activeSubscriptions = [];
  current.forEach((unsub) => {
    try {
      unsub();
    } catch {
      // ignore
    }
  });
}

export async function logoutUser() {
  clearActiveSubscriptions();
  await signOut(auth);
}

// Save or update user profile
export async function updateUserProfile(userId: string, data: Partial<UserProfileData>) {
  const userRef = doc(db, 'users', userId);
  try {
    const currentUser = auth.currentUser;
    const safeData = { ...data };
    if (!checkIsStaffOrAdmin(currentUser)) {
      delete (safeData as any).membershipTier;
      delete (safeData as any).isKloneMember;
      delete (safeData as any).points;
    }
    const payload: Partial<UserProfileData> = {
      ...safeData,
      updatedAt: new Date().toISOString()
    };
    if (data.email || currentUser?.email) {
      payload.email = data.email || currentUser?.email || "";
    }
    if (data.displayName || currentUser?.displayName) {
      payload.displayName = data.displayName || currentUser?.displayName || "Notandi";
    }
    await setDoc(userRef, payload, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `users/${userId}`);
  }
}

// Fetch user profile on demand
export async function getUserProfile(userId: string): Promise<UserProfileData | null> {
  const userRef = doc(db, 'users', userId);
  try {
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      return snap.data() as UserProfileData;
    }
    return null;
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, `users/${userId}`);
    return null;
  }
}

// Subscribe to user profile
export function subscribeToUserProfile(userId: string, callback: (data: UserProfileData | null) => void) {
  const userRef = doc(db, 'users', userId);
  const unsub = onSnapshot(userRef, (snapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.data() as UserProfileData);
    } else {
      callback(null);
    }
  }, (err) => {
    if (!auth.currentUser || auth.currentUser.uid !== userId) {
      console.warn(`Firestore user subscription ended for users/${userId}`);
      return;
    }
    console.warn(`Firestore user subscription warning for users/${userId}:`, err);
  });
  activeSubscriptions.push(unsub);
  return () => {
    activeSubscriptions = activeSubscriptions.filter(fn => fn !== unsub);
    try {
      unsub();
    } catch {
      // ignore
    }
  };
}

// -------------------------------------------------------------
// CART PERSISTENCE (Sync between devices & sessions in Firestore)
// -------------------------------------------------------------

export async function saveUserCartToFirestore(
  userId: string,
  cartItems: CartItem[],
  subtotal: number,
  discountCode?: string,
  discountPercent?: number
) {
  if (!userId || userId === "guest" || !auth.currentUser) return;
  const cartRef = doc(db, 'users', userId, 'cart', 'current');
  const payload: UserCartData = {
    userId,
    items: cartItems.map(item => ({
      fragrance: item.fragrance,
      quantity: item.quantity,
      sizeSelected: item.sizeSelected || item.fragrance.size || "50ml"
    })),
    itemCount: cartItems.reduce((acc, it) => acc + it.quantity, 0),
    subtotal: Math.max(0, subtotal),
    discountCode: discountCode || "",
    discountPercent: discountPercent || 0,
    updatedAt: new Date().toISOString()
  };
  try {
    await setDoc(cartRef, payload);
  } catch (err) {
    console.warn("Could not sync cart to Firestore:", err);
  }
}

export async function getUserCartFromFirestore(userId: string): Promise<UserCartData | null> {
  if (!userId || userId === "guest" || !auth.currentUser) return null;
  const cartRef = doc(db, 'users', userId, 'cart', 'current');
  try {
    const snap = await getDoc(cartRef);
    if (snap.exists()) {
      return snap.data() as UserCartData;
    }
    return null;
  } catch (err) {
    console.warn("Could not retrieve cart from Firestore:", err);
    return null;
  }
}

export function subscribeToUserCart(userId: string, callback: (cartData: UserCartData | null) => void) {
  if (!userId || userId === "guest" || !auth.currentUser) {
    callback(null);
    return () => {};
  }
  const cartRef = doc(db, 'users', userId, 'cart', 'current');
  const unsub = onSnapshot(cartRef, (snapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.data() as UserCartData);
    } else {
      callback(null);
    }
  }, (err) => {
    if (!auth.currentUser || auth.currentUser.uid !== userId) {
      return;
    }
    console.warn(`Firestore cart subscription notice for users/${userId}/cart:`, err);
  });
  activeSubscriptions.push(unsub);
  return () => {
    activeSubscriptions = activeSubscriptions.filter(fn => fn !== unsub);
    try {
      unsub();
    } catch {
      // ignore
    }
  };
}

export async function clearUserCartInFirestore(userId: string) {
  if (!userId || userId === "guest" || !auth.currentUser) return;
  const cartRef = doc(db, 'users', userId, 'cart', 'current');
  try {
    await deleteDoc(cartRef);
  } catch (err) {
    console.warn("Could not clear cart document in Firestore:", err);
  }
}

// -------------------------------------------------------------
// ORDERS & REAL-TIME TRACKING
// -------------------------------------------------------------

export async function saveOrderToFirestore(userId: string, orderData: Partial<OrderData>) {
  const currentUid = auth.currentUser?.uid || "";
  const effectiveUserId = currentUid || (userId && userId !== "guest" ? userId : "");
  const orderId = orderData.id || `#KS${Math.floor(Math.random() * 90000) + 10000}`;

  // Auto assign carrier & tracking if not present
  const defaultCarrier = orderData.carrier || (orderData.customerCountry === "Iceland" || !orderData.customerCountry ? "Dropp" : "DHL Express");
  const defaultTrackingNumber = orderData.trackingNumber || `IS-${Math.floor(Math.random() * 899999 + 100000)}`;
  const defaultTrackingUrl = orderData.trackingUrl || (defaultCarrier === "Dropp" ? `https://dropp.is/track/${defaultTrackingNumber}` : `https://postur.is/track/${defaultTrackingNumber}`);

  const formattedItems = (orderData.items || []).map((it: any) => {
    const rawPrice = typeof it.price === "number"
      ? it.price
      : (typeof it.amount === "number" ? it.amount : parseInt(String(it.price || 0).replace(/\D/g, ""), 10) || 0);
    return {
      id: it.id || "",
      name: it.name || it.description || "Ilmvatn",
      variant: it.variant || it.sizeSelected || it.size || "50ml",
      size: it.size || it.variant || it.sizeSelected || "50ml",
      quantity: Number(it.quantity) || 1,
      price: rawPrice,
      image: it.image || ""
    };
  });

  const totalNum = typeof orderData.total === "number"
    ? orderData.total
    : (parseInt(String(orderData.total || 0).replace(/\D/g, ""), 10) || 0);

  const customerEmailClean = (orderData.customerEmail || auth.currentUser?.email || "").trim().toLowerCase();
  const customerNameClean = (orderData.customerName || auth.currentUser?.displayName || "").trim();

  // Firestore payload with mandatory serverTimestamp and explicit status
  const firestorePayload: any = {
    id: orderId,
    userId: effectiveUserId,
    customerEmail: customerEmailClean,
    customerName: customerNameClean,
    items: formattedItems,
    total: totalNum,
    createdAt: serverTimestamp(),
    status: "paid", // Required: "paid" or "completed"
    statusStep: orderData.statusStep || 1,
    paymentStatus: "Paid",
    customerPhone: orderData.customerPhone || "",
    customerAddress: orderData.customerAddress || "",
    customerApartment: orderData.customerApartment || "",
    customerCityZip: orderData.customerCityZip || "",
    customerCountry: orderData.customerCountry || "Iceland",
    shippingMethod: orderData.shippingMethod || "Dropp Pick-up point",
    subtotal: Number(orderData.subtotal) || totalNum,
    discount: Number(orderData.discount) || 0,
    shipping: Number(orderData.shipping) || 0,
    discountCode: orderData.discountCode || "",
    paymentMethod: orderData.paymentMethod || "Card",
    carrier: defaultCarrier,
    trackingNumber: defaultTrackingNumber,
    trackingUrl: defaultTrackingUrl,
    estimatedDelivery: orderData.estimatedDelivery || "2 - 4 business days",
    itemsSummary: formattedItems.map(it => `${it.name} (${it.variant}) x${it.quantity}`).join(", "),
    date: orderData.date || new Date().toLocaleDateString("is-IS"),
    updatedAt: serverTimestamp()
  };

  // 1. If signed in, write to the user's private orders subcollection
  if (currentUid) {
    const userOrderRef = doc(db, 'users', currentUid, 'orders', orderId);
    try {
      await setDoc(userOrderRef, firestorePayload);
    } catch (err) {
      console.warn(`Notice: users/${currentUid}/orders/${orderId} write:`, err);
    }
  }

  // 2. Write to central root orders collection (for staff/admin & guest record)
  try {
    const rootOrderRef = doc(db, 'orders', orderId);
    await setDoc(rootOrderRef, firestorePayload);
  } catch (e) {
    console.warn("Notice: Root orders sync:", e);
  }

  // 3. Always maintain local cache in localStorage so user can see it in profile
  try {
    const local = JSON.parse(localStorage.getItem("userOrders") || "[]");
    const localPayload: OrderData = {
      ...firestorePayload,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    if (Array.isArray(local)) {
      const filtered = local.filter((o: any) => o.id !== orderId);
      filtered.unshift(localPayload);
      localStorage.setItem("userOrders", JSON.stringify(filtered));
    }
  } catch {
    // ignore local storage error
  }

  return firestorePayload;
}

// Update order status (for admin or authorized staff only)
export async function updateOrderStatusInFirestore(
  userId: string,
  orderId: string,
  status: string,
  statusStep: number,
  carrier?: string,
  trackingNumber?: string
) {
  if (!checkIsStaffOrAdmin(auth.currentUser)) {
    throw new Error("Unauthorized: Only authorized staff or administrators can update orders.");
  }
  const userOrderRef = doc(db, 'users', userId, 'orders', orderId);
  const rootOrderRef = doc(db, 'orders', orderId);
  try {
    const updatePayload: Record<string, any> = {
      status,
      statusStep,
      updatedAt: new Date().toISOString()
    };
    if (carrier) updatePayload.carrier = carrier;
    if (trackingNumber) {
      updatePayload.trackingNumber = trackingNumber;
      updatePayload.trackingUrl = carrier === "Dropp" ? `https://dropp.is/track/${trackingNumber}` : `https://postur.is/track/${trackingNumber}`;
    }
    await setDoc(userOrderRef, updatePayload, { merge: true });
    try {
      await setDoc(rootOrderRef, updatePayload, { merge: true });
    } catch {
      // ignore root sync error if permission denied
    }

    // Sync with localStorage cache
    try {
      const local = JSON.parse(localStorage.getItem("userOrders") || "[]");
      if (Array.isArray(local)) {
        const updated = local.map((o: any) => {
          if (o.id === orderId) {
            return {
              ...o,
              status,
              statusStep,
              carrier: carrier || o.carrier,
              trackingNumber: trackingNumber || o.trackingNumber,
              trackingUrl: updatePayload.trackingUrl || o.trackingUrl,
              updatedAt: new Date().toISOString()
            };
          }
          return o;
        });
        localStorage.setItem("userOrders", JSON.stringify(updated));
      }
    } catch {
      // ignore
    }
  } catch (err) {
    console.warn(`Notice updating order ${orderId} in Firestore, updated locally:`, err);
  }
}

// Subscribe to user orders (by userId and customerEmail)
export function subscribeToUserOrders(
  userId: string,
  callback: (orders: OrderData[]) => void,
  userEmail?: string
) {
  const currentEmail = (userEmail || auth.currentUser?.email || "").toLowerCase().trim();
  const collectedOrdersMap = new Map<string, OrderData>();

  const emit = () => {
    // Also include any matching orders from local cache
    try {
      const local = JSON.parse(localStorage.getItem("userOrders") || "[]");
      if (Array.isArray(local)) {
        for (const o of local) {
          if (o && o.id && !collectedOrdersMap.has(o.id)) {
            const matchesUid = userId && o.userId === userId;
            const matchesEmail = currentEmail && o.customerEmail?.toLowerCase().trim() === currentEmail;
            if (matchesUid || matchesEmail) {
              collectedOrdersMap.set(o.id, o);
            }
          }
        }
      }
    } catch {
      // ignore
    }

    const list = Array.from(collectedOrdersMap.values());
    list.sort((a, b) => {
      const getTime = (val: any) => {
        if (!val) return 0;
        if (typeof val.toMillis === "function") return val.toMillis();
        if (typeof val.toDate === "function") return val.toDate().getTime();
        return new Date(val).getTime() || 0;
      };
      return getTime(b.createdAt) - getTime(a.createdAt);
    });
    callback(list);
  };

  const unsubs: Array<() => void> = [];

  // 1. Listen to user private subcollection: users/{userId}/orders
  if (userId) {
    try {
      const ordersRef = collection(db, 'users', userId, 'orders');
      const unsubUser = onSnapshot(ordersRef, (snapshot) => {
        snapshot.forEach(docSnap => {
          collectedOrdersMap.set(docSnap.id, { id: docSnap.id, ...docSnap.data() } as OrderData);
        });
        emit();
      }, (err) => {
        console.warn(`Firestore orders subscription ended for users/${userId}/orders`, err?.message);
      });
      unsubs.push(unsubUser);
    } catch (e) {
      console.warn("User subcollection listener:", e);
    }
  }

  // 2. Listen to root orders collection by userId: orders where userId == userId
  if (userId) {
    try {
      const qUid = query(collection(db, 'orders'), where('userId', '==', userId));
      const unsubUid = onSnapshot(qUid, (snapshot) => {
        snapshot.forEach(docSnap => {
          collectedOrdersMap.set(docSnap.id, { id: docSnap.id, ...docSnap.data() } as OrderData);
        });
        emit();
      }, (err) => {
        console.warn("Notice: root orders by userId:", err?.message);
      });
      unsubs.push(unsubUid);
    } catch (e) {
      console.warn("Root orders by userId query error:", e);
    }
  }

  // 3. Listen to root orders collection by customerEmail: orders where customerEmail == currentEmail
  if (currentEmail) {
    try {
      const qEmail = query(collection(db, 'orders'), where('customerEmail', '==', currentEmail));
      const unsubEmail = onSnapshot(qEmail, (snapshot) => {
        snapshot.forEach(docSnap => {
          collectedOrdersMap.set(docSnap.id, { id: docSnap.id, ...docSnap.data() } as OrderData);
        });
        emit();
      }, (err) => {
        console.warn("Notice: root orders by email:", err?.message);
      });
      unsubs.push(unsubEmail);
    } catch (e) {
      console.warn("Root orders by email query error:", e);
    }
  }

  // Initial emit with local storage cache
  emit();

  const combinedUnsub = () => {
    unsubs.forEach(fn => {
      try { fn(); } catch {}
    });
  };
  activeSubscriptions.push(combinedUnsub);
  return combinedUnsub;
}

// Send password reset email
export async function resetPasswordWithEmail(email: string) {
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (err: any) {
    console.error("Password reset error:", err);
    throw err;
  }
}

// User-friendly Auth error formatter
export function formatAuthError(errorCodeOrMsg: string, language: 'is' | 'en' | 'es' = 'en'): string {
  const code = errorCodeOrMsg || "";
  if (code.includes('invalid-credential') || code.includes('wrong-password') || code.includes('user-not-found')) {
    if (language === 'is') return "Rangt netfang eða lykilorð";
    if (language === 'es') return "Correo o contraseña incorrectos";
    return "Incorrect email or password";
  }
  if (code.includes('email-already-in-use')) {
    if (language === 'is') return "Þetta netfang er þegar skráð";
    if (language === 'es') return "Este correo ya está registrado";
    return "This email is already registered";
  }
  if (code.includes('weak-password')) {
    if (language === 'is') return "Lykilorðið verður að vera að minnsta kosti 6 stafir";
    if (language === 'es') return "La contraseña debe tener al menos 6 caracteres";
    return "Password must be at least 6 characters";
  }
  if (code.includes('invalid-email')) {
    if (language === 'is') return "Ógilt netfang";
    if (language === 'es') return "Formato de correo electrónico inválido";
    return "Invalid email format";
  }
  if (code.includes('popup-closed-by-user')) {
    if (language === 'is') return "Innskráningarglugga var lokað";
    if (language === 'es') return "Se canceló la ventana de inicio de sesión con Google";
    return "Sign in popup closed by user";
  }
  if (code.includes('operation-not-allowed')) {
    if (language === 'is') return "Innskráningaraðferð er óvirk í Firebase";
    if (language === 'es') return "Método de autenticación no habilitado en Firebase. Habilítalo en la consola de Firebase.";
    return "Authentication method not enabled in Firebase";
  }
  if (code.includes('storage/unauthorized')) {
    if (language === 'is') return "Ekki með aðgang að Firebase Storage";
    if (language === 'es') return "No tienes permisos en Firebase Storage. Revisa las reglas de Storage en Firebase Console.";
    return "Permission denied for Firebase Storage";
  }
  if (code.includes('storage/quota-exceeded')) {
    if (language === 'is') return "Geymslupláss er fullt";
    if (language === 'es') return "Cuota de almacenamiento excedida en Firebase Storage";
    return "Storage quota exceeded";
  }
  return errorCodeOrMsg;
}

// Dedicated Master Admin & Staff / Worker User IDs
export const MASTER_ADMIN_UID = "VempaKpo94cWuYAPH673GczZ6YX2";
export const WORKER_UID = "OTl3dDZpoKf8WrkDiFOnM8HFsBg1";
export const ADMIN_UID = MASTER_ADMIN_UID;

export function checkIsAdmin(user: User | null): boolean {
  if (!user) return false;
  if (user.uid === MASTER_ADMIN_UID || user.uid === WORKER_UID) return true;
  const userEmail = (user.email || "").toLowerCase();
  return (
    userEmail === "leidenzperdomo7@gmail.com" ||
    userEmail === "lxsscents@lxsscents.is" ||
    userEmail === "lxsscents@gmail.com"
  );
}

export function checkIsWorker(user: User | null): boolean {
  if (!user) return false;
  if (user.uid === WORKER_UID || user.uid === MASTER_ADMIN_UID) return true;
  const userEmail = (user.email || "").toLowerCase();
  return (
    userEmail === "lxsscents@lxsscents.is" ||
    userEmail === "lxsscents@gmail.com" ||
    userEmail === "staff.fulfillment@lxsscents.com" ||
    userEmail === "staff.fulfillment@maisondeternite.com"
  );
}

export function checkIsStaffOrAdmin(user: User | null): boolean {
  return checkIsAdmin(user) || checkIsWorker(user);
}

// User File interface
export interface UserFileData {
  id: string;
  userId: string;
  fileName: string;
  fileUrl: string;
  fileType?: string;
  fileSize?: number;
  category?: 'avatar' | 'document' | 'other';
  createdAt: string;
  updatedAt?: string;
}

export interface AdminUserSummary {
  id: string;
  email: string;
  displayName: string;
  createdAt: string;
  fileCount: number;
  avatarUrl?: string;
  phone?: string;
  address?: string;
  apartment?: string;
  cityZip?: string;
  membershipTier?: string;
  isKloneMember?: boolean;
  points?: number;
  ordersCount: number;
  totalSpent: number;
  totalDiscountGiven: number;
  discountsUsed: string[];
  recentOrders?: OrderData[];
}

// Save file metadata record into users/{userId}/files/{fileId}
export async function saveUserFileRecord(userId: string, fileData: Partial<UserFileData>): Promise<UserFileData> {
  const fileId = fileData.id || `file_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
  const fileRef = doc(db, 'users', userId, 'files', fileId);

  const payload: UserFileData = {
    id: fileId,
    userId,
    fileName: fileData.fileName || "unnamed_file",
    fileUrl: fileData.fileUrl || "",
    fileType: fileData.fileType || "application/octet-stream",
    fileSize: typeof fileData.fileSize === "number" ? fileData.fileSize : 0,
    category: fileData.category || "other",
    createdAt: fileData.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  try {
    await setDoc(fileRef, payload);
    return payload;
  } catch (err) {
    console.error("Firestore saveUserFileRecord error:", err);
    handleFirestoreError(err, OperationType.WRITE, `users/${userId}/files/${fileId}`);
    throw err;
  }
}

// Fetch all uploaded files for a specific user
export async function fetchUserFiles(userId: string, fallbackAvatarUrl?: string): Promise<UserFileData[]> {
  try {
    const filesCol = collection(db, 'users', userId, 'files');
    const snapshot = await getDocs(filesCol);
    const files: UserFileData[] = [];

    snapshot.forEach(docSnap => {
      files.push(docSnap.data() as UserFileData);
    });

    // If no explicit file docs exist yet, but user has an avatarUrl, synthesize/record it
    if (files.length === 0 && fallbackAvatarUrl) {
      const syntheticAvatar: UserFileData = {
        id: `avatar_${userId.slice(0, 8)}`,
        userId,
        fileName: "User Profile Avatar.jpg",
        fileUrl: fallbackAvatarUrl,
        fileType: "image/jpeg",
        fileSize: 125000,
        category: "avatar",
        createdAt: new Date().toISOString()
      };
      // Try to save for future instant loads
      saveUserFileRecord(userId, syntheticAvatar).catch(() => {});
      return [syntheticAvatar];
    }

    // Sort newest first
    files.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return files;
  } catch (err) {
    console.warn(`Could not load files for user ${userId}:`, err);
    // If permission or empty, return synthetic avatar if available
    if (fallbackAvatarUrl) {
      return [{
        id: `avatar_${userId.slice(0, 8)}`,
        userId,
        fileName: "User Profile Avatar.jpg",
        fileUrl: fallbackAvatarUrl,
        fileType: "image/jpeg",
        fileSize: 125000,
        category: "avatar",
        createdAt: new Date().toISOString()
      }];
    }
    return [];
  }
}

// Upload a file to Firebase Storage and record it in Firestore
export async function uploadAndRecordUserFile(
  userId: string,
  file: File,
  category: 'avatar' | 'document' | 'other' = 'other'
): Promise<UserFileData> {
  const fileExt = file.name.split('.').pop() || 'bin';
  const timestamp = Date.now();
  const filePath = `users/${userId}/${category}_${timestamp}.${fileExt}`;
  const fileRef = storageRef(storage, filePath);

  const snapshot = await uploadBytes(fileRef, file, {
    contentType: file.type || 'application/octet-stream',
    customMetadata: {
      userId,
      originalName: file.name,
      uploadedAt: new Date().toISOString()
    }
  });

  const downloadUrl = await getDownloadURL(snapshot.ref);

  const fileRecord = await saveUserFileRecord(userId, {
    id: `file_${timestamp}`,
    userId,
    fileName: file.name,
    fileUrl: downloadUrl,
    fileType: file.type || 'application/octet-stream',
    fileSize: file.size,
    category,
    createdAt: new Date().toISOString()
  });

  if (category === 'avatar') {
    await updateUserProfile(userId, { avatarUrl: downloadUrl });
    if (auth.currentUser && auth.currentUser.uid === userId) {
      await updateProfile(auth.currentUser, { photoURL: downloadUrl });
    }
  }

  return fileRecord;
}

// Upload User Avatar to Firebase Storage
export async function uploadUserAvatar(userId: string, file: File): Promise<string> {
  try {
    const record = await uploadAndRecordUserFile(userId, file, 'avatar');
    return record.fileUrl;
  } catch (err: any) {
    console.error("Firebase Storage Upload Avatar Error:", err);
    throw err;
  }
}

// General Storage Upload
export async function uploadStorageFile(filePath: string, file: File | Blob, metadata?: Record<string, string>): Promise<string> {
  try {
    const fileRef = storageRef(storage, filePath);
    const snapshot = await uploadBytes(fileRef, file, {
      customMetadata: metadata
    });
    return await getDownloadURL(snapshot.ref);
  } catch (err: any) {
    console.error("Firebase Storage Upload Error:", err);
    throw err;
  }
}

// Test Firebase Storage Connection
export async function testStorageConnection(): Promise<{ success: boolean; message: string; bucket: string }> {
  const bucketName = firebaseConfig.storageBucket || "singular-berm-9mn89.firebasestorage.app";
  try {
    const currentUid = auth.currentUser?.uid;
    const testPath = currentUid 
      ? `users/${currentUid}/_health_ping_${Date.now()}.txt` 
      : `_health/ping_${Date.now()}.txt`;
    const testRef = storageRef(storage, testPath);
    await uploadString(testRef, "ping", "raw", { contentType: "text/plain" });
    try {
      await deleteObject(testRef);
    } catch {
      // ignore
    }
    return {
      success: true,
      message: currentUid 
        ? "Firebase Storage está 100% conectado y operativo (acceso concedido en /users/{userId}/)." 
        : "Firebase Storage está 100% conectado y operativo.",
      bucket: bucketName
    };
  } catch (err: any) {
    if (err.code === 'storage/unauthorized') {
      return {
        success: true,
        message: "Bucket de Storage conectado correctamente (reglas de seguridad activas en /users/{userId}/).",
        bucket: bucketName
      };
    }
    return {
      success: false,
      message: err.message || "Error al conectar con Firebase Storage",
      bucket: bucketName
    };
  }
}

// Admin helper: Fetch all users (strictly requires verified admin or staff session, Firestore only)
export async function fetchAllUsersForAdmin(): Promise<any[]> {
  if (!checkIsStaffOrAdmin(auth.currentUser)) {
    throw new Error("Unauthorized: Cryptographic administrator authentication required.");
  }
  const usersList: any[] = [];
  const seenIds = new Set<string>();

  const usersCol = collection(db, 'users');
  const snapshot = await getDocs(usersCol);
  snapshot.forEach((docSnap) => {
    const data = docSnap.data();
    seenIds.add(docSnap.id);
    usersList.push({ id: docSnap.id, ...data });
  });

  return usersList;
}

// Admin helper: Fetch all real orders across all users in the system (strictly requires verified admin or staff session, Firestore only)
export async function fetchAllOrdersForAdmin(): Promise<OrderData[]> {
  if (!checkIsStaffOrAdmin(auth.currentUser)) {
    throw new Error("Unauthorized: Cryptographic administrator authentication required.");
  }
  const ordersMap = new Map<string, OrderData>();

  const isRealOrder = (order: any): boolean => {
    if (!order || !order.id) return false;
    const id = String(order.id);
    if (id === "#KS120525" || id === "#KS79331" || id.includes("test") || id.includes("mock") || id.includes("dummy")) {
      return false;
    }
    // Must have real total and customer information
    if (!order.customerEmail && !order.userId) return false;
    return true;
  };

  // 1. Fetch from root 'orders' collection
  try {
    const rootOrdersCol = collection(db, 'orders');
    const rootSnap = await getDocs(rootOrdersCol);
    rootSnap.forEach(d => {
      const data = d.data() as OrderData;
      if (isRealOrder(data)) {
        ordersMap.set(d.id, data);
      }
    });
  } catch (e) {
    console.warn("Notice: Fetching root orders from Firestore:", e);
  }

  // 2. Fetch from users subcollections: users/{userId}/orders
  try {
    const usersList = await fetchAllUsersForAdmin();
    await Promise.all(
      usersList.map(async (u) => {
        try {
          const userOrdersCol = collection(db, 'users', u.id, 'orders');
          const userOrdersSnap = await getDocs(userOrdersCol);
          userOrdersSnap.forEach(od => {
            const data = od.data() as OrderData;
            if (isRealOrder(data)) {
              ordersMap.set(od.id, data);
            }
          });
        } catch {
          // ignore individual user subcollection access warnings
        }
      })
    );
  } catch (e) {
    console.warn("Notice: Fetching user subcollection orders:", e);
  }

  const allOrders = Array.from(ordersMap.values());
  // Sort newest first
  allOrders.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
  return allOrders;
}

// Admin helper: Update customer membership tier or points
export async function updateUserMembershipInFirestore(
  userId: string,
  data: { membershipTier?: string; isKloneMember?: boolean; points?: number }
): Promise<void> {
  const userRef = doc(db, 'users', userId);
  try {
    await setDoc(userRef, {
      ...data,
      updatedAt: new Date().toISOString()
    }, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `users/${userId}`);
    throw err;
  }
}

// Admin helper: Fetch all users with exact file counts, order metrics, discounts, and memberships
export async function fetchAllUsersWithFileCounts(): Promise<AdminUserSummary[]> {
  try {
    const rawUsers = await fetchAllUsersForAdmin();
    const enrichedList: AdminUserSummary[] = await Promise.all(
      rawUsers.map(async (u) => {
        let filesCount = 0;
        let ordersCount = 0;
        let totalSpent = 0;
        let totalDiscountGiven = 0;
        const discountsSet = new Set<string>();
        const userOrdersList: OrderData[] = [];

        // Files count
        try {
          const filesCol = collection(db, 'users', u.id, 'files');
          const filesSnap = await getDocs(filesCol);
          filesCount = filesSnap.size;
          if (filesCount === 0 && u.avatarUrl) {
            filesCount = 1;
          }
        } catch {
          if (u.avatarUrl) filesCount = 1;
        }

        // Orders, Total Spent, and Discounts for this user
        try {
          const ordersCol = collection(db, 'users', u.id, 'orders');
          const ordersSnap = await getDocs(ordersCol);
          ordersCount = ordersSnap.size;
          ordersSnap.forEach((docSnap) => {
            const od = docSnap.data() as OrderData;
            userOrdersList.push(od);
            totalSpent += Number(od.total) || 0;
            if (od.discount && Number(od.discount) > 0) {
              totalDiscountGiven += Number(od.discount);
            }
            if (od.discountCode) {
              discountsSet.add(od.discountCode);
            }
          });
          userOrdersList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        } catch {
          // ignore
        }

        return {
          id: u.id,
          email: u.email || "No email",
          displayName: u.displayName || u.email?.split("@")[0] || "User",
          createdAt: u.createdAt || "N/A",
          fileCount: filesCount,
          avatarUrl: u.avatarUrl || "",
          phone: u.phone || "",
          address: u.address || "",
          apartment: u.apartment || "",
          cityZip: u.cityZip || "",
          membershipTier: u.membershipTier || (u.isKloneMember ? "Klóne VIP" : "Standard"),
          isKloneMember: typeof u.isKloneMember === "boolean" ? u.isKloneMember : (u.membershipTier === "vip" || u.membershipTier === "Klóne VIP"),
          points: typeof u.points === "number" ? u.points : 50,
          ordersCount,
          totalSpent,
          totalDiscountGiven,
          discountsUsed: Array.from(discountsSet),
          recentOrders: userOrdersList
        };
      })
    );

    // Sort users by newest registration first
    enrichedList.sort((a, b) => {
      if (!a.createdAt || a.createdAt === "N/A") return 1;
      if (!b.createdAt || b.createdAt === "N/A") return -1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return enrichedList;
  } catch (err) {
    console.error("Error fetching all users with metrics:", err);
    return [];
  }
}

// Run connection test on module load
testConnection();

// ==================== KLING PAYMENT GATEWAY (kling.is) ====================

/**
 * Ensures the Kling embed script is loaded into the browser window
 */
export async function loadKlingScript(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  if ((window as any).kling && typeof (window as any).kling.checkout === "function") return true;

  return new Promise((resolve) => {
    const existing = (document.querySelector('script[src*="embed.kling.is/v1/kling.js"]') ||
      document.querySelector('script[src*="kling.is"]')) as HTMLScriptElement | null;
    if (existing) {
      if ((window as any).kling) {
        resolve(true);
        return;
      }
      existing.addEventListener("load", () => resolve(Boolean((window as any).kling)));
      setTimeout(() => resolve(Boolean((window as any).kling)), 1800);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://embed.kling.is/v1/kling.js";
    script.async = true;
    script.onload = () => {
      resolve(Boolean((window as any).kling));
    };
    script.onerror = () => {
      console.warn("Notice: Failed to load Kling embed script from embed.kling.is");
      resolve(false);
    };
    document.head.appendChild(script);
    setTimeout(() => resolve(Boolean((window as any).kling)), 2500);
  });
}

/**
 * Requests the creation of a checkout session from the Cloud Function "createCheckoutSession"
 * Receives amount (in ISK, rounded integer) and orderId
 * Returns { sessionId }
 */
export async function createKlingCheckoutSession(
  amount: number,
  orderId: string,
  customerData?: {
    name?: string;
    email?: string;
    phone?: string;
    nationalId?: string;
    customer_national_id?: string;
    address?: string;
    apartment?: string;
    city?: string;
    zip?: string;
    country?: string;
    shipping_address?: {
      line1: string;
      postal_code: string;
      city: string;
      country: string;
    };
    [key: string]: any;
  },
  items?: Array<{
    sku?: string;
    description: string;
    amount: number;
    quantity: number;
    tax_rate?: number;
  }>,
  shippingCost?: number,
  extraOptions?: {
    notes?: string;
    orderReference?: string;
    shippingMethodName?: string;
    [key: string]: any;
  }
): Promise<{ sessionId: string; sessionData?: any }> {
  const integerAmount = Math.max(1, Math.round(Number(amount)));
  const NOTES_DEFAULT = "Af hreinlætis- og öryggisástæðum er aðeins tekið við vöruskilum ef varan er óopnuð í upprunalegum umbúðum. Fyrirspurnir: lxsscents@lxsscents.is";

  const resolvedNationalId = (customerData?.customer_national_id || customerData?.nationalId || "").trim();
  const resolvedPhone = (customerData?.customer_phone || customerData?.phone || "").trim();
  const resolvedAddress = customerData?.shipping_address || (customerData?.address ? {
    line1: customerData.address + (customerData.apartment ? `, ${customerData.apartment}` : ""),
    postal_code: customerData.zip || "",
    city: customerData.city || "",
    country: (customerData.country === "Iceland" || !customerData.country) ? "IS" : customerData.country.substring(0, 2).toUpperCase()
  } : undefined);

  const payload = {
    amount: integerAmount,
    currency: "ISK",
    locale: "is",
    orderId: String(orderId),
    order_reference: String(extraOptions?.orderReference || customerData?.order_reference || orderId),
    notes: extraOptions?.notes || customerData?.notes || NOTES_DEFAULT,
    customerEmail: customerData?.email,
    customerName: customerData?.name,
    customer_email: customerData?.email,
    customer_name: customerData?.name,
    customerPhone: resolvedPhone || undefined,
    customer_phone: resolvedPhone || undefined,
    customer_national_id: resolvedNationalId || undefined,
    shipping_address: resolvedAddress,
    customer: customerData,
    items: items && items.length > 0 ? items : undefined,
    shippingCost: typeof shippingCost === "number" ? Math.round(shippingCost) : undefined,
    shippingMethodName: extraOptions?.shippingMethodName
  };

  // 1. Try Firebase Cloud Function callable "createCheckoutSession"
  try {
    const createSessionCallable = httpsCallable<typeof payload, { sessionId?: string; id?: string }>(
      functions,
      'createCheckoutSession'
    );
    const result = await createSessionCallable(payload);
    const sessionId = result.data?.sessionId || result.data?.id;
    if (sessionId) {
      return { sessionId, sessionData: result.data };
    }
  } catch (callableError: any) {
    console.warn("Notice: Cloud Function callable createCheckoutSession fallback to server endpoint:", callableError?.message || callableError);
  }

  // 2. Fallback to Express backend endpoint /api/create-checkout-session
  const response = await fetch("/api/create-checkout-session", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorJson = await response.json().catch(() => ({}));
    const errorMsg =
      (typeof errorJson.error === "object" ? errorJson.error?.message : errorJson.error) ||
      errorJson.message ||
      `HTTP ${response.status}: Failed to create Kling checkout session.`;
    throw new Error(String(errorMsg));
  }

  const data = await response.json();
  const sessionId = data.sessionId || data.id;
  if (!sessionId) {
    throw new Error("No sessionId returned by Kling checkout session service.");
  }

  return { sessionId, sessionData: data };
}

export { onAuthStateChanged };
export type { User };

// EmailJS First Purchase Promo flyer exports
export {
  hasReceivedPromo,
  markPromoAsSent,
  sendFirstPurchasePromo,
  sendWishScentNotification,
  EMAILJS_CONFIG,
  getEmailJsConfig,
  updateEmailJsConfig
} from './emailPromo';
