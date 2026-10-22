import emailjs from '@emailjs/browser';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';

// ==========================================
// CONFIGURACIÓN DE CREDENCIALES EMAILJS
// ==========================================
export function getEmailJsConfig() {
  const serviceId =
    (typeof window !== 'undefined' && localStorage.getItem('emailjs_service_id')) ||
    (import.meta.env.VITE_EMAILJS_SERVICE_ID as string) ||
    'service_k8k3rsu';

  const storedTemplate = typeof window !== 'undefined' ? localStorage.getItem('emailjs_template_id') : null;
  const templateId =
    (storedTemplate && storedTemplate !== 'tbbqmfn' ? storedTemplate : null) ||
    (import.meta.env.VITE_EMAILJS_TEMPLATE_ID as string) ||
    'template_g25ynha';

  const publicKey =
    (typeof window !== 'undefined' && localStorage.getItem('emailjs_public_key')) ||
    (import.meta.env.VITE_EMAILJS_PUBLIC_KEY as string) ||
    'y1-LgfmzrOxoiyKKK';

  return {
    SERVICE_ID: serviceId,
    TEMPLATE_ID: templateId,
    PUBLIC_KEY: publicKey,
  };
}

export function updateEmailJsConfig(config: { serviceId?: string; templateId?: string; publicKey?: string }) {
  if (typeof window === 'undefined') return;
  if (config.serviceId !== undefined) localStorage.setItem('emailjs_service_id', config.serviceId.trim());
  if (config.templateId !== undefined) localStorage.setItem('emailjs_template_id', config.templateId.trim());
  if (config.publicKey !== undefined) localStorage.setItem('emailjs_public_key', config.publicKey.trim());
}

export const EMAILJS_CONFIG = {
  get SERVICE_ID() {
    return getEmailJsConfig().SERVICE_ID;
  },
  get TEMPLATE_ID() {
    return getEmailJsConfig().TEMPLATE_ID;
  },
  get PUBLIC_KEY() {
    return getEmailJsConfig().PUBLIC_KEY;
  },
};

// ==========================================
// 1. VERIFICAR EN FIREBASE SI YA RECIBIÓ EL FLYER
// ==========================================
export async function hasReceivedPromo(email: string): Promise<boolean> {
  try {
    const cleanEmail = email.trim().toLowerCase();
    const promoRef = doc(db, 'promo_recipients', cleanEmail);
    const promoSnap = await getDoc(promoRef);
    return promoSnap.exists();
  } catch (error) {
    console.warn('Aviso al verificar estado de la promoción en Firestore:', error);
    return false;
  }
}

// ==========================================
// 2. MARCAR EN FIREBASE COMO ENVIADO / NEWSLETTER
// ==========================================
export async function markPromoAsSent(email: string, orderId?: string): Promise<void> {
  try {
    const cleanEmail = email.trim().toLowerCase();
    const promoRef = doc(db, 'promo_recipients', cleanEmail);
    await setDoc(promoRef, {
      email: cleanEmail,
      orderId: orderId || null,
      sentAt: serverTimestamp(),
      promoCode: 'LXSSCENTS10',
    });

    // Also persist in newsletter collection
    try {
      const newsletterRef = doc(db, 'newsletter', cleanEmail);
      await setDoc(newsletterRef, {
        email: cleanEmail,
        createdAt: new Date().toISOString(),
      }, { merge: true });
    } catch {
      // ignore
    }
  } catch (error) {
    console.warn('Aviso al registrar destinatario en Firestore:', error);
  }
}

