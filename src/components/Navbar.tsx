import { useState, useEffect } from "react";
import { ShoppingBag, Search, Globe, X, User, Sparkles } from "lucide-react";
import { CartItem } from "../types";
import { Language, TRANSLATIONS } from "../translations";

interface NavbarProps {
  activeSection: string;
  onNavigate: (section: string) => void;
  cart: CartItem[];
  onOpenCart: () => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onOpenContact: () => void;
  onOpenProfile: () => void;
  onOpenMembership: () => void;
  onFilterGender: (filter: "all" | "femme" | "homme" | "bestseller") => void;
  genderFilter: "all" | "femme" | "homme" | "bestseller";
}

export default function Navbar({
  activeSection,
  onNavigate,
  cart,
  onOpenCart,
  language,
  setLanguage,
  searchQuery,
  setSearchQuery,
  onOpenContact,
  onOpenProfile,
  onOpenMembership,
  onFilterGender,
  genderFilter
}: NavbarProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);
  const t = TRANSLATIONS[language];

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 40);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleGenderClick = (filter: "femme" | "homme" | "bestseller") => {
    onFilterGender(filter);
  };

  return (
    <header
      id="main-nav-header"
      className={`fixed top-0 left-0 w-full z-50 transition-colors duration-700 py-2 ${
        genderFilter === "homme"
          ? "bg-[#0a0a09]/95 backdrop-blur-md shadow-[0_5px_25px_rgba(0,0,0,0.5)]" 
          : "bg-[#f5f2eb]/95 backdrop-blur-md shadow-[0_5px_25px_rgba(28,27,24,0.04)]"
      }`}
    >
      <div className="max-w-7xl mx-auto px-2 sm:px-6 flex flex-col gap-3">
        
        {/* Top bar: Left (Menu links), Center (Logo), Right (Actions) - Always grid-cols-3 to center logo perfectly */}
        <div className="grid grid-cols-3 items-center w-full gap-1 sm:gap-2 py-1">
          
          {/* Column 1: Left aligned - Best Seller, Women, Men, Memberships */}
          <div id="nav-top-left-menu" className={`flex items-center gap-1.5 xs:gap-2.5 sm:gap-4 md:gap-5 text-[7px] xs:text-[8px] sm:text-[12px] md:text-[13px] tracking-[0.05em] xs:tracking-[0.1em] sm:tracking-[0.25em] font-sans uppercase text-left font-semibold ${genderFilter !== "homme" ? "text-[#b2903b]" : ""}`}>
            <button
              onClick={() => handleGenderClick("bestseller")}
              className={`cursor-pointer transition-colors duration-300 relative shrink-0 py-1 ${
                genderFilter === "homme"
                  ? "text-[#c2af8c] hover:text-[#c2af8c]"
                  : "text-[#b2903b] hover:text-[#7d5b24]"
              } ${
                genderFilter === "bestseller" 
                  ? "font-bold text-[#b2903b] decoration-[#b2903b] underline underline-offset-4"
                  : ""
              }`}
            >
              {t.bestSellerMenu}
            </button>
            <button
              onClick={() => handleGenderClick("femme")}
              className={`cursor-pointer transition-colors duration-300 relative shrink-0 py-1 ${
                genderFilter === "homme"
                  ? "text-[#c2af8c] hover:text-[#c2af8c]"
                  : "text-[#b2903b] hover:text-[#7d5b24]"
              } ${
                genderFilter === "femme" 
                  ? "font-bold text-[#b2903b] decoration-[#b2903b] underline underline-offset-4"
                  : ""
              }`}
            >
              {t.womenMenu}
            </button>
            <button
              onClick={() => handleGenderClick("homme")}
              className={`cursor-pointer transition-colors duration-300 relative shrink-0 py-1 ${
                genderFilter === "homme"
                  ? "text-[#c2af8c] hover:text-[#c2af8c] font-bold decoration-[#c2af8c] underline underline-offset-4"
                  : "text-[#b2903b] hover:text-[#7d5b24]"
              }`}
            >
              {t.menMenu}
            </button>
            <button
              onClick={onOpenMembership}
              className={`cursor-pointer transition-colors duration-300 relative shrink-0 py-1 ${
                genderFilter === "homme"
                  ? "text-[#c2af8c] hover:text-[#c2af8c]"
                  : "text-[#b2903b] hover:text-[#7d5b24]"
              } ${
                activeSection === "membership" 
                  ? "font-bold text-[#b2903b] decoration-[#b2903b] underline underline-offset-4"
                  : ""
              }`}
            >
              {language === "is" ? "Áskriftir" : t.membershipMenu}
            </button>
          </div>
          
          {/* Column 2: CENTER SECTION: Brand Logo in EXACT middle - Magnified with the golden calligraphic LXS logo */}
          <div id="nav-center-branding" className="text-center flex justify-center items-center shrink-0">
            <button
              id="nav-brand-logo-btn"
              onClick={() => {
                onFilterGender("all");
                onNavigate("atelier");
              }}
              className="group flex flex-col items-center justify-center select-none cursor-pointer"
            >
              <img
                src="https://i.postimg.cc/wMYnCZpf/LOGO-B2903B-removebg-preview.png"
                alt="LxS SCENTS Logo"
                loading="eager"
                fetchPriority="high"
                decoding="async"
                width={280}
                height={95}
                className="h-[32px] xs:h-[38px] sm:h-[95px] w-auto object-contain transition-all duration-500 group-hover:scale-105"
              />
            </button>
          </div>

          {/* Column 3: RIGHT SECTION: Actions */}
          <div id="nav-right-actions" className={`flex items-center justify-end space-x-1 sm:space-x-3 text-[7px] xs:text-[8px] sm:text-[13px] tracking-[0.15em] sm:tracking-[0.25em] font-sans uppercase ${genderFilter !== "homme" ? "text-[#4c4a45]" : ""}`}>
            <div className="flex items-center space-x-1 sm:space-x-2.5 shrink-0">
              
              {/* Search trigger icon / bar on the left side of the ISL language button */}
              <div className="flex items-center transition-all duration-300 relative z-50">
                {!isSearchOpen ? (
                  <button
                    onClick={() => setIsSearchOpen(true)}
                    className={`cursor-pointer flex items-center justify-center shrink-0 transition-colors duration-300 ${
                      genderFilter === "homme"
                        ? "w-[26px] h-[26px] sm:w-[40px] sm:h-[40px] rounded border border-[#24221f] bg-[#141311] hover:bg-[#1a1916] text-[#c2af8c] hover:text-[#f5f2eb]"
                        : "w-[26px] h-[26px] sm:w-[40px] sm:h-[40px] rounded border border-[#b2903b]/20 bg-white hover:bg-neutral-50 text-[#b2903b]"
                    }`}
                    title={language === 'is' ? "Leita" : language === 'es' ? "Buscar" : "Search"}
                  >
                    <Search className={genderFilter === "homme" ? "w-[12px] h-[12px] sm:w-[18px] sm:h-[18px] stroke-[1.75]" : "w-[12px] h-[12px] sm:w-[18px] sm:h-[18px] stroke-[1.75]"} />
                  </button>
                ) : (
                  <div className={`flex items-center transition-all duration-300 gap-1 sm:gap-1.5 ${
                    genderFilter === "homme"
                      ? "bg-[#141311] border border-[#24221f] rounded px-1.5 sm:px-2.5 h-[26px] sm:h-[40px] w-[75px] xs:w-[95px] sm:w-[140px]"
                      : "bg-white border border-[#b2903b]/80 rounded px-1.5 sm:px-2.5 h-[26px] sm:h-[40px] w-[75px] xs:w-[95px] sm:w-[140px] shadow-xs"
                  }`}>
                    <Search className={`shrink-0 ${genderFilter === "homme" ? "w-[10px] h-[10px] sm:w-3.5 sm:h-3.5 text-[#c2af8c]" : "w-[9px] h-[9px] sm:w-3 sm:h-3 text-[#b2903b]"}`} />
                    <input
                      type="text"
                      autoFocus
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="..."
                      className={`bg-transparent font-semibold outline-none w-full transition-all duration-300 font-mono ${
                        genderFilter === "homme"
                          ? "text-[#c2af8c] placeholder-[#c2af8c]/60 text-[10px] sm:text-[11px]"
                          : "text-[#b2903b] placeholder-[#b2903b]/60 text-[8px] sm:text-[10px]"
                      }`}
                    />
                    <button
                      onClick={() => {
                        setSearchQuery("");
                        setIsSearchOpen(false);
                      }}
                      className={`cursor-pointer p-0.5 rounded-sm ${
                        genderFilter === "homme"
                          ? "text-[#c2af8c] hover:text-[#f5f2eb]"
                          : "text-[#b2903b] hover:text-[#7d5b24]"
                      }`}
                    >
                      <X className={genderFilter === "homme" ? "w-3 h-3" : "w-2.5 h-2.5"} />
                    </button>
                  </div>
                )}
              </div>

              {/* Elegant Language Selector */}
              <div className={`flex items-center space-x-1 sm:space-x-1.5 transition-colors duration-300 shrink-0 ${
                genderFilter === "homme"
                  ? "border border-[#24221f] bg-[#141311] hover:bg-[#1a1916] rounded px-1.5 sm:px-2.5 h-[26px] sm:h-[40px]"
                  : "border border-[#b2903b]/20 bg-white hover:bg-neutral-50 rounded px-1.5 sm:px-2.5 h-[26px] sm:h-[40px]"
              }`}>
                <Globe className={`shrink-0 ${genderFilter === "homme" ? "w-[10px] h-[10px] sm:w-4 sm:h-4 text-[#c2af8c]" : "w-[10px] h-[10px] sm:w-4 sm:h-4 text-[#b2903b]"}`} />
                <select
                  id="language-selector"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value as Language)}
                  className={`bg-transparent outline-none text-[7px] xs:text-[8px] sm:text-[12px] font-sans cursor-pointer uppercase tracking-wider font-semibold ${
                    genderFilter === "homme" ? "text-[#c2af8c]" : "text-[#b2903b]"
                  }`}
                >
                  <option value="en" className={genderFilter === "homme" ? "bg-[#141311] text-[#c2af8c]" : "bg-white text-[#b2903b]"}>EN</option>
                  <option value="is" className={genderFilter === "homme" ? "bg-[#141311] text-[#c2af8c]" : "bg-white text-[#b2903b]"}>ÍSL</option>
                </select>
              </div>

              {/* Account Vault Icon Button */}
              <button
                id="nav-profile-trigger"
                onClick={onOpenProfile}
                aria-label="Open sovereign account vault"
                className={`cursor-pointer flex items-center justify-center transition-colors duration-300 shrink-0 ${
                  genderFilter === "homme"
                    ? "w-[26px] h-[26px] sm:w-[40px] sm:h-[40px] text-[#c2af8c] border border-[#24221f] rounded bg-[#141311] hover:bg-[#1a1916] hover:text-[#f5f2eb]"
                    : "w-[26px] h-[26px] sm:w-[40px] sm:h-[40px] text-[#b2903b] border border-[#b2903b]/20 rounded bg-white hover:bg-neutral-50"
                }`}
                title="Sovereign Account Details"
              >
                <User className="w-[12px] h-[12px] sm:w-[18px] sm:h-[18px] stroke-[2]" />
              </button>

              {/* Cart Icon Button */}
              <button
                id="nav-cart-trigger"
                onClick={onOpenCart}
                aria-label="Open your fragrance collection"
                className={`cursor-pointer relative flex items-center justify-center transition-colors duration-300 shrink-0 ${
                  genderFilter === "homme"
                    ? "w-[26px] h-[26px] sm:w-[40px] sm:h-[40px] text-[#c2af8c] border border-[#24221f] rounded bg-[#141311] hover:bg-[#1a1916] hover:text-[#f5f2eb]"
                    : "w-[26px] h-[26px] sm:w-[40px] sm:h-[40px] text-[#b2903b] border border-[#b2903b]/20 rounded bg-white hover:bg-neutral-50"
                }`}
              >
                <ShoppingBag className="w-[12px] h-[12px] sm:w-[18px] sm:h-[18px] stroke-[2]" />
                {cartCount > 0 && (
                  <span id="nav-cart-badge" className={`absolute -top-1.5 -right-1.5 text-[7.5px] sm:text-[9.5px] font-sans font-bold w-[14px] h-[14px] sm:w-5 sm:h-5 rounded-full flex items-center justify-center shadow-lg animate-pulse ${
                    genderFilter === "homme"
                      ? "bg-[#c2af8c] text-[#141311]"
                      : "bg-[#b2903b] text-white"
                  }`}>
                    {cartCount}
                  </span>
                )}
              </button>

            </div>
          </div>

        </div>

      </div>
    </header>
  );
}
