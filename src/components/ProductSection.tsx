import { useState } from "react";
import { Eye, HelpCircle, Layers, Wind, Sparkles, Moon, Filter, Check, RotateCcw } from "lucide-react";
import { Fragrance } from "../types";
import { FRAGRANCES, getInspiredByShort, getBoutiquePrice } from "../data";
import { Language, TRANSLATIONS } from "../translations";
import { IMAGES } from "../imageConfig";

interface ProductSectionProps {
  onAddToCart: (fragrance: Fragrance) => void;
  onOpenRitual: (fragrance: Fragrance) => void;
  onProductClick: (fragrance: Fragrance) => void;
  language: Language;
  searchQuery: string;
  genderFilter: "all" | "femme" | "homme" | "bestseller";
  setGenderFilter: (filter: "all" | "femme" | "homme" | "bestseller") => void;
  onSelectCollection?: (gender: "femme" | "homme") => void;
  onOpenContact: () => void;
}

export default function ProductSection({
  onAddToCart,
  onOpenRitual,
  onProductClick,
  language,
  searchQuery,
  genderFilter,
  setGenderFilter,
  onSelectCollection,
  onOpenContact
}: ProductSectionProps) {
  const [activeTabMap, setActiveTabMap] = useState<Record<string, "about" | "notes">>({});
  const [selectedAura, setSelectedAura] = useState<string | null>(null);

  const t = TRANSLATIONS[language];

  const getActiveTab = (id: string) => activeTabMap[id] || "about";

  const setTab = (id: string, tab: "about" | "notes") => {
    setActiveTabMap((prev) => ({ ...prev, [id]: tab }));
  };

  // Filter logic: gender category filter + robust search filter
  let searchResults: Fragrance[] = [];
  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    searchResults = FRAGRANCES.filter((frag) => {
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
  }

  let filteredFragrances = FRAGRANCES.filter((frag) => {
    // 1. Gender check or Best Seller check
    if (genderFilter !== "all") {
      if (genderFilter === "bestseller") {
        return true; // We slice it later
      } else if (genderFilter === "femme") {
        // Show femme & unisex
        if (frag.gender !== "femme" && frag.gender !== "unisex") return false;
      } else if (genderFilter === "homme") {
        // Show homme & unisex
        if (frag.gender !== "homme" && frag.gender !== "unisex") return false;
      }
    }
    return true;
  });

  if (genderFilter === "all" || genderFilter === "bestseller") {
    const bestSellerIds = [
      "femme-edition-3",
      "ambre-eternite",
      "femme-edition-1",
      "nivis-flo",
      "aureum-oud",
      "vetiver-imperial",
      "homme-edition-10",
      "homme-edition-4"
    ];
    filteredFragrances = bestSellerIds.map(id => filteredFragrances.find(f => f.id === id)).filter(Boolean) as Fragrance[];
  }

  const renderFragrance = (fragrance: Fragrance) => {
    const isVinsaelast = (genderFilter === "all" || genderFilter === "bestseller") && !searchQuery;
    const isFourthLadies = fragrance.id === "nivis-flo";
    const isFourthGentlemen = fragrance.id === "homme-edition-4";
    const isHiddenOnDesktop = isVinsaelast && (isFourthLadies || isFourthGentlemen);

    return (
      <div
        key={fragrance.id}
        id={`perfume-card-${fragrance.id}`}
        className={`group relative flex-col justify-between bg-[#f5f2eb] border border-[#f5f2eb] shadow-none hover:shadow-none rounded-sm p-3 sm:p-6 overflow-hidden transition-all duration-700 ${
          isHiddenOnDesktop ? "hidden max-md:flex" : "flex"
        }`}
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
            className="cursor-pointer zoom-glow-container aspect-[4/5] -mx-3 -mt-3 mb-4 sm:-mx-6 sm:-mt-6 sm:mb-8 bg-[#f5f2eb] border-transparent rounded-t-sm overflow-hidden relative flex items-center justify-center">
            <img
              src={fragrance.image}
              alt={fragrance.name}
              referrerPolicy="no-referrer"
              loading="lazy"
              decoding="async"
              className={`w-full h-full opacity-95 group-hover:scale-105 transition-all duration-1000 ${fragrance.id === 'nivis-flo' ? 'object-contain' : 'object-cover'}`}
            />
          </div>
          {/* Scent Title & Volume details in uniform premium layout */}
          <div className="flex flex-col mb-2 sm:mb-4">
            <div className="flex justify-between items-baseline flex-wrap gap-y-1">
              <h3 
                onClick={() => onProductClick(fragrance)}
                className="cursor-pointer font-serif text-[10px] sm:text-2xl tracking-[0.05em] sm:tracking-[0.2em] font-medium text-[#1c1b18] group-hover:text-gold-600 transition-colors duration-500">
                {fragrance.name}
              </h3>
              <span className="font-sans text-[5.5px] sm:text-[9px] tracking-[0.1em] sm:tracking-[0.22em] font-semibold text-[#8c7447] uppercase">
                {fragrance.gender === "femme" ? (language === "is" ? "DÖMUR" : "LADIES") : fragrance.gender === "homme" ? (language === "is" ? "HERRAR" : "GENTLEMEN") : "UNISEX"}
              </span>
            </div>
            <div className="flex justify-between items-baseline mt-1">
              <span className="text-[5.5px] sm:text-[9px] tracking-[0.1em] sm:tracking-[0.25em] text-[#4c4a45] font-sans uppercase font-medium">
                {fragrance.concentration.toUpperCase()}
              </span>
              <span className="text-[5.5px] sm:text-[9px] tracking-[0.1em] sm:tracking-[0.25em] text-[#8c7447] font-sans uppercase font-medium">
                {fragrance.size}
              </span>
            </div>
            {/* "Inspired by" description & local currency price shown in bigger elegant fonts matching customer's request */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-baseline mt-2">
              <p className="text-[7.5px] sm:text-[17px] text-[#7d5b24] font-serif italic font-medium tracking-wide whitespace-pre-line leading-tight">
                {getInspiredByShort(fragrance.id, language).replace(" - ", "\n")}
              </p>
              <span className="font-mono text-[8px] sm:text-[15px] font-bold text-[#7d5b24] whitespace-nowrap mt-1 sm:mt-0 sm:ml-4 sm:pb-1">
                {getBoutiquePrice(fragrance.id)}
              </span>
            </div>
          </div>
        </div>
        {/* Card Bottom Actions */}
        <div className="pt-3 sm:pt-4 border-t border-gold-500/10">
          <button
            id={`add-cart-btn-${fragrance.id}`}
            onClick={() => onAddToCart(fragrance)}
            className="cursor-pointer w-full bg-gold-500 hover:bg-gold-600 text-white font-sans tracking-[0.1em] sm:tracking-[0.2em] font-semibold py-2 sm:py-3 rounded-xs text-[7px] sm:text-[10.5px] uppercase transition-all duration-300 hover:shadow-[0_4px_15px_rgba(178,144,59,0.2)]"
          >
            {t.addToBagBtn}
          </button>
        </div>
      </div>
    );
  };

  return (
    <section id="les-parfums" className="pt-8 sm:pt-12 lg:pt-16 pb-24 bg-[#f5f2eb] relative">
      {/* Background ambient gold gradient */}
      <div id="parfums-ambient-glow" className="absolute top-[30%] left-[50%] -translate-x-[50%] w-[600px] h-[300px] bg-gold-500/5 blur-[150px] pointer-events-none rounded-full" />

      <div className="max-w-7xl mx-auto px-6 relative z-10 flex flex-col">
        {searchQuery.trim() && (
          <div className="mb-12 w-full mt-8">
             <h3 className="text-[#1c1b18] font-serif tracking-[0.2em] sm:tracking-[0.3em] text-[16px] sm:text-3.5xl uppercase font-light text-center mb-6">
                {language === 'is' ? "Leitarniðurstöður" : language === 'es' ? "Resultados de búsqueda" : "Search Results"}
             </h3>
             <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-10">
               {searchResults.length === 0 ? (
                 <div className="col-span-full text-center py-24 bg-white border border-gold-500/10 rounded shadow-sm">
                    <p className="font-serif italic text-lg text-[#1c1b18]">
                      {language === 'is' ? "Ekkert fannst við þessi skilyrði." : language === 'es' ? "No se encontraron fragancias con estos criterios." : "No creations match your search parameters."}
                    </p>
                 </div>
               ) : (
                 searchResults.map(renderFragrance)
               )}
             </div>
             <div className="w-full pt-4 mt-8 border-b border-gold-500/10" />
          </div>
        )}

        {/* Dynamic Category Sourcing Header Block with Screen Split Option */}
        <div className="mb-2">
          <h2 className="font-serif text-3xl sm:text-5xl italic font-light tracking-wide text-[#1c1b18] text-center mb-8 sm:mb-12 lg:mb-14">
            {genderFilter === "all" 
              ? t.allGenders 
              : genderFilter === "bestseller" 
              ? (language === "is" ? "Söluhæstu meistaraverk" : language === "es" ? "Obras Maestras Más Vendidas" : "Sovereign Best Sellers Collection")
              : genderFilter === "femme" 
              ? t.pourFemmeFlag 
              : t.pourHommeFlag}
          </h2>

          {/* Luxury Picture Sketch Screen Split block (Feminine / Masculine Sections) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
            
            {/* Woman Section Panel (Pour Femme) */}
            <div
              id="category-split-femme"
              onClick={() => {
                if (onSelectCollection) {
                  onSelectCollection("femme");
                } else {
                  setGenderFilter("femme");
                }
              }}
              className={`group relative h-[250px] sm:h-[420px] rounded-sm overflow-hidden border cursor-pointer transition-all duration-750 ${
                genderFilter === "femme"
                  ? "border-gold-500 scale-[1.01]"
                  : "border-gold-500/10 hover:border-gold-500/30 hover:scale-[1.005]"
              }`}
            >
              {/* Image layer */}
              <div className="absolute inset-0">
                <img
                  src={IMAGES.ladies_main}
                  alt="Pour Femme - LxS SCENTS"
                  referrerPolicy="no-referrer"
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover opacity-100 group-hover:scale-105 transition-all duration-1000"
                />
              </div>

              {/* Text overlay */}
              <div className="absolute inset-x-0 bottom-0 p-5 sm:p-8 z-20 flex flex-col justify-end h-full">
                <h3 className="font-serif text-2xl sm:text-4xl font-light text-white italic tracking-wide whitespace-normal sm:whitespace-nowrap">
                  {t.splitFemmeTitle}
                </h3>
              </div>
            </div>

            {/* Man Section Panel (Pour Homme) */}
            <div
              id="category-split-homme"
              onClick={() => {
                if (onSelectCollection) {
                  onSelectCollection("homme");
                } else {
                  setGenderFilter("homme");
                }
              }}
              className={`group relative h-[250px] sm:h-[420px] rounded-sm overflow-hidden border cursor-pointer transition-all duration-750 ${
                genderFilter === "homme"
                  ? "border-gold-500 scale-[1.01]"
                  : "border-gold-500/10 hover:border-gold-500/30 hover:scale-[1.005]"
              }`}
            >
              {/* Image layer */}
              <div className="absolute inset-0">
                <img
                  src={IMAGES.pour_homme_main}
                  alt="Pour Homme - LxS SCENTS"
                  referrerPolicy="no-referrer"
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover opacity-100 group-hover:scale-105 transition-all duration-1000"
                />
              </div>

              {/* Text overlay */}
              <div className="absolute inset-x-0 bottom-0 p-5 sm:p-8 z-20 flex flex-col justify-end h-full">
                <h3 className="font-serif text-2xl sm:text-4xl font-light text-white italic tracking-wide whitespace-normal sm:whitespace-nowrap">
                  {t.splitHommeTitle}
                </h3>
              </div>
            </div>

          </div>

          {/* Divider line before BESTSELLER PRODUCTS section */}
          <div id="bestseller-heading-section" className="w-full pt-4 mt-4 sm:mt-8" />

          {/* BESTSELLER PRODUCTS section title in bigger letters */}
          <div className="flex flex-col sm:flex-row justify-between items-center pb-0 sm:pb-2 mb-0 sm:mb-4 gap-4 font-normal">
            <h3 className="text-[#1c1b18] font-serif tracking-[0.2em] sm:tracking-[0.3em] text-[16px] sm:text-3.5xl uppercase font-light text-center sm:text-left whitespace-nowrap">
              {language === 'is' ? "Vinsælustu vörurnar" : language === 'es' ? "PRODUCTOS MÁS VENDIDOS" : "BEST SELLER PRODUCTS"}
            </h3>

            <div className="flex items-center gap-3">
              
              {genderFilter !== "all" && (
                <button
                  id="reset-gender-filter"
                  onClick={() => setGenderFilter("all")}
                  className="cursor-pointer text-[10px] uppercase font-sans tracking-wider border border-gold-500/15 text-[#4c4a45] hover:text-[#1c1b18] px-3.5 py-1.5 rounded bg-white hover:bg-neutral-50 flex items-center space-x-1.5"
                >
                  <RotateCcw className="w-3 h-3 text-gold-600" />
                  <span>Show All Creations</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Product Grid Area */}
        <div id="parfums-collection-grid" className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-10 mt-0 sm:mt-2 ">
          {filteredFragrances.length === 0 ? (
            <div className="col-span-full text-center py-24 bg-white border border-gold-500/10 rounded shadow-sm">
              <span className="w-12 h-12 rounded-full border border-gold-500/10 flex items-center justify-center bg-[#fbfaf7] text-neutral-600 mx-auto mb-4">
                <Filter className="w-5 h-5 stroke-[1.25] text-gold-600" />
              </span>
              <p className="font-serif italic text-lg text-[#1c1b18]">
                {language === 'is' ? "Ekkert fannst við þessi skilyrði." : language === 'es' ? "No se encontraron fragancias con estos criterios." : "No creations match your search parameters."}
              </p>
              <button
                onClick={() => {
                  setGenderFilter("all");
                }}
                className="mt-6 cursor-pointer bg-gold-500 hover:bg-gold-600 text-white px-6 py-2 tracking-widest text-[9.5px] uppercase font-sans font-bold rounded"
              >
                Reset Search Filters
              </button>
            </div>
          ) : (
            filteredFragrances.map(renderFragrance)
          )}
        </div>
        
        {(genderFilter === "femme" || genderFilter === "homme") && (
          <div className="mt-16 flex justify-center px-4">
            <button
              onClick={onOpenContact}
              className="cursor-pointer bg-gold-500 hover:bg-gold-600 text-white font-sans tracking-[0.2em] font-semibold px-8 py-4 sm:px-12 sm:py-5 rounded-xs text-[11px] sm:text-xs uppercase transition-all duration-300 shadow-md hover:shadow-[0_4px_15px_rgba(178,144,59,0.3)] w-full sm:w-auto"
            >
              {language === 'is' ? "Finnurðu ekki ilminn þinn? Sendu okkur línu" : language === 'es' ? "¿No encuentras tu perfume? Envíanos un mensaje" : "Can't find your scent? Send us a line"}
            </button>
          </div>
        )}

      </div>
    </section>
  );
}
