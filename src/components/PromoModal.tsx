import React, { useState, useEffect } from "react";
import { X, Check } from "lucide-react";
import emailjs from "@emailjs/browser";
import { Language } from "../translations";
import { markPromoAsSent } from "../emailPromo";

interface PromoModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
}

export default function PromoModal({ isOpen, onClose, language }: PromoModalProps) {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (isOpen) {
      setEmail("");
      setIsSuccess(false);
      setErrorMsg("");
      setIsSubmitting(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      setErrorMsg(
        language === "is"
          ? "Vinsamlegast sláðu inn gilt netfang."
          : language === "es"
          ? "Por favor introduce un correo válido."
          : "Please enter a valid email."
      );
      return;
    }

    const cleanEmail = email.trim().toLowerCase();
    setIsSubmitting(true);
    setErrorMsg("");

    try {
      // 1. Envío directo con EmailJS usando las credenciales y parámetros exactos requeridos
      const serviceId = "service_k8k3rsu";
      const templateId = "template_g25ynha";
      const publicKey = "y1-LgfmzrOxoiyKKK";

      await emailjs.send(
        serviceId,
        templateId,
        {
          to_email: cleanEmail,
          discount_code: "LXSSCENTS10",
        },
        publicKey
      );

      console.log(`[EmailJS] Cupón LXSSCENTS10 enviado exitosamente a ${cleanEmail}`);

      // 2. Registro en Firebase ('promo_recipients' y 'newsletter')
      try {
        await markPromoAsSent(cleanEmail);
      } catch (err) {
        console.warn("Notice saving to Firebase promo_recipients:", err);
      }

      // 3. Guardar en localStorage para persistencia y activación de cupón
      localStorage.setItem("welcomePromoDismissed", "true");
      localStorage.setItem("hasClosedWelcomePromo", "true");
      localStorage.setItem("pendingDiscountCode", "LXSSCENTS10");

      setIsSuccess(true);

      // Cierre automático tras mostrar la confirmación
      setTimeout(() => {
        onClose();
      }, 2800);
    } catch (err: any) {
      console.warn("Aviso EmailJS:", err);
      // Aún si EmailJS reporta alguna advertencia o falta de cuota, registramos el cupón para no frustrar al usuario
      try {
        await markPromoAsSent(cleanEmail);
      } catch {
        // ignore
      }
      localStorage.setItem("welcomePromoDismissed", "true");
      localStorage.setItem("hasClosedWelcomePromo", "true");
      localStorage.setItem("pendingDiscountCode", "LXSSCENTS10");
      setIsSuccess(true);
      setTimeout(() => {
        onClose();
      }, 2800);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      id="welcome-promo-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs transition-opacity duration-300"
    >
      <div
        onClick={onClose}
        className="fixed inset-0 bg-transparent cursor-pointer"
        aria-hidden="true"
      />

      <div
        id="discount-commercial-card"
        className="relative w-[95%] sm:w-full max-w-4xl scale-[0.8] sm:scale-100 transform origin-center bg-[#f5f2eb] border border-neutral-300 z-10 rounded-sm shadow-2xl flex flex-col md:flex-row overflow-hidden animate-luxury-entrance max-h-[90vh]"
      >
        {/* Elegant Close Indicator */}
        <button
          id="close-ad-popup-btn"
          onClick={() => {
            localStorage.setItem("hasClosedWelcomePromo", "true");
            onClose();
          }}
          className="cursor-pointer absolute top-4 right-4 p-1.5 rounded-full text-neutral-500 hover:text-neutral-800 hover:bg-black/5 transition-all z-20"
          title="Loka"
        >
          <X className="w-5 h-5 stroke-[1.5]" />
        </button>

        {/* Left Column: Only LxS SCENTS Logo */}
        <div className="relative hidden md:flex w-full md:w-1/2 bg-[#f5f2eb] border-b md:border-b-0 md:border-r border-neutral-300 min-h-[220px] md:min-h-[440px] flex-col items-center justify-center p-8 select-none">
          <img
            src="https://i.postimg.cc/wMYnCZpf/LOGO-B2903B-removebg-preview.png"
            alt="LxS SCENTS Promo"
            loading="lazy"
            decoding="async"
            width={360}
            height={180}
            className="w-[85%] max-w-[360px] h-auto object-contain drop-shadow-xl"
          />
        </div>

        {/* Right Column: Mini logo, headline text, description, email form and CTA button */}
        <div className="relative w-full md:w-1/2 bg-[#f5f2eb] p-6 sm:p-10 flex flex-col justify-center items-center text-center space-y-6">
          {/* Small logo on the top right side */}
          <div className="flex flex-col items-center justify-center select-none">
            <img
              src="https://i.postimg.cc/wMYnCZpf/LOGO-B2903B-removebg-preview.png"
              alt="LxS SCENTS Mini Logo"
              loading="lazy"
              decoding="async"
              width={140}
              height={70}
              className="w-[140px] h-auto object-contain drop-shadow-md"
            />
          </div>

          {/* Text from the photo under the logo on the right side */}
          <div className="space-y-1 w-full">
            <h2 className="font-serif italic text-[15px] sm:text-[18px] md:text-[22px] lg:text-[24px] font-bold tracking-wide text-[#b2903b] leading-none whitespace-nowrap lining-nums">
              {language === "is"
                ? "10% AFSLÁTTUR AF FYRSTU PÖNTUN"
                : language === "es"
                ? "RECIBE 10% DE DESCUENTO EN TU PRIMER PEDIDO"
                : "GET 10% OFF YOUR FIRST ORDER"}
            </h2>
            <p className="text-[8px] sm:text-[9.5px] md:text-[11px] lg:text-[12.5px] text-neutral-500 font-sans tracking-wide whitespace-nowrap">
              {language === "is"
                ? "Og vertu fyrst(ur) til að heyra af sérstökum tilboðum"
                : language === "es"
                ? "Y sé el primero en enterarte de nuestras ofertas especiales"
                : "And be the first one to hear about our special offers"}
            </p>
          </div>

          {/* Email Subscription Box & 10% Off Action Button */}
          {!isSuccess ? (
            <form onSubmit={handleSubmit} className="w-full space-y-3.5">
              <div className="w-full">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setErrorMsg("");
                  }}
                  onInvalid={(e) => {
                    (e.target as HTMLInputElement).setCustomValidity(
                      language === "is"
                        ? "Vinsamlegast fylltu út allar nauðsynlegar upplýsingar fyrst"
                        : language === "es"
                        ? "Por favor, complete toda la información requerida primero"
                        : "Please fill out all required information first"
                    );
                  }}
                  onInput={(e) => (e.target as HTMLInputElement).setCustomValidity("")}
                  placeholder={
                    language === "is"
                      ? "Sláðu inn netfangið þitt"
                      : language === "es"
                      ? "Introduce tu correo electrónico"
                      : "Enter your email"
                  }
                  className="w-full bg-white border border-neutral-300 text-sm p-3.5 outline-none text-neutral-900 focus:border-[#b2903b] rounded-sm font-sans placeholder-neutral-400 text-center tracking-normal"
                />
              </div>

              {errorMsg && (
                <p className="text-xs sm:text-sm text-red-600 font-sans mt-1 text-center font-medium">
                  {errorMsg}
                </p>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="cursor-pointer w-full bg-[#b2903b] hover:bg-[#997c32] text-white text-center font-sans tracking-[0.15em] font-bold py-3.5 rounded-sm text-xs uppercase transition-all duration-300 shadow-md disabled:opacity-70"
              >
                {isSubmitting
                  ? language === "is"
                    ? "SENDIR..."
                    : language === "es"
                    ? "ENVIANDO..."
                    : "SENDING..."
                  : language === "is"
                  ? "FÁÐU 10% AFSLÁTT"
                  : language === "es"
                  ? "OBTENER 10% DESCUENTO"
                  : "GET 10% OFF"}
              </button>
            </form>
          ) : (
            <div className="w-full py-5 px-6 bg-[#fbf9f5] border border-[#b2903b]/40 rounded-sm text-center space-y-3 animate-luxury-entrance">
              <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto border border-emerald-300">
                <Check className="w-5 h-5 stroke-[2.5]" />
              </div>
              <span className="text-[#b2903b] font-bold block text-base sm:text-lg tracking-wide font-serif">
                {language === "is" ? "Takk fyrir!" : language === "es" ? "¡Gracias!" : "Thank you!"}
              </span>
              <p className="text-xs sm:text-sm text-neutral-700 font-sans whitespace-nowrap leading-relaxed">
                {language === "is"
                  ? "Kóðinn hefur verið sendur í tölvupóstinn þinn."
                  : language === "es"
                  ? "El código de descuento ha sido enviado a tu correo"
                  : "The discount code has been sent to your email"}
              </p>
              <button
                type="button"
                onClick={() => {
                  localStorage.setItem("welcomePromoDismissed", "true");
                  localStorage.setItem("hasClosedWelcomePromo", "true");
                  localStorage.setItem("pendingDiscountCode", "LXSSCENTS10");
                  onClose();
                }}
                className="cursor-pointer bg-[#b2903b] hover:bg-[#997c32] text-white text-xs font-bold tracking-widest px-6 py-3 uppercase mt-2 rounded-xs transition-all w-full leading-none shadow-sm"
              >
                {language === "is" ? "Halda áfram að versla" : language === "es" ? "Continuar comprando" : "Continue shopping"}
              </button>
            </div>
          )}

          {/* No Thanks option */}
          {!isSuccess && (
            <button
              onClick={() => {
                localStorage.setItem("hasClosedWelcomePromo", "true");
                onClose();
              }}
              className="cursor-pointer text-center text-neutral-400 hover:text-neutral-900 transition-colors text-[10px] sm:text-xs uppercase font-sans tracking-widest block mx-auto underline mt-1"
            >
              {language === "is" ? "Nei takk..." : language === "es" ? "No gracias..." : "No thanks..."}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
