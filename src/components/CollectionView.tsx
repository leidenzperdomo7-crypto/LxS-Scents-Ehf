import { useState } from "react";
import { Sparkles, Filter } from "lucide-react";
import { Fragrance } from "../types";
import { FRAGRANCES, getInspiredByShort, getBoutiquePrice } from "../data";
import { Language, TRANSLATIONS } from "../translations";
import { IMAGES } from "../imageConfig";

interface CollectionViewProps {
  gender: "femme" | "homme";
  language: Language;
  onBack: () => void;
  onAddToCart: (fragrance: Fragrance) => void;
  onOpenRitual: (fragrance: Fragrance) => void;
  onProductClick: (fragrance: Fragrance) => void;
  searchQuery: string;
  onOpenContact: () => void;
}

export default function CollectionView({
  gender,
  language,
  onBack,
  onAddToCart,
  onOpenRitual,
  onProductClick,
  searchQuery,
  onOpenContact
}: CollectionViewProps) {
  const [selectedAura, setSelectedAura] = useState<string | null>(null);
  const t = TRANSLATIONS[language];

  const isGentlemen = gender === "homme";
  const bgClass = isGentlemen ? "bg-[#0a0a09] text-[#f5f2eb]" : "bg-[#f5f2eb] text-[#1c1b18]";
  const primaryTextClass = isGentlemen ? "text-[#f5f2eb]" : "text-[#1c1b18]";
  const secondaryTextClass = isGentlemen ? "text-[#b5b1a9]" : "text-[#4c4a45]";
  const cardBgClass = isGentlemen ? "bg-[#141311] border-[#24221f]" : "bg-[#f5f2eb] border-[#f5f2eb]";
  const cardImgBgClass = isGentlemen ? "bg-[#141311]" : "bg-[#f5f2eb]";
  const buttonBackClass = isGentlemen 
    ? "bg-[#141311] text-[#b5b1a9] hover:text-[#f5f2eb] hover:bg-[#1a1916] border-[#24221f]" 
    : "bg-white text-[#4c4a45] hover:text-[#1c1b18] hover:bg-[#fbf9f5] border-gold-500/15";
  const goldTextClass = isGentlemen ? "text-[#c2af8c]" : "text-[#7d5b24]";

  // Filter fragrances for this specific collection (plus unisex fragrances since they fit both)
  const baseFragrances = FRAGRANCES.filter(
    (frag) => frag.gender === gender || frag.gender === "unisex"
  );

  // Enforce rigid max product limits for each collection view
  const limit = gender === "femme" ? 17 : 13;
  const collectionFragrances: Fragrance[] = baseFragrances.slice(0, limit);

  // Filter the final list of 20 products based on the search query
  const displayedFragrances = collectionFragrances.filter((frag) => {
    if (!searchQuery.trim()) return true;

    const q = searchQuery.toLowerCase();
    const inName = frag.name.toLowerCase().includes(q);
    const inTagline = frag.tagline.toLowerCase().includes(q);
    const inInspired = getInspiredByShort(frag.id, language).toLowerCase().includes(q);
    const inClass = frag.classification.toLowerCase().includes(q);
    const inDesc = frag.description.toLowerCase().includes(q);
    const inTopNotes = frag.topNotes.some((n) => n.toLowerCase().includes(q));
    const inHeartNotes = frag.heartNotes.some((n) => n.toLowerCase().includes(q));
    const inBaseNotes = frag.baseNotes.some((n) => n.toLowerCase().includes(q));

    return inName || inTagline || inInspired || inClass || inDesc || inTopNotes || inHeartNotes || inBaseNotes;
  });

  const title = gender === "femme" ? t.splitFemmeTitle : t.splitHommeTitle;
  const description = gender === "femme" ? t.splitFemmeDesc : t.splitHommeDesc;
  const imageSrc =
    gender === "femme"
      ? IMAGES.ladies
      : IMAGES.pour_homme;

  const subtitleText =
    gender === "femme"
      ? (language === "is" ? "KVENKLEGI ILMUR • HÁGÆÐA SAFNIÐ" : language === "es" ? "FRAGANCIAS CELESTIALES • ALTA GAMA" : "CELESTIAL ELEGANCE • HIGH ANTHOLOGY")
      : (language === "is" ? "KARLMANNA ILMUR • KONUNGLIGT SAFN" : language === "es" ? "FRAGANCIAS SOBERANAS • ALTA GAMA" : "SOVEREIGN MAJESTY • HIGH ANTHOLOGY");

  return (
    <div className={`min-h-screen ${bgClass} font-sans pb-24 transition-colors duration-500 animate-luxury-entrance`}>
      {/* Editorial Content Grid Header */}
      <div className="max-w-7xl mx-auto px-6 pt-24 sm:pt-48 md:pt-52 lg:pt-56 pb-6 sm:pb-8">
        

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-12 items-center">
          
          {/* Normal Photo - no shadow, no gradient over, high quality */}
          <div className={`aspect-[4/5] sm:aspect-video md:aspect-[4/5] rounded-sm overflow-hidden ${isGentlemen ? "border-transparent bg-transparent" : "border border-gold-500/10 bg-white"}`}>
            <img
              src={imageSrc}
              alt={title}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover opacity-100"
            />
          </div>

          {/* Collection Narrative */}
          <div className="space-y-4 sm:space-y-6">
            <h1 className={`font-serif italic font-light text-2xl sm:text-5xl lg:text-6xl ${primaryTextClass} tracking-wide uppercase leading-tight break-words sm:whitespace-nowrap`}>
              {title}
            </h1>
            <div className="w-16 h-[2px] bg-gold-500" />
            {description && (
              <p className={`font-serif italic text-xl sm:text-2xl font-light ${primaryTextClass} leading-relaxed`}>
                "{description}"
              </p>
            )}
          </div>

        </div>
      </div>

      {/* Grid of Products matching this collection */}
      <div className="max-w-7xl mx-auto px-6 mt-4 sm:mt-16">
        <div className="w-full h-[1px] bg-gold-500/20 mb-6 sm:mb-16" />
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-10">
          {displayedFragrances.length === 0 ? (
            <div className={`col-span-full text-center py-20 border border-gold-500/10 rounded shadow-none ${isGentlemen ? "bg-[#141311]" : "bg-white"}`}>
              <span className={`w-12 h-12 rounded-full border border-gold-500/10 flex items-center justify-center mx-auto mb-4 ${isGentlemen ? "bg-[#1a1916] text-[#b5b1a9]" : "bg-[#fbfaf7] text-neutral-600"}`}>
                <Filter className="w-5 h-5 stroke-[1.25] text-gold-600" />
              </span>
              <p className={`font-serif italic text-lg ${primaryTextClass}`}>
                {language === 'is' ? "Ekkert fannst við þessi skilyrði." : language === 'es' ? "No se encontraron fragancias con estos criterios." : "No creations match your search parameters."}
              </p>
            </div>
          ) : (
            displayedFragrances.map((fragrance, index) => {
              const isAuraActive = selectedAura === fragrance.id;

              return (
              <div
                key={`${fragrance.id}-${index}`}
                id={`perfume-card-${fragrance.id}-${index}`}
                className={`group relative flex flex-col justify-between ${cardBgClass} border shadow-none hover:shadow-none rounded-sm p-3 sm:p-6 overflow-hidden transition-all duration-700 animate-luxury-entrance`}
              >
                {/* Visual Glow Layer based on selected product aroma color */}
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-1000 pointer-events-none"
                  style={{
                    background: `radial-gradient(circle at center, ${fragrance.color} 0%, transparent 70%)`,
                  }}
                />

                {/* Card Main Content */}
                <div>
                  {/* Perfume Liquid Picture Container (Edge-to-Edge uniform top layout) */}
                  <div 
                    onClick={() => onProductClick(fragrance)}
                    className={`cursor-pointer zoom-glow-container aspect-[4/5] -mx-3 -mt-3 mb-4 sm:-mx-6 sm:-mt-6 sm:mb-8 ${cardImgBgClass} border-transparent rounded-t-sm overflow-hidden relative flex items-center justify-center`}>
                    <img
                      src={fragrance.image}
                      alt={fragrance.name}
                      referrerPolicy="no-referrer"
                      loading="lazy"
                      decoding="async"
                      className={`w-full h-full opacity-95 group-hover:scale-105 transition-all duration-1000 ${fragrance.id === 'nivis-flo' ? 'object-contain' : 'object-cover'}`}
                    />
                  </div>

                  {/* Scent Title and volume details in uniform premium layout */}
                  <div className="flex flex-col mb-2 sm:mb-4">
                    <div className="flex justify-between items-baseline flex-wrap gap-y-1">
                      <h3 
                        onClick={() => onProductClick(fragrance)}
                        className={`cursor-pointer font-serif text-[14px] sm:text-2xl tracking-[0.1em] sm:tracking-[0.2em] font-medium ${primaryTextClass} group-hover:text-gold-600 transition-colors duration-500`}>
                        {fragrance.name}
                      </h3>
                      <span className="font-sans text-[6.5px] sm:text-[9px] tracking-[0.1em] sm:tracking-[0.22em] font-semibold text-[#8c7447] uppercase">
                        {fragrance.gender === "femme" ? (language === "is" ? "DÖMUR" : "LADIES") : fragrance.gender === "homme" ? (language === "is" ? "HERRAR" : "GENTLEMEN") : "UNISEX"}
                      </span>
                    </div>

                    <div className="flex justify-between items-baseline mt-1">
                      <span className={`text-[6.5px] sm:text-[9px] tracking-[0.1em] sm:tracking-[0.25em] ${secondaryTextClass} font-sans uppercase font-medium`}>
                        {fragrance.concentration.toUpperCase()}
                      </span>
                      <span className="text-[6.5px] sm:text-[9px] tracking-[0.1em] sm:tracking-[0.25em] text-[#8c7447] font-sans uppercase font-medium">
                        {fragrance.size}
                      </span>
                    </div>

                    {/* "Inspired by" description & local currency price shown in bigger elegant fonts matching customer's request */}
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-baseline mt-2">
                      <p className={`text-[10px] sm:text-[17px] ${goldTextClass} font-serif italic font-medium tracking-wide whitespace-pre-line leading-tight`}>
                        {getInspiredByShort(fragrance.id, language).replace(" - ", "\n")}
                      </p>
                      <span className={`font-mono text-[10px] sm:text-[15px] font-bold ${goldTextClass} whitespace-nowrap mt-1 sm:mt-0 sm:ml-4 sm:pb-1`}>
                        {getBoutiquePrice(fragrance.id)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Bottom Actions */}
                <div className="pt-3 sm:pt-4 border-t border-gold-500/10">
                  <button
                    id={`add-cart-btn-${fragrance.id}-${index}`}
                    onClick={() => onAddToCart(fragrance)}
                    className="cursor-pointer w-full bg-gold-500 hover:bg-gold-600 text-white font-sans tracking-[0.1em] sm:tracking-[0.2em] font-semibold py-2 sm:py-3 rounded-xs text-[7px] sm:text-[10.5px] uppercase transition-all duration-300 hover:shadow-[0_4px_15px_rgba(178,144,59,0.2)]"
                  >
                    {t.addToBagBtn}
                  </button>
                </div>
              </div>
            );
          })
         )}
        </div>
        
        {(gender === "femme" || gender === "homme") && (
          <div className="mt-8 sm:mt-16 flex justify-center px-4">
            <button
              onClick={onOpenContact}
              className="cursor-pointer bg-gold-500 hover:bg-gold-600 text-white font-sans tracking-[0.1em] sm:tracking-[0.2em] font-semibold px-4 sm:px-12 py-2 sm:py-5 rounded-xs text-[7px] sm:text-xs uppercase transition-all duration-300 shadow-md hover:shadow-[0_4px_15px_rgba(178,144,59,0.3)] w-full sm:w-auto"
            >
              {language === 'is' ? "Finnurðu ekki ilminn þinn? Sendu okkur línu" : language === 'es' ? "¿No encuentras tu perfume? Envíanos un mensaje" : "Can't find your scent? Send us a line"}
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
