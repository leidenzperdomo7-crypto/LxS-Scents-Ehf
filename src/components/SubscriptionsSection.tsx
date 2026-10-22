import { useState } from "react";
import { CheckCircle } from "lucide-react";
import { Fragrance } from "../types";
import { Language } from "../translations";

interface SubscriptionsSectionProps {
  language: Language;
  onAddToCart: (fragrance: Fragrance) => void;
  onOpenCart: () => void;
}

export default function SubscriptionsSection({
  language,
  onAddToCart,
  onOpenCart,
}: SubscriptionsSectionProps) {
  const [toastMessage, setToastMessage] = useState<string>("");

  const handleSelectTier = (tierKey: string, tierName: string) => {
    localStorage.setItem("user_ilmklubbur_tier", tierKey);
    localStorage.setItem("user_isKloneMember", "true");

    if (tierKey === "diamond") {
      const diamondProduct: Fragrance = {
        id: "subscription-diamond",
        name: language === "is" ? "DEMANTS ÁSKRIFT" : "DIAMOND Membership",
        tagline: language === "is" ? "Mánaðarleg áskrift - Ilmklúbburinn VIP" : "Monthly Membership - Scent Club VIP",
        price: 990,
        size: language === "is" ? "1 mánuður" : "1 month",
        concentration: language === "is" ? "Áskrift" : "Membership",
        classification: language === "is" ? "Mánaðarleg áskrift" : "Monthly Membership",
        description:
          language === "is"
            ? "Sértilboð fyrir meðlimi, frí heimsending samkvæmt skilmálum, 2x punktasöfnun með kaupum, 48klst fyrri aðgangur að nýjum vörum, sérstök DEMANTS afmælisgjöf og aðgangur að sérstökum DEMANTS-vörupökkum."
            : "Special member offers, free delivery according to terms, 2x points on purchases, 48h early access to new releases, special DIAMOND birthday gift, and access to exclusive DIAMOND bundles.",
        image: "https://i.postimg.cc/wMYnCZpf/LOGO-B2903B-removebg-preview.png",
        topNotes: [],
        heartNotes: [],
        baseNotes: [],
        season: "Allar árstíðir",
        sillage: "VIP",
        color: "#b2903b",
        secondaryColor: "#1c1b18",
      };
      onAddToCart(diamondProduct);
      onOpenCart();
    } else if (tierKey === "gold") {
      const goldProduct: Fragrance = {
        id: "subscription-gold",
        name: language === "is" ? "GULL ÁSKRIFT" : "GOLD Membership",
        tagline: language === "is" ? "Mánaðarleg áskrift - Ilmklúbburinn VIP" : "Monthly Membership - Scent Club VIP",
        price: 1490,
        size: language === "is" ? "1 mánuður" : "1 month",
        concentration: language === "is" ? "Áskrift" : "Membership",
        classification: language === "is" ? "Mánaðarleg áskrift" : "Monthly Membership",
        description:
          language === "is"
            ? "Fyrir þá sem vilja það allra besta úr hverri pöntun. Sértilboð fyrir meðlimi, frí heimsending samkvæmt skilmálum, 3x punktasöfnun með kaupum, 72klst fyrri aðgangur að nýjum vörum, fyrri aðgangur að Limited Edition vörum, forgangur að restock þegar vara kemur aftur, sérstök GULL afmælisgjöf og aðgangur að sérstökum GULL-vörupökkum."
            : "For those who want the absolute best. Special member offers, free delivery according to terms, 3x points on purchases, 72h early access to new releases, priority restock access, special GOLD birthday gift, and access to exclusive GOLD bundles.",
        image: "https://i.postimg.cc/wMYnCZpf/LOGO-B2903B-removebg-preview.png",
        topNotes: [],
        heartNotes: [],
        baseNotes: [],
        season: "Allar árstíðir",
        sillage: "VIP Exclusive",
        color: "#d4af37",
        secondaryColor: "#1c1b18",
      };
      onAddToCart(goldProduct);
      onOpenCart();
    }

    const tierDisplayName = language === "is" ? tierName : (tierKey === "diamond" ? "DIAMOND Membership" : tierKey === "gold" ? "GOLD Membership" : "FREE Membership");
    const msg =
      language === "is"
        ? tierKey === "free"
          ? `Til hamingju! Þú ert nú skráð(ur) í ${tierName}.`
          : `${tierName} hefur verið bætt í körfuna!`
        : tierKey === "free"
        ? `Congratulations! You are now enrolled in ${tierDisplayName}.`
        : `${tierDisplayName} added to your cart!`;
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 4000);
  };

  return (
    <section id="askriftir-section" className="w-full relative scroll-mt-20">
      {/* Top Signature Gold Banner */}
      <div className="w-full bg-[#b2903b] pt-5 sm:pt-20 pb-5 sm:pb-16 px-4 sm:px-6 text-center shadow-xs flex flex-col items-center justify-center">
        <div className="max-w-4xl mx-auto flex flex-col items-center justify-center text-center">
          {/* Title */}
          <h2 className="text-xl sm:text-4xl md:text-5xl font-serif font-bold text-white tracking-tight mb-2 sm:mb-5 text-center mt-0 sm:mt-3">
            {language === "is"
              ? "Vertu hluti af ilmklúbbnum"
              : language === "es"
              ? "Sé parte del club de aromas"
              : "Be part of the Scent Club"}
          </h2>

          {/* Subtitle with distinct paragraphs */}
          <div className="text-white/95 text-[9px] sm:text-sm md:text-base max-w-4xl mx-auto leading-relaxed space-y-1 sm:space-y-2.5 font-normal text-center flex flex-col items-center">
            <p className="font-semibold text-[10px] sm:text-lg md:text-xl text-white text-center tracking-wide">
              {language === "is"
                ? "Meiri ilmur. Meiri fríðindi. Meiri upplifun."
                : language === "es"
                ? "Más fragancia. Más beneficios. Más experiencia."
                : "More scent. More benefits. More experience."}
            </p>
            <p className="text-center text-[9px] sm:text-sm md:text-base">
              {language === "is"
                ? "Skráðu þig í ÓKEYPIS áskrift og njóttu sértilboða og punktasöfnunar með kaupum"
                : language === "es"
                ? "Regístrese para obtener una membresía gratuita y disfrute de ofertas especiales y acumulación de puntos con las compras."
                : "Sign up for a FREE membership and enjoy special offers and points earning with purchases."}
            </p>
            
            {/* Bold font for "Want even more?" */}
            <p className="text-center font-bold text-[10.5px] sm:text-lg md:text-xl text-white tracking-wide">
              {language === "is"
                ? "Viltu enn meira?"
                : language === "es"
                ? "¿Quieres aún más?"
                : "Want even more?"}
            </p>
            
            <p className="text-center text-[9px] sm:text-sm md:text-base lg:whitespace-nowrap">
              {language === "is" ? (
                "Uppfærðu í DEMANTS- eða GULL-áskrift og njóttu fleiri sérstakra fríðinda gegn lágu mánaðargjaldi."
              ) : language === "es" ? (
                "Actualice a Membresía Diamante o Membresía Oro y disfrute de beneficios selectos por una tarifa mensual módica."
              ) : (
                <>
                  <span className="whitespace-nowrap">Upgrade to DIAMOND</span> or{" "}
                  <span className="whitespace-nowrap">GOLD membership</span> and enjoy more exclusive benefits for a small monthly fee.
                </>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Benefits Section: ÁSKRIFTIR */}
      <div className="w-full bg-[#fbf9f5] py-10 sm:py-20 px-3 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <h3 className="text-xl sm:text-3xl font-serif font-bold text-neutral-950 text-center mb-6 sm:mb-10 tracking-wider uppercase">
            {language === "is" ? "ÁSKRIFTIR" : language === "es" ? "SUSCRIPCIONES" : "MEMBERSHIP"}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6 items-stretch">
            {/* Card 1: ÓKEYPIS ÁSKRIFT */}
            <div className="bg-white border border-neutral-200/90 rounded-2xl p-5 sm:p-6 lg:p-7 flex flex-col justify-between text-left shadow-xs hover:border-[#b2903b]/40 transition-all">
              <div>
                <div className="border-b border-neutral-100 pb-3 sm:pb-4 mb-4 sm:mb-5">
                  <h4 className="font-bold text-lg sm:text-2xl text-neutral-950 tracking-tight">
                    {language === "is" ? "ÓKEYPIS ÁSKRIFT" : language === "es" ? "MEMBRESÍA GRATUITA" : "FREE MEMBERSHIP"}
                  </h4>
                </div>

                <ul className="space-y-2.5 sm:space-y-3 text-[11px] sm:text-sm text-neutral-700 leading-snug">
                  <li className="flex items-start gap-2 sm:gap-2.5">
                    <span className="text-[#b2903b] font-bold shrink-0">✓</span>
                    <span>{language === "is" ? "Sértilboð fyrir meðlimi" : "Special offers for members"}</span>
                  </li>
                  <li className="flex items-start gap-2 sm:gap-2.5">
                    <span className="text-[#b2903b] font-bold shrink-0">✓</span>
                    <span>{language === "is" ? "Punktasöfnun með kaupum" : "Points earned on purchases"}</span>
                  </li>
                  <li className="flex items-start gap-2 sm:gap-2.5">
                    <span className="text-[#b2903b] font-bold shrink-0">✓</span>
                    <span>{language === "is" ? "Fyrstur að frétta af nýjum ilmum" : "First to know about new fragrances"}</span>
                  </li>
                  <li className="flex items-start gap-2 sm:gap-2.5">
                    <span className="text-[#b2903b] font-bold shrink-0">✓</span>
                    <span>{language === "is" ? "Afmælisafsláttur" : "Birthday discount"}</span>
                  </li>
                </ul>
              </div>

              <div className="pt-6 sm:pt-8 mt-5 sm:mt-6 border-t border-neutral-100 flex flex-col items-start gap-2 sm:gap-3">
                <span className="text-[11px] sm:text-xs font-semibold text-neutral-400">
                  {language === "is" ? "0 kr. / mánuði" : "0 kr. / month"}
                </span>
                <button
                  type="button"
                  onClick={() => handleSelectTier("free", language === "is" ? "ÓKEYPIS ÁSKRIFT" : "FREE Membership")}
                  className="cursor-pointer text-[11px] sm:text-sm font-bold text-[#b2903b] hover:text-[#997c32] underline underline-offset-4 tracking-wider uppercase transition-colors"
                >
                  {language === "is" ? "SKRÁ MIG ÓKEYPIS" : "SIGN UP FOR FREE"}
                </button>
              </div>
            </div>

            {/* Card 2: DEMANTS ÁSKRIFT */}
            <div className="bg-white border-2 border-[#b2903b]/40 rounded-2xl p-5 sm:p-6 lg:p-7 flex flex-col justify-between text-left shadow-md hover:border-[#b2903b] transition-all relative">
              <div className="absolute -top-3 right-6 bg-[#b2903b] text-white text-[9px] sm:text-[10px] font-mono uppercase tracking-widest px-2.5 py-0.5 sm:px-3 rounded-full font-bold">
                {language === "is" ? "VINSÆLAST" : "MOST POPULAR"}
              </div>
              <div>
                <div className="border-b border-neutral-100 pb-3 sm:pb-4 mb-3 sm:mb-4">
                  <h4 className="font-bold text-lg sm:text-2xl text-neutral-950 tracking-tight">
                    {language === "is" ? "DEMANTS ÁSKRIFT" : "DIAMOND Membership"}
                  </h4>
                </div>

                <p className="text-[10px] sm:text-xs lg:text-[12px] xl:text-[13px] text-neutral-800 mb-4 sm:mb-5 leading-normal font-sans font-bold whitespace-nowrap tracking-tight">
                  {language === "is"
                    ? "Fyrir þá sem vilja fá meira út úr hverri pöntun"
                    : "For those who want to get more out of every order"}
                </p>

                <ul className="space-y-2.5 sm:space-y-3 text-[11px] sm:text-sm text-neutral-700 leading-snug">
                  <li className="flex items-start gap-2 sm:gap-2.5">
                    <span className="text-[#b2903b] font-bold shrink-0">✓</span>
                    <span>{language === "is" ? "Sértilboð fyrir meðlimi" : "Special offers for members"}</span>
                  </li>
                  <li className="flex items-start gap-2 sm:gap-2.5">
                    <span className="text-[#b2903b] font-bold shrink-0">✓</span>
                    <span>{language === "is" ? "Frí heimsending samkvæmt skilmálum" : "Free home delivery according to terms"}</span>
                  </li>
                  <li className="flex items-start gap-2 sm:gap-2.5">
                    <span className="text-[#b2903b] font-bold shrink-0">✓</span>
                    <span>{language === "is" ? "2x punktasöfnun með kaupum" : "2x points earned on purchases"}</span>
                  </li>
                  <li className="flex items-start gap-2 sm:gap-2.5">
                    <span className="text-[#b2903b] font-bold shrink-0">✓</span>
                    <span>{language === "is" ? "48klst fyrri aðgangur að nýjum vörum" : "48h early access to new products"}</span>
                  </li>
                  <li className="flex items-start gap-2 sm:gap-2.5">
                    <span className="text-[#b2903b] font-bold shrink-0">✓</span>
                    <span>{language === "is" ? "Sérstök DEMANTS afmælisgjöf" : "Special DIAMOND birthday gift"}</span>
                  </li>
                  <li className="flex items-start gap-2 sm:gap-2.5">
                    <span className="text-[#b2903b] font-bold shrink-0">✓</span>
                    <span>{language === "is" ? "Aðgangur að sérstökum DEMANTS-vörupökkum" : "Access to exclusive DIAMOND-bundles"}</span>
                  </li>
                  <li className="flex items-start gap-2 sm:gap-2.5">
                    <span className="text-[#b2903b] font-bold shrink-0">✓</span>
                    <span>{language === "is" ? "Enginn binditími, hægt að segja upp hvenær sem er" : "No Commitment. Cancel anytime"}</span>
                  </li>
                </ul>
              </div>

              <div className="pt-6 sm:pt-8 mt-5 sm:mt-6 border-t border-neutral-100 flex flex-col items-start gap-2 sm:gap-3">
                <div className="text-[11px] sm:text-sm font-semibold text-neutral-800">
                  {language === "is" ? "Aðeins 990kr.- á mánuði" : "Only 990kr.- per month"}
                </div>
                <button
                  type="button"
                  onClick={() => handleSelectTier("diamond", language === "is" ? "DEMANTS ÁSKRIFT" : "DIAMOND Membership")}
                  className="cursor-pointer text-[11px] sm:text-sm font-bold text-[#b2903b] hover:text-[#997c32] underline underline-offset-4 tracking-wider uppercase transition-colors"
                >
                  {language === "is" ? "GERAST DEMANTS MEÐLIMUR" : "BECOME DIAMOND MEMBER"}
                </button>
              </div>
            </div>

            {/* Card 3: GULL ÁSKRIFT - without "-" in GULL meðlimur */}
            <div className="bg-white border border-neutral-200/90 rounded-2xl p-5 sm:p-6 lg:p-7 flex flex-col justify-between text-left shadow-xs hover:border-[#b2903b]/40 transition-all">
              <div>
                <div className="border-b border-neutral-100 pb-3 sm:pb-4 mb-3 sm:mb-4">
                  <h4 className="font-bold text-lg sm:text-2xl text-neutral-950 tracking-tight">
                    {language === "is" ? "GULL ÁSKRIFT" : "GOLD Membership"}
                  </h4>
                </div>

                <p className="text-[10px] sm:text-xs lg:text-[12px] xl:text-[13px] text-neutral-800 mb-4 sm:mb-5 leading-normal font-sans font-bold whitespace-nowrap tracking-tight">
                  {language === "is"
                    ? "Fyrir þá sem vilja það allra besta úr hverri pöntun"
                    : "For those who want the very best out of every order"}
                </p>

                <ul className="space-y-2.5 sm:space-y-3 text-[11px] sm:text-sm text-neutral-700 leading-snug">
                  <li className="flex items-start gap-2 sm:gap-2.5">
                    <span className="text-[#b2903b] font-bold shrink-0">✓</span>
                    <span>{language === "is" ? "Sértilboð fyrir meðlimi" : "Special offers for members"}</span>
                  </li>
                  <li className="flex items-start gap-2 sm:gap-2.5">
                    <span className="text-[#b2903b] font-bold shrink-0">✓</span>
                    <span>{language === "is" ? "Frí heimsending samkvæmt skilmálum" : "Free home delivery according to terms"}</span>
                  </li>
                  <li className="flex items-start gap-2 sm:gap-2.5">
                    <span className="text-[#b2903b] font-bold shrink-0">✓</span>
                    <span>{language === "is" ? "3x punktasöfnun með kaupum" : "3x points earned on purchases"}</span>
                  </li>
                  <li className="flex items-start gap-2 sm:gap-2.5">
                    <span className="text-[#b2903b] font-bold shrink-0">✓</span>
                    <span>{language === "is" ? "72klst fyrri aðgangur að nýjum vörum" : "72h early access to new products"}</span>
                  </li>
                  <li className="flex items-start gap-2 sm:gap-2.5">
                    <span className="text-[#b2903b] font-bold shrink-0">✓</span>
                    <span>{language === "is" ? "Fyrri aðgangur að Limited Edition vörum" : "Early access to Limited Edition products"}</span>
                  </li>
                  <li className="flex items-start gap-2 sm:gap-2.5">
                    <span className="text-[#b2903b] font-bold shrink-0">✓</span>
                    <span>{language === "is" ? "Forgangur að restock þegar vara kemur aftur" : "Priority for restocks when products return"}</span>
                  </li>
                  <li className="flex items-start gap-2 sm:gap-2.5">
                    <span className="text-[#b2903b] font-bold shrink-0">✓</span>
                    <span>{language === "is" ? "Sérstök GULL afmælisgjöf" : "Special GOLD birthday gift"}</span>
                  </li>
                  <li className="flex items-start gap-2 sm:gap-2.5">
                    <span className="text-[#b2903b] font-bold shrink-0">✓</span>
                    <span>{language === "is" ? "Aðgangur að sérstökum GULL-vörupökkum" : "Access to exclusive GOLD-bundles"}</span>
                  </li>
                  <li className="flex items-start gap-2 sm:gap-2.5">
                    <span className="text-[#b2903b] font-bold shrink-0">✓</span>
                    <span>{language === "is" ? "Enginn binditími, hægt að segja upp hvenær sem er" : "No Commitment. Cancel anytime"}</span>
                  </li>
                </ul>
              </div>

              <div className="pt-6 sm:pt-8 mt-5 sm:mt-6 border-t border-neutral-100 flex flex-col items-start gap-2 sm:gap-3">
                <div className="text-[11px] sm:text-sm font-semibold text-neutral-800">
                  {language === "is" ? "Aðeins 1.490kr.- á mánuði" : "Only 1.490kr.- per month"}
                </div>
                <button
                  type="button"
                  onClick={() => handleSelectTier("gold", language === "is" ? "GULL ÁSKRIFT" : "GOLD Membership")}
                  className="cursor-pointer text-[11px] sm:text-sm font-bold text-[#b2903b] hover:text-[#997c32] underline underline-offset-4 tracking-wider uppercase transition-colors"
                >
                  {language === "is" ? "GERAST GULL MEÐLIMUR" : "BECOME GOLD MEMBER"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating notification toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-neutral-950 text-white border border-neutral-800 px-5 py-3 rounded-lg shadow-xl text-xs sm:text-sm flex items-center gap-2 animate-bounce">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}
    </section>
  );
}
