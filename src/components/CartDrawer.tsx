import React, { useState, useEffect } from "react";
import { X, Trash2, Sparkles, Plus, Minus, Tag, CheckCircle2, ShieldCheck } from "lucide-react";
import { CartItem } from "../types";
import { Language, TRANSLATIONS } from "../translations";
import { getIskPriceNumber } from "../data";
import { auth } from "../firebase";

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  onUpdateQty: (id: string, isCustom: boolean, change: number) => void;
  onRemoveItem: (id: string, isCustom: boolean) => void;
  onClearCart: () => void;
  language?: Language;
  onCheckout: () => void;
  appliedCoupon?: { code: string; percent: number } | null;
  onApplyCoupon?: (code: string) => { success: boolean; message: string };
  onRemoveCoupon?: () => void;
}

export default function CartDrawer({
  isOpen,
  onClose,
  cart,
  onUpdateQty,
  onRemoveItem,
  onClearCart,
  language = "en",
  onCheckout,
  appliedCoupon,
  onApplyCoupon,
  onRemoveCoupon
}: CartDrawerProps) {
  const t = TRANSLATIONS[language];
  const [couponInput, setCouponInput] = useState<string>("");
  const [couponFeedback, setCouponFeedback] = useState<{ success: boolean; text: string } | null>(null);

  useEffect(() => {
    if (appliedCoupon) {
      setCouponInput(appliedCoupon.code);
    }
  }, [appliedCoupon]);

  if (!isOpen) return null;

  const subtotal = cart.reduce((acc, item) => {
    return acc + getIskPriceNumber(item.fragrance.id) * item.quantity;
  }, 0);

  const discountAmount = appliedCoupon ? Math.round(subtotal * (appliedCoupon.percent / 100)) : 0;
  const discountedSubtotal = Math.max(0, subtotal - discountAmount);

  const isOnlySubscriptions = cart.length > 0 && cart.every(item => item.fragrance.id.startsWith("subscription-"));
  const isShipFree = discountedSubtotal >= 10000 || isOnlySubscriptions;
  const shippingChargeISK = isShipFree ? (language === 'is' ? "FRÍTT" : language === 'es' ? "GRATIS" : "FREE") : "900 kr.-";
  const shippingCost = isShipFree ? 0 : 900;

  const total = discountedSubtotal + shippingCost;

  const handleApplyCouponClick = (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponInput.trim()) return;
    if (onApplyCoupon) {
      const res = onApplyCoupon(couponInput.trim());
      setCouponFeedback({ success: res.success, text: res.message });
      setTimeout(() => setCouponFeedback(null), 4000);
    }
  };

  const handleCheckoutClick = () => {
    onClose();
    onCheckout();
  };

  return (
    <div id="cart-drawer-backdrop" className="fixed inset-0 z-50 flex justify-end">
      {/* Dimmed backdrop */}
      <div
        id="cart-overlay-bg"
        onClick={onClose}
        className="absolute inset-0 bg-black/40 backdrop-blur-xs transition-opacity duration-500"
      />

      {/* Slide-out cart pane */}
      <div
        id="cart-drawer-container"
        className="relative w-full max-w-md bg-[#f5f2eb] border-l border-[#b2903b]/20 h-full shadow-2xl flex flex-col justify-between z-10 animate-luxury-entrance"
      >
        {/* Header Drawer */}
        <div className="p-5 sm:p-6 border-b border-[#b2903b]/20 flex justify-between items-center bg-[#f5f2eb]">
          <div className="flex items-center gap-2">
            <h3 className="font-sans text-sm sm:text-base tracking-[0.2em] text-[#b2903b] uppercase font-semibold">
              {t.collectionBag}
            </h3>
          </div>
          <button
            id="close-cart-btn"
            onClick={onClose}
            aria-label="Close cart drawer"
            className="cursor-pointer p-2 hover:bg-[#b2903b]/10 border border-transparent hover:border-[#b2903b]/20 rounded-full transition-all text-[#b2903b]"
          >
            <X className="w-5 h-5 stroke-[1.5]" />
          </button>
        </div>

        {/* Cart items list */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
          {cart.length === 0 ? (
            <div id="empty-cart-display" className="h-full flex flex-col justify-center items-center text-center space-y-4 py-12">
              <span className="w-12 h-12 rounded-full border border-[#b2903b]/30 flex items-center justify-center bg-white/50 text-[#b2903b]">
                <Trash2 className="w-5 h-5 stroke-[1.25]" />
              </span>
              <div>
                <h4 className="font-sans text-[#b2903b] font-semibold text-sm sm:text-base tracking-wide">
                  {language === 'is' ? "Karfan þín er tóm í bili" : language === 'es' ? "Tu bolsa está vacía actualmente." : "Your shopping cart is currently empty"}
                </h4>
                <div className="mt-4 max-w-[320px] mx-auto leading-relaxed tracking-wide">
                  {language === 'is' ? (
                    <span className="text-[10px] sm:text-sm text-[#b2903b]/80 font-sans block">
                      Skoðaðu vöruúrvalið og finndu þinn eigin einkennisilm
                    </span>
                  ) : language === 'es' ? (
                    <span className="text-xs sm:text-sm text-[#b2903b]/80 font-sans block">
                      Explora Les Parfums o crea tu fragancia para añadir al carrito.
                    </span>
                  ) : (
                    <span className="font-sans italic font-light text-xs sm:text-sm text-[#b2903b]/80 block leading-relaxed">
                      Explore our collections and find your signature scent
                    </span>
                  )}
                </div>
              </div>
            </div>
          ) : (
            cart.map((item) => {
              const frag = item.fragrance;
              const isCustom = frag.id.startsWith("bespoke-");

              return (
                <div
                  key={`${frag.id}-${item.sizeSelected || ''}`}
                  className="flex space-x-4 p-3.5 bg-white/70 border border-[#b2903b]/20 rounded-md shadow-xs items-center"
                >
                  <div className="w-16 h-16 rounded overflow-hidden bg-neutral-100 flex-shrink-0 flex items-center justify-center border border-[#b2903b]/20">
                    {frag.image ? (
                      <img
                        src={frag.image}
                        alt={frag.name}
                        loading="lazy"
                        decoding="async"
                        width={64}
                        height={64}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-[#c5a855]/20 to-neutral-900/10">
                        <Sparkles className="w-5 h-5 text-[#b2903b]" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div>
                      <div className="flex justify-between items-start">
                        <h4 className="font-serif text-sm font-bold text-neutral-900 truncate">
                          {frag.id === "subscription-diamond"
                            ? (language === "is" ? "DEMANTS ÁSKRIFT" : "DIAMOND Membership")
                            : frag.id === "subscription-gold"
                            ? (language === "is" ? "GULL ÁSKRIFT" : "GOLD Membership")
                            : frag.name}
                        </h4>
                        <span className="font-mono text-xs sm:text-sm text-[#b2903b] font-medium whitespace-nowrap ml-2">
                          {(getIskPriceNumber(frag.id) * item.quantity).toLocaleString("is-IS")} kr.-
                        </span>
                      </div>
                      <p className="text-[11px] text-neutral-600 font-mono mt-0.5">
                        {isCustom
                          ? frag.classification
                          : frag.id.startsWith("subscription-")
                          ? `${language === "is" ? "1 mánuður" : "1 month"} • ${language === "is" ? "Áskrift" : "Membership"}`
                          : `${item.sizeSelected || frag.size} • ${frag.concentration}`}
                      </p>
                    </div>

                    {/* Quantity controls */}
                    <div className="flex justify-between items-center mt-2.5">
                      <div className="flex items-center space-x-3 border border-[#b2903b]/30 rounded px-2 py-0.5 bg-white">
                        <button
                          id={`minus-btn-${frag.id}`}
                          onClick={() => onUpdateQty(frag.id, isCustom, -1)}
                          className="cursor-pointer text-[#b2903b]/70 hover:text-[#b2903b]"
                          title="Fækka"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-xs font-mono text-neutral-900 font-semibold min-w-3 text-center">
                          {item.quantity}
                        </span>
                        <button
                          id={`plus-btn-${frag.id}`}
                          onClick={() => onUpdateQty(frag.id, isCustom, 1)}
                          className="cursor-pointer text-[#b2903b]/70 hover:text-[#b2903b]"
                          title="Fjölga"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <button
                        id={`remove-btn-${frag.id}`}
                        onClick={() => onRemoveItem(frag.id, isCustom)}
                        className="cursor-pointer text-neutral-400 hover:text-red-600 transition-colors p-1"
                        title="Eyða vöru"
                      >
                        <Trash2 className="w-4 h-4 stroke-[1.5]" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Coupons, Totals & Checkout */}
        {cart.length > 0 && (
          <div className="p-5 sm:p-6 border-t border-[#b2903b]/20 bg-[#f5f2eb] space-y-3.5">
            {/* Coupon Code Section */}
            <div className="bg-white/80 p-2.5 rounded border border-[#b2903b]/20">
              <form onSubmit={handleApplyCouponClick} className="flex gap-2">
                <div className="relative flex-1">
                  <Tag className="w-3.5 h-3.5 text-[#b2903b] absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                    placeholder={language === 'is' ? "Afsláttarkóði" : language === 'es' ? "Código" : "Coupon code"}
                    className="w-full pl-8 pr-2 py-1.5 text-xs font-mono uppercase bg-[#fbf9f5] border border-neutral-300 rounded focus:border-[#b2903b] outline-none"
                  />
                </div>
                <button
                  type="submit"
                  className="cursor-pointer px-3 py-1.5 bg-[#b2903b] hover:bg-[#997c32] text-white text-xs font-sans font-bold rounded transition-colors"
                >
                  {language === 'is' ? "Virkja" : language === 'es' ? "Aplicar" : "Apply"}
                </button>
              </form>

              {appliedCoupon && (
                <div className="mt-2 flex items-center justify-between text-xs text-emerald-800 bg-emerald-50 px-2 py-1 rounded border border-emerald-200">
                  <span className="font-mono font-medium flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    {appliedCoupon.code} (-{appliedCoupon.percent}%)
                  </span>
                  {onRemoveCoupon && (
                    <button
                      type="button"
                      onClick={onRemoveCoupon}
                      className="cursor-pointer text-[10px] text-red-600 underline hover:text-red-800"
                    >
                      {language === 'is' ? "Fjarlægja" : language === 'es' ? "Quitar" : "Remove"}
                    </button>
                  )}
                </div>
              )}

              {couponFeedback && (
                <p className={`mt-1.5 text-[11px] font-sans ${couponFeedback.success ? 'text-emerald-700' : 'text-red-700'}`}>
                  {couponFeedback.text}
                </p>
              )}
            </div>

            {/* Calculations Breakdown */}
            <div className="space-y-2 text-xs font-sans text-neutral-700">
              <div className="flex justify-between text-neutral-800">
                <span>{language === 'is' ? "Samtals vörur" : language === 'es' ? "Subtotal" : "Subtotal"}</span>
                <span className="font-mono font-semibold">{subtotal.toLocaleString("is-IS")} kr.-</span>
              </div>

              {appliedCoupon && discountAmount > 0 && (
                <div className="flex justify-between text-emerald-800 font-medium">
                  <span>{language === 'is' ? `Afsláttur (${appliedCoupon.code})` : `Discount (${appliedCoupon.code})`}</span>
                  <span className="font-mono font-semibold">-{discountAmount.toLocaleString("is-IS")} kr.-</span>
                </div>
              )}

              <div className="flex justify-between items-baseline text-neutral-800">
                <div className="flex flex-col">
                  <span>{language === 'is' ? "Sendingarkostnaður" : language === 'es' ? "Costo de envío" : "Shipping"}</span>
                  {!isShipFree && (
                    <span className="text-[10px] text-neutral-500 font-sans italic">
                      {language === 'is' ? "(Frítt yfir 10.000 kr.-)" : "(Free delivery over 10.000kr-)"}
                    </span>
                  )}
                </div>
                <span className="font-mono font-semibold text-neutral-900">{shippingChargeISK}</span>
              </div>

              <div className="border-t border-[#b2903b]/25 pt-2 flex justify-between text-sm font-semibold text-[#b2903b]">
                <span className="font-sans text-base font-bold text-neutral-900">
                  {language === 'is' ? "Heildarverð" : language === 'es' ? "Total a pagar" : "Total"}
                </span>
                <span className="font-mono text-[#b2903b] font-bold text-lg">{total.toLocaleString("is-IS")} kr.-</span>
              </div>
            </div>

            {/* Unified Single Checkout Action Button */}
            <div className="pt-2">
              <button
                id="checkout-initiator-btn"
                onClick={handleCheckoutClick}
                className="cursor-pointer w-full bg-[#b2903b] hover:bg-[#997c32] text-white border border-[#b2903b] text-center font-sans tracking-[0.15em] sm:tracking-[0.2em] py-3.5 rounded-sm text-xs uppercase font-bold transition-all duration-300 shadow-md hover:shadow-xl flex items-center justify-center gap-2 group"
              >
                <span>
                  {language === 'is'
                    ? "Ganga frá pöntun"
                    : language === 'es'
                    ? "Proceder a la compra"
                    : "Proceed to checkout"}
                </span>
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-100" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
