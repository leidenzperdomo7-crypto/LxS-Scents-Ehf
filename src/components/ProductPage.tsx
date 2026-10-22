import { ShoppingBag, ArrowLeft, Plus, Minus } from "lucide-react";
import { useState } from "react";
import { Fragrance, CartItem } from "../types";
import { getBoutiquePrice, getInspiredByShort } from "../data";
import { Language, TRANSLATIONS } from "../translations";

interface ProductPageProps {
  product: Fragrance;
  language: Language;
  onBack: () => void;
  onAddToCart: (fragrance: Fragrance) => void;
}

export default function ProductPage({
  product,
  language,
  onBack,
  onAddToCart,
}: ProductPageProps) {
  const t = TRANSLATIONS[language];
  const [openAccordion, setOpenAccordion] = useState<string | null>(null);

  const toggleAccordion = (id: string) => {
    setOpenAccordion(openAccordion === id ? null : id);
  };

  const isGentlemen = product.gender === "homme";
  const bgClass = isGentlemen ? "bg-[#0a0a09] text-[#f5f2eb]" : "bg-[#f5f2eb] text-[#1c1b18]";
  const primaryTextClass = isGentlemen ? "text-[#f5f2eb]" : "text-[#1c1b18]";
  const secondaryTextClass = isGentlemen ? "text-[#b5b1a9]" : "text-[#4c4a45]";
  const accentClass = "text-[#8c7447]";
  const buttonBackClass = "bg-gold-500 text-white hover:bg-gold-600 border-gold-500";

  const accordionItems = [
    {
      id: "description",
      title: language === 'is' ? "Ilmtónar" : language === 'es' ? "Notas Olfativas" : "Scent Notes",
      content: (
        <div className="space-y-6">
          <div className="space-y-4 pt-1">
            <div>
              <strong className="block text-xs uppercase tracking-widest mb-1">
                {language === 'is' ? "Topptónar" : language === 'es' ? "Notas de Salida" : "Top Notes"}
              </strong>
              <p className="text-sm">{product.topNotes.join(', ')}</p>
            </div>
            <div>
              <strong className="block text-xs uppercase tracking-widest mb-1">
                {language === 'is' ? "Hjartatónar" : language === 'es' ? "Notas de Corazón" : "Heart Notes"}
              </strong>
              <p className="text-sm">{product.heartNotes.join(', ')}</p>
            </div>
            <div>
              <strong className="block text-xs uppercase tracking-widest mb-1">
                {language === 'is' ? "Grunntónar" : language === 'es' ? "Notas de Fondo" : "Base Notes"}
              </strong>
              <p className="text-sm">{product.baseNotes.join(', ')}</p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: "ingredients",
      title: language === 'is' ? "Innihaldsefni" : language === 'es' ? "Ingredientes" : "Ingredients",
      content: product.ingredients || "Alcohol Denat., Fragrance (Parfum), Water (Aqua), Linalool, Limonene, Citronellol, Geraniol, Coumarin, Benzyl Benzoate, Citral.",
    },
    {
      id: "disclaimer",
      title: language === 'is' ? "Fyrirvari" : language === 'es' ? "Aviso Legal" : "Disclaimer",
      content: (
        <div className="space-y-4">
          {language === 'is' ? (
            <>
              <p>Allir ilmir eru innblásnir af hönnunarmerkjum og tengjast þeim á engan hátt.</p>
              <p>LxS Scents er hvorki tengt, í samstarfi við, né stutt af neinum hönnunarmerkjum eða framleiðendum þeirra. Öll hönnuða- eða vörumerkjanöfn sem nefnd kunna að vera eru einungis notuð til samanburðar, til að auðvelda lýsingu á almennum ilmtónum og einkennum ilmsins. Slíkar tilvísanir gefa ekki í skyn neitt samstarf, kostun, leyfisveitingu eða stuðning af hálfu eiganda vörumerkisins.</p>
            </>
          ) : (
            <>
              <p>All fragrances are inspired by designer brands and are not affiliated with them in any way.</p>
              <p>LxS Scents is not associated with, affiliated with, or endorsed by any designer brands or their manufacturers. Any designer or brand names mentioned are used solely for comparison purposes, to help describe a fragrance&apos;s general scent profile and character. Such references do not imply any partnership, sponsorship, authorization, or endorsement by the trademark owner.</p>
            </>
          )}
        </div>
      ),
    },
    {
      id: "return",
      title: language === 'is' ? "Skilareglur" : language === 'es' ? "Política de Devolución" : "Return Policy",
      content: language === 'is' ? "Þú getur skilað vörum til okkar innan 10 daga frá því að þú færð þær afhentar. Til að fá vöruna endurgreidda þarf ilmvatnið að vera í upprunalegum umbúðum, alveg ónotað og innsiglið óbrotið. Um leið og við höfum tekið við vörunni, farið yfir hana og samþykkt vöruskil og endurgreiðslu, endurgreiðum við upphæðina að fullu á þann greiðslumiðil sem notaður var við kaupin. Það tekur venjulega 5-7 virka daga fyrir endurgreiðsluna að skila sér." : "We accept returns on eligible items within 10 days of the delivery date. The fragrance must be returned in its original packaging and in pristine condition, with the sticker fully intact. Once we receive and inspect your return, a full refund will be issued to your original form of payment within 5–7 business days.",
    }
  ];


  return (
    <div className={`min-h-screen ${bgClass} font-sans pt-32 pb-24 transition-colors duration-500 animate-luxury-entrance`}>
      <div className="max-w-7xl mx-auto px-6">
        <button
          onClick={onBack}
          className={`cursor-pointer mt-10 mb-12 flex items-center gap-2 px-5 py-2.5 rounded-sm border ${buttonBackClass} uppercase tracking-widest text-[9.5px] font-semibold transition-all shadow-sm`}
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>{language === 'is' ? 'AFTUR Í VÖRUÚRVAL' : language === 'es' ? 'Volver al catálogo' : 'Back to Collection'}</span>
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-20">
          {/* Image */}
          <div className={`relative rounded-sm overflow-hidden border border-gold-500/10 shadow-xl ${isGentlemen ? "bg-transparent" : "bg-[#f5f2eb]"} aspect-[4/5] flex items-center justify-center`}>
             <div
                className="absolute inset-0 opacity-20 pointer-events-none"
                style={{
                  background: `radial-gradient(circle at center, ${product.color} 0%, transparent 70%)`,
                }}
              />
            <img 
              src={product.image} 
              alt={product.name} 
              referrerPolicy="no-referrer"
              loading="eager"
              decoding="async"
              className={`w-full h-full object-cover z-10 relative`}
            />
          </div>

          {/* Details */}
          <div className="flex flex-col justify-center">
            <h1 className={`font-serif text-5xl md:text-6xl tracking-[0.1em] mb-4 ${primaryTextClass}`}>
              {product.name}
            </h1>

            <p className={`text-xl ${primaryTextClass} font-serif italic mb-6 tracking-wide whitespace-pre-line`}>
              {getInspiredByShort(product.id, language).replace(" - ", "\n")}
            </p>

            <div className={`font-sans text-xs tracking-[0.25em] font-semibold ${primaryTextClass} uppercase mb-4 flex flex-col gap-1`}>
              <span>• {product.concentration.toUpperCase()}</span>
              <span>• {product.size.toUpperCase()}</span>
            </div>

            <span className={`font-serif text-3xl mb-8 block ${primaryTextClass}`}>
              {getBoutiquePrice(product.id)}
            </span>

            <p className={`text-xl ${primaryTextClass} font-serif italic mb-10 tracking-wide`}>
              {language === 'is' ? 'Með hverri pöntun fylgir 2 ml prufa að gjöf, svo þú getir upplifað ilminn áður en varan er opnuð.' : 'Every purchase includes a complimentary 2ml sample, allowing you to experience the fragrance before unsealing the full-size bottle.'}
            </p>

            <div className={`flex flex-col mb-10 gap-[1px] ${isGentlemen ? "bg-[#2a2a28]" : "bg-[#fff]"} overflow-hidden rounded-sm`}>
              {accordionItems.map((item) => {
                const isOpen = openAccordion === item.id;
                return (
                  <div key={item.id} className={isGentlemen ? "bg-[#141311]" : "bg-[#edeae5]"}>
                    <button
                      onClick={() => toggleAccordion(item.id)}
                      className={`w-full py-4 px-5 flex justify-between items-center text-left ${primaryTextClass} font-bold transition-colors focus:outline-none`}
                    >
                      <span className="text-[14px] font-sans tracking-wide leading-none">{item.title}</span>
                      {isOpen ? <Minus className="w-4 h-4 ml-2 flex-shrink-0" /> : <Plus className="w-4 h-4 ml-2 flex-shrink-0" />}
                    </button>
                    <div
                      className={`overflow-hidden transition-all duration-300 ease-in-out ${
                        isOpen ? "max-h-[500px] opacity-100 pb-5 px-5" : "max-h-0 opacity-0 px-5"
                      }`}
                    >
                      <div className={`text-sm ${secondaryTextClass} leading-relaxed pt-1`}>
                        {item.content}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              onClick={() => onAddToCart(product)}
              className="cursor-pointer w-full bg-gold-500 hover:bg-gold-600 text-white font-sans tracking-[0.2em] font-semibold py-4 rounded-sm text-xs uppercase transition-all shadow-[0_6px_20px_rgba(178,144,59,0.25)] flex items-center justify-center gap-3"
            >
              <ShoppingBag className="w-4 h-4" />
              {t.addToBagBtn}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