// ==========================================
// 3. FUNCIÓN PRINCIPAL DE ENVÍO AUTOMÁTICO (FLYER 10%)
// ==========================================
export async function sendFirstPurchasePromo(
  customerEmail: string,
  customerName: string = 'Kæri viðskiptavinur',
  orderId?: string
): Promise<boolean> {
  if (!customerEmail) return false;

  const cleanEmail = customerEmail.trim().toLowerCase();

  try {
    // Sin bloqueos de prueba previa: permite enviar el cupón a cualquier dirección ingresada
    const config = getEmailJsConfig();
    const serviceId = config.SERVICE_ID || 'service_k8k3rsu';
    const templateId = 'template_g25ynha';
    const publicKey = config.PUBLIC_KEY || 'y1-LgfmzrOxoiyKKK';

    const templateParams = {
      to_email: cleanEmail,
      discount_code: 'LXSSCENTS10',
      customer_name: customerName,
      promo_code: 'LXSSCENTS10',
      discount: '10%',
      order_id: orderId || '',
    };

    try {
      await emailjs.send(
        serviceId,
        templateId,
        templateParams,
        publicKey
      );
      console.log(`[LxS SCENTS] Cupón LXSSCENTS10 enviado con éxito a ${cleanEmail} usando ${serviceId} / ${templateId}`);
    } catch (err: any) {
      console.warn('[LxS SCENTS] Aviso de EmailJS:', err);
    }

    // Registrar en Firebase para estadísticas y newsletter
    await markPromoAsSent(cleanEmail, orderId);
    return true;
  } catch (error) {
    console.warn('[LxS SCENTS] Aviso al procesar el flyer promocional:', error);
    return false;
  }
}

// ==========================================
// 4. WISH SCENT / ÓSKA-ILMUR NOTIFICATION
// Template ID específico: 'template_m2qpxr5'
// Service ID: 'service_k8k3rsu'
// Parámetros exactos requeridos:
// { scent_name, user_notes, user_email } -> lxsscents@lxsscents.is
// ==========================================
export async function sendWishScentNotification(data: {
  scentName?: string;
  fragranceName?: string;
  userNotes?: string;
  userEmail: string;
  userName?: string;
}): Promise<boolean> {
  const cleanEmail = (data.userEmail || '').trim().toLowerCase();
  const cleanName = (data.userName || '').trim() || 'Viðskiptavinur';
  const cleanScent = (data.scentName || data.fragranceName || '').trim();
  const cleanNotes = (
    data.userNotes ||
    (data.userName ? `Nafn: ${cleanName}` : '') ||
    'Engar sérstakar athugasemdir'
  ).trim();

  // 1. Guardar en Firestore en la colección 'scent_wishes'
  try {
    const wishId = `wish_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
    const wishRef = doc(db, 'scent_wishes', wishId);
    await setDoc(wishRef, {
      fragranceName: cleanScent,
      scentName: cleanScent,
      userEmail: cleanEmail,
      userName: cleanName,
      userNotes: cleanNotes,
      createdAt: new Date().toISOString(),
    });
  } catch (err) {
    console.warn('Notice saving scent wish to Firestore:', err);
  }

  // 2. Disparar notificación vía EmailJS usando Template 'template_m2qpxr5' y Service 'service_k8k3rsu'
  try {
    const serviceId = 'service_k8k3rsu';
    const templateId = 'template_m2qpxr5';
    const publicKey = 'y1-LgfmzrOxoiyKKK';

    // Parámetros exactos esperados por la plantilla
    const templateParams = {
      scent_name: cleanScent,
      user_notes: cleanNotes,
      user_email: cleanEmail,
      to_email: 'lxsscents@lxsscents.is',
      target_email: 'lxsscents@lxsscents.is',
      user_name: cleanName,
      customer_name: cleanName,
      from_name: cleanName,
      fragrance_name: cleanScent,
      subject: 'Ný ósk um ilm / Nueva solicitud de fragancia',
    };

    await emailjs.send(
      serviceId,
      templateId,
      templateParams,
      publicKey
    );
    console.log(`[LxS SCENTS] Wish scent notification sent successfully to lxsscents@lxsscents.is using template "${templateId}"`);
  } catch (err: any) {
    console.warn('[LxS SCENTS] Notice during EmailJS wish scent notification:', err);
  }

  // 3. Notificación complementaria al backend
  try {
    await fetch('/api/wish-scent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        scentName: cleanScent,
        fragranceName: cleanScent,
        userNotes: cleanNotes,
        userEmail: cleanEmail,
        userName: cleanName,
      }),
    });
  } catch {
    // ignore
  }

  return true;
}
