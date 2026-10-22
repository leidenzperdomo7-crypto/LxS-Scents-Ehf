import React, { useState, FormEvent } from "react";
import { ArrowLeft, Check } from "lucide-react";
import { Language, TRANSLATIONS } from "../translations";
import emailjs from "@emailjs/browser";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";
import { getEmailJsConfig } from "../emailPromo";

interface ContactPageProps {
  language: Language;
  userEmail?: string;
  onBackToBoutique?: () => void;
  onBackToCollection?: () => void;
}

export default function ContactPage({
  language,
  userEmail = "",
  onBackToBoutique,
  onBackToCollection
}: ContactPageProps) {
  const [formData, setFormData] = useState({
    fullName: "",
    email: userEmail,
    message: ""
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const t = TRANSLATIONS[language];

  const formT: Record<Language, any> = {
    en: {
      title: "CAN'T FIND YOUR SCENT?",
      subtitle: "Send us a line",
      fullName: "Full name",
      email: "Email",
      message: "Perfume name & brand",
      messageLabel: "Which perfume do you want us to sell?",
      btnCreate: "Submit",
      btnCreating: "Submitting...",
      successTitle: "Thank you for the suggestion!",
      successLine2: "We're always open to new ideas.",
      successLine3: "Who knows what comes next?",
      backBtn: "Back to Collection",
    },
    is: {
      title: "FINNURÐU EKKI ILMINN ÞINN?",
      subtitle: "Sendu okkur línu",
      fullName: "Fullt nafn",
      email: "Netfang",
      message: "Nafn á ilm & framleiðanda",
      messageLabel: "Hvaða ilm vilt þú fá í sölu?",
      btnCreate: "Senda inn",
      btnCreating: "Sendir...",
      successTitle: "Takk fyrir ábendinguna!",
      successLine2: "Við erum alltaf opin fyrir nýjum hugmyndum.",
      successLine3: "Hver veit hvað kemur næst?",
      backBtn: "Til baka í vöruúrval",
    },
    es: {
      title: "¿NO ENCUENTRAS TU AROMA?",
      subtitle: "Envíanos un mensaje",
      fullName: "Nombre completo",
      email: "Correo electrónico",
      message: "Nombre del perfume y fabricante",
      messageLabel: "¿Qué perfume quieres que vendamos?",
      btnCreate: "Enviar",
      btnCreating: "Enviando...",
      successTitle: "¡Gracias por la sugerencia!",
      successLine2: "Siempre estamos abiertos a nuevas ideas.",
      successLine3: "¿Quién sabe qué vendrá después?",
      backBtn: "Volver a la colección",
    }
  };

  const ct = formT[language] || formT.en;

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const getRequiredMsg = () => {
    if (language === "is") return "Vinsamlegast fylltu út allar nauðsynlegar upplýsingar fyrst";
    if (language === "es") return "Por favor, complete toda la información requerida primero";
    return "Please fill out all required information first";
  };

  const handleInvalid = (e: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    (e.target as HTMLInputElement).setCustomValidity(getRequiredMsg());
  };

  const handleClear = (e: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    (e.target as HTMLInputElement).setCustomValidity("");
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);

    const userName = formData.fullName.trim();
    const userEmailVal = formData.email.trim();
    const fragranceName = formData.message.trim();

    // a) Guarda en Firestore en la colección 'scent_wishes'
    try {
      await addDoc(collection(db, "scent_wishes"), {
        userName,
        userEmail: userEmailVal,
        fragranceName,
        createdAt: serverTimestamp()
      });
    } catch (err) {
      console.warn("Could not save scent wish to Firestore:", err);
    }

    // b) Envía la notificación con EmailJS usando: Service ID: 'service_k8k3rsu', Template ID: 'template_m2qpxr5'
    try {
      const emailConfig = getEmailJsConfig();
      await emailjs.send(
        "service_k8k3rsu",
        "template_m2qpxr5",
        {
          scent_name: fragranceName,
          user_email: userEmailVal,
          user_notes: userName
        },
        emailConfig.PUBLIC_KEY
      );
    } catch (err) {
      console.warn("EmailJS scent wish notification warning:", err);
    }

    // c) Tras el envío, muestra: "Takk fyrir ábendinguna! Við skoðum þennan ilm."
    setIsSubmitting(false);
    setIsSubmitted(true);
  };

  return (
    <div id="contact-page-view" className="min-h-screen md:h-screen md:max-h-screen md:overflow-hidden bg-[#f9f8f4] relative flex flex-col justify-start md:justify-center items-center pt-20 md:pt-[145px] pb-6 md:pb-6">
      <div className="max-w-2xl w-full mx-auto px-6 relative z-10 space-y-4 md:space-y-4 my-auto md:my-0">
        
        {!isSubmitted ? (
          <div className="space-y-4 md:space-y-4 animate-luxury-entrance">
            <div className="text-center space-y-1 md:space-y-1.5">
              <h1 className="font-serif text-[15px] sm:text-[22px] md:text-[26px] tracking-[0.1em] text-[#b2903b] uppercase">
                {ct.title}
              </h1>
              <p className="font-serif text-[13px] sm:text-[16px] md:text-[18px] tracking-wide text-[#b2903b]">
                {ct.subtitle}
              </p>
            </div>

            {/* Registration Form */}
            <form
              id="registration-form"
              onSubmit={handleSubmit}
              className="space-y-3 md:space-y-3.5 max-w-[460px] mx-auto w-full"
            >
              <div className="flex flex-col gap-y-2.5 md:gap-y-3">
                
                <div className="space-y-0.5 md:space-y-1 text-left">
                  <label className="block text-[10px] sm:text-[13px] font-medium text-[#4c4a45] pl-1">{ct.fullName}</label>
                  <input
                    type="text"
                    name="fullName"
                    required
                    value={formData.fullName}
                    onChange={handleChange}
                    onInvalid={handleInvalid}
                    onInput={handleClear}
                    placeholder={ct.fullName + " *"}
                    className="w-full bg-white border border-[#d2ceca] rounded-md px-2.5 py-1.5 md:px-3.5 md:py-2 text-[11px] sm:text-[13px] font-sans text-neutral-800 outline-none focus:border-[#b2903b] placeholder:text-neutral-500"
                  />
                </div>

                <div className="space-y-0.5 md:space-y-1 text-left">
                  <label className="block text-[10px] sm:text-[13px] font-medium text-[#4c4a45] pl-1">{ct.email}</label>
                  <input
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    onInvalid={handleInvalid}
                    onInput={handleClear}
                    placeholder={ct.email + " *"}
                    className="w-full bg-white border border-[#d2ceca] rounded-md px-2.5 py-1.5 md:px-3.5 md:py-2 text-[11px] sm:text-[13px] font-sans text-neutral-800 outline-none focus:border-[#b2903b] placeholder:text-neutral-500"
                  />
                </div>

                <div className="space-y-0.5 md:space-y-1 text-left">
                  <label className="block text-[10px] sm:text-[13px] font-medium text-[#4c4a45] pl-1">{ct.messageLabel}</label>
                  <textarea
                    name="message"
                    required
                    rows={3}
                    value={formData.message}
                    onChange={handleChange}
                    onInvalid={handleInvalid}
                    onInput={handleClear}
                    placeholder={ct.message + " *"}
                    className="w-full bg-white border border-[#d2ceca] rounded-md px-2.5 py-1.5 md:px-3.5 md:py-2 text-[11px] sm:text-[13px] font-sans text-neutral-800 outline-none focus:border-[#b2903b] placeholder:text-neutral-500 resize-none md:h-[75px]"
                  />
                </div>
              </div>

              <div className="flex flex-col items-center space-y-2 md:space-y-3 pt-1 md:pt-2">
                <button
                  id="submit-register-btn"
                  type="submit"
                  disabled={isSubmitting}
                  className="cursor-pointer w-full max-w-[200px] md:max-w-[240px] bg-[#b99849] hover:bg-[#a6863d] text-white py-2 md:py-2.5 font-sans font-bold text-xs md:text-sm rounded-md transition-all duration-300"
                >
                  {isSubmitting ? ct.btnCreating : ct.btnCreate}
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="space-y-6 sm:space-y-8 animate-luxury-entrance max-w-lg mx-auto text-center py-6">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full border-2 border-[#b2903b] text-[#b2903b] flex items-center justify-center mx-auto mb-4 sm:mb-6 bg-white shadow-sm">
              <Check className="w-7 h-7 sm:w-8 sm:h-8 stroke-[1.5]" />
            </div>
            <div className="space-y-3">
              <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl text-[#1c1b18] font-normal tracking-wide">
                {ct.successTitle}
              </h2>
              <p className="font-serif italic text-lg sm:text-xl md:text-2xl text-[#b2903b] font-light">
                {ct.successLine2}
              </p>
              <p className="font-sans text-sm sm:text-base text-[#4c4a45] font-normal tracking-wider">
                {ct.successLine3}
              </p>
            </div>

            <div className="flex justify-center mt-8 sm:mt-12">
              <button
                onClick={onBackToCollection || onBackToBoutique}
                className="cursor-pointer bg-[#b99849] hover:bg-[#a6863d] text-white py-3 px-8 sm:py-3.5 sm:px-10 font-sans font-bold text-xs sm:text-sm uppercase tracking-[0.15em] sm:tracking-[0.2em] rounded-sm transition-all duration-300 shadow-md hover:shadow-[0_4px_15px_rgba(178,144,59,0.3)]"
              >
                {ct.backBtn}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
