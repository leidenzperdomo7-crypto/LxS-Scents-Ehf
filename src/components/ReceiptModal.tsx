import React, { useRef } from "react";
import {
  X,
  Printer,
  Download,
  Share2,
  CheckCircle,
  Truck,
  MapPin,
  Calendar,
  CreditCard,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  QrCode
} from "lucide-react";
import { Language } from "../translations";
import { OrderData } from "../firebase";

interface ReceiptModalProps {
  order: OrderData;
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  onTrackOrder?: (order: OrderData) => void;
  hidePrices?: boolean;
}

export default function ReceiptModal({
  order,
  isOpen,
  onClose,
  language,
  onTrackOrder,
  hidePrices = false
}: ReceiptModalProps) {
  const receiptRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  // Calculations for Icelandic VAT (VSK 24%)
  const grandTotal = Number(order.total) || 0;
  const subtotal = Number(order.subtotal) || grandTotal;
  const discount = Number(order.discount) || 0;
  const shipping = Number(order.shipping) || 0;
  // In Iceland, standard VSK is 24% included in retail prices: VSK = Total * (24 / 124)
  const vskAmount = Math.round(grandTotal * (24 / 124));
  const netAmount = grandTotal - vskAmount;

  const formattedDate = order.date || (order.createdAt ? new Date(order.createdAt).toLocaleDateString(
    language === "is" ? "is-IS" : language === "es" ? "es-ES" : "en-US",
    { year: "numeric", month: "long", day: "numeric" }
  ) : new Date().toLocaleDateString());

  return (
    <div id="receipt-modal-backdrop" className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/65 backdrop-blur-xs animate-luxury-entrance">
      {/* Container */}
      <div className="bg-[#fbf9f5] border border-[#b2903b]/30 rounded-2xl max-w-2xl w-full max-h-[94vh] overflow-y-auto shadow-2xl relative flex flex-col font-sans text-neutral-900">
        
        {/* Top Action Bar (hidden when printing) */}
        <div className="p-4 sm:p-5 border-b border-[#b2903b]/20 bg-[#f5f0e6] flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-[#b2903b] font-bold">
              {hidePrices
                ? (language === "is" ? "AFGREIÐSLUSEÐILL / PAKKNINGALISTI" : language === "es" ? "HOJA DE DESPACHO / ALBARÁN OPERATIVO" : "PACKING & DISPATCH SLIP")
                : (language === "is" ? "OPINBER KAUPKVITTUN" : language === "es" ? "RECIBO FISCAL DE COMPRA" : "OFFICIAL PURCHASE RECEIPT")}
            </span>
            {!hidePrices && (
              <span className="text-[10px] font-mono text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full font-semibold">
                VSK nr. 148920
              </span>
            )}
            {hidePrices && (
              <span className="text-[10px] font-mono text-blue-800 bg-blue-100 px-2 py-0.5 rounded-full font-semibold">
                LOGÍSTICA & ALMACÉN
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              type="button"
              className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#b2903b] hover:bg-[#997c32] text-white rounded text-xs font-semibold shadow-xs transition-colors"
              title="Prenta eða vista sem PDF"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>{language === "is" ? "Prenta / PDF" : language === "es" ? "Imprimir / Guardar PDF" : "Print / PDF"}</span>
            </button>

            <button
              onClick={onClose}
              type="button"
              aria-label="Close"
              className="cursor-pointer text-neutral-400 hover:text-neutral-900 p-1.5 rounded-full hover:bg-neutral-200/50 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Receipt Body */}
        <div ref={receiptRef} className="p-6 sm:p-8 space-y-6 text-left bg-white print:p-0">
          {/* Brand Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-6 border-b-2 border-neutral-900 gap-4">
            <div>
              <h1 className="font-serif text-2xl sm:text-3xl italic font-bold tracking-tight text-neutral-900">
                LxS SCENTS
              </h1>
              <p className="text-[11px] font-sans text-neutral-600 tracking-wider uppercase mt-0.5">
                Haute Parfumerie
              </p>
              <div className="text-[10.5px] sm:text-xs text-neutral-600 font-sans mt-2 space-y-0.5">
                <div><span className="font-semibold text-neutral-900">{language === "is" ? "Seljandi:" : language === "es" ? "Vendedor:" : "Seller:"}</span> LxS Scents ehf.</div>
                <div><span className="font-semibold text-neutral-900">Kennitala:</span> 6906261600</div>
                <div><span className="font-semibold text-neutral-900">{language === "is" ? "Staðsetning:" : language === "es" ? "Ubicación:" : "Location:"}</span> 110 Reykjavík, Ísland</div>
                <div><span className="font-semibold text-neutral-900">{language === "is" ? "Netfang:" : language === "es" ? "Correo electrónico:" : "Email:"}</span> <a href="mailto:lxsscents@lxsscents.is" className="hover:underline text-[#b2903b]">lxsscents@lxsscents.is</a></div>
              </div>
            </div>

            <div className="text-left sm:text-right">
              <span className="text-[10px] font-mono uppercase text-neutral-400 font-bold block">
                {language === "is" ? "Kvittunarnúmer" : language === "es" ? "Recibo N°" : "Receipt No."}
              </span>
              <span className="font-mono text-base sm:text-lg font-bold text-[#b2903b]">
                REC-{order.id.replace('#', '')}-IS
              </span>
              <span className="text-[11px] font-mono text-neutral-500 block">
                {formattedDate}
              </span>
            </div>
          </div>

          {/* Customer & Shipping Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pb-6 border-b border-neutral-200 text-xs">
            <div>
              <span className="text-[10px] font-mono uppercase text-neutral-400 font-bold tracking-wider block mb-1.5">
                {language === "is" ? "Viðskiptavinur & Reikningsaðili" : language === "es" ? "Datos del Cliente" : "Billed & Shipped To"}
              </span>
              <div className="font-bold text-neutral-900 text-sm">{order.customerName}</div>
              <div className="text-neutral-700">{order.customerAddress}</div>
              {order.customerApartment && <div className="text-neutral-700">{order.customerApartment}</div>}
              <div className="text-neutral-700">{order.customerCityZip}</div>
              <div className="text-neutral-700">{order.customerCountry || "Iceland"}</div>
              <div className="text-neutral-500 font-mono mt-1">{order.customerEmail}</div>
              {order.customerPhone && <div className="text-neutral-500 font-mono">{order.customerPhone}</div>}
            </div>

            <div>
              <span className="text-[10px] font-mono uppercase text-neutral-400 font-bold tracking-wider block mb-1.5">
                {language === "is" ? "Flutnings- og greiðsluupplýsingar" : language === "es" ? "Detalles de Envío y Pago" : "Shipping & Payment Details"}
              </span>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-neutral-500">{language === "is" ? "Flutningsaðili:" : language === "es" ? "Transportista:" : "Carrier:"}</span>
                  <span className="font-semibold text-neutral-900">{order.carrier || "Dropp"}</span>
                </div>
                {order.shippingMethod && (
                  <div className="flex justify-between">
                    <span className="text-neutral-500">{language === "is" ? "Afhendingarmáti:" : language === "es" ? "Método:" : "Method:"}</span>
                    <span className="font-medium text-neutral-800">{order.shippingMethod}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-neutral-500">{language === "is" ? "Sendingarnúmer:" : language === "es" ? "N° de Guía:" : "Tracking #:"}</span>
                  <span className="font-mono font-bold text-[#b2903b]">{order.trackingNumber || "DP-849201"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">{language === "is" ? "Greiðslumáti:" : language === "es" ? "Método de pago:" : "Payment:"}</span>
                  <span className="font-medium text-neutral-800">{order.paymentMethod || "Kortagreiðsla (Card)"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">{language === "is" ? "Staða greiðslu:" : language === "es" ? "Estado de pago:" : "Payment Status:"}</span>
                  <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-[11px]">
                    {order.paymentStatus || (language === "is" ? "Greitt" : language === "es" ? "Pagado" : "Paid")}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Itemized Table */}
          <div>
            <span className="text-[10px] font-mono uppercase text-neutral-400 font-bold tracking-wider block mb-3">
              {hidePrices
                ? (language === "is" ? "Vörur til afgreiðslu og pökkunar" : language === "es" ? "Artículos a Preparar y Empacar" : "Items to Pack & Prepare")
                : (language === "is" ? "Sundurliðun á vörum" : language === "es" ? "Detalle de Productos" : "Purchased Items")}
            </span>

            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b border-neutral-300 text-neutral-500 font-mono text-[10px] uppercase">
                  <th className="py-2.5">{language === "is" ? "Vara" : language === "es" ? "Producto" : "Fragrance"}</th>
                  <th className="py-2.5 text-center">{language === "is" ? "Magn" : language === "es" ? "Cantidad" : "Qty"}</th>
                  {!hidePrices && <th className="py-2.5 text-right">{language === "is" ? "Einingaverð" : language === "es" ? "Precio Unit." : "Unit Price"}</th>}
                  {!hidePrices && <th className="py-2.5 text-right">{language === "is" ? "Samtals" : language === "es" ? "Total" : "Total"}</th>}
                  {hidePrices && <th className="py-2.5 text-center">{language === "is" ? "Stærð" : language === "es" ? "Empaque / Tamaño" : "Size"}</th>}
                  {hidePrices && <th className="py-2.5 text-right">{language === "is" ? "Staðfest" : language === "es" ? "Verificado" : "Verified"}</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {order.items && order.items.length > 0 ? (
                  order.items.map((it, idx) => (
                    <tr key={idx}>
                      <td className="py-3 font-medium text-neutral-900 pr-2">
                        <div className="flex items-center gap-2.5">
                          {it.image && (
                            <img
                              src={it.image}
                              alt={it.name}
                              className="w-9 h-9 rounded object-cover border border-neutral-200 shrink-0"
                            />
                          )}
                          <div>
                            <div className="font-semibold">{it.name}</div>
                            {it.size && <div className="text-[10px] text-neutral-500 font-mono">{it.size}</div>}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 text-center font-mono font-bold text-neutral-900">
                        x{it.quantity}
                      </td>
                      {!hidePrices && (
                        <td className="py-3 text-right font-mono text-neutral-600">
                          {it.price}
                        </td>
                      )}
                      {!hidePrices && (
                        <td className="py-3 text-right font-mono font-bold text-neutral-900">
                          {it.price}
                        </td>
                      )}
                      {hidePrices && (
                        <td className="py-3 text-center font-mono text-neutral-600">
                          {it.size || "50ml Flacon"}
                        </td>
                      )}
                      {hidePrices && (
                        <td className="py-3 text-right font-mono text-emerald-700 font-bold">
                          [ ✔ ] Listo
                        </td>
                      )}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={hidePrices ? 4 : 4} className="py-4 text-center text-neutral-500">
                      {order.itemsSummary || (language === "is" ? "Engin vörulýsing skráð" : language === "es" ? "Sin detalle de artículos" : "No item details")}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Financial Breakdown & Tax Details OR Staff Warehouse Verification Block */}
          {!hidePrices ? (
            <div className="pt-4 border-t-2 border-neutral-900 text-xs">
              <div className="max-w-xs ml-auto space-y-2">
                <div className="flex justify-between text-neutral-600">
                  <span>{language === "is" ? "Vörur án VSK:" : language === "es" ? "Subtotal neto (sin IVA):" : "Net Subtotal (excl. VAT):"}</span>
                  <span className="font-mono">{netAmount.toLocaleString("is-IS")} kr.-</span>
                </div>

                {discount > 0 && (
                  <div className="flex justify-between text-emerald-700 font-medium">
                    <span>{language === "is" ? `Afsláttur (${order.discountCode || "KÓÐI"}):` : `Descuento (${order.discountCode || "CUPÓN"}):`}</span>
                    <span className="font-mono">-{discount.toLocaleString("is-IS")} kr.-</span>
                  </div>
                )}

                <div className="flex justify-between text-neutral-600">
                  <span>{language === "is" ? "Sendingarkostnaður:" : language === "es" ? "Costo de Envío:" : "Shipping Fee:"}</span>
                  <span className="font-mono">{shipping === 0 ? "0 kr.- (Frítt)" : `${shipping.toLocaleString("is-IS")} kr.-`}</span>
                </div>

                <div className="flex justify-between text-neutral-600">
                  <span>{language === "is" ? "Þar af VSK (24%):" : language === "es" ? "IVA 24% (incluido):" : "Included VAT (24%):"}</span>
                  <span className="font-mono">{vskAmount.toLocaleString("is-IS")} kr.-</span>
                </div>

                <div className="pt-2 border-t-2 border-neutral-900 flex justify-between font-bold text-base sm:text-lg text-neutral-950">
                  <span>{language === "is" ? "Greitt alls (m/ VSK):" : language === "es" ? "Total Pagado (IVA inc.):" : "Total Paid (incl. VAT):"}</span>
                  <span className="font-mono text-[#b2903b]">{grandTotal.toLocaleString("is-IS")} kr.-</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="pt-4 border-t-2 border-neutral-900 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
                <div className="p-3.5 bg-neutral-50 rounded-lg border border-neutral-200">
                  <span className="text-[10px] uppercase font-bold text-neutral-500 block mb-1">
                    Control de Empaque & Calidad de Fragancias
                  </span>
                  <div className="flex items-center gap-1.5 text-emerald-800 font-semibold mt-1">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    <span>Control de frascos y atomizadores verificado</span>
                  </div>
                  <p className="text-[10px] text-neutral-500 mt-1">
                    Operador responsable: Almacén y Despacho LxS SCENTS
                  </p>
                </div>

                <div className="p-3.5 bg-neutral-50 rounded-lg border border-neutral-200">
                  <span className="text-[10px] uppercase font-bold text-neutral-500 block mb-1">
                    Instrucciones de Despacho y Recolección
                  </span>
                  <p className="text-neutral-900 font-semibold">
                    {order.carrier || "Dropp"} • {order.shippingMethod || "Afhendingarstaður"}
                  </p>
                  <p className="text-[11px] text-neutral-600 mt-1">
                    N° Guía: <span className="font-bold text-[#b2903b]">{order.trackingNumber || "IS-PENDIENTE"}</span>
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Fiscal Authentication & QR / Barcode Section */}
          <div className="pt-6 border-t border-neutral-200 flex flex-wrap items-center justify-between gap-4 text-[10px] text-neutral-500 font-mono">
            <div className="space-y-1">
              <div className="font-bold text-neutral-900 text-[11px] font-sans">
                {language === "is" ? "Seljandi:" : language === "es" ? "Vendedor:" : "Seller:"} LxS Scents ehf. • Kennitala: 6906261600
              </div>
              <div className="text-neutral-700 font-sans text-[10.5px]">
                {language === "is" ? "Staðsetning:" : language === "es" ? "Ubicación:" : "Location:"} 110 Reykjavík, Ísland • {language === "is" ? "Netfang:" : language === "es" ? "Correo electrónico:" : "Email:"} <a href="mailto:lxsscents@lxsscents.is" className="hover:underline text-[#b2903b]">lxsscents@lxsscents.is</a>
              </div>
              <div className="text-neutral-500 text-[10px]">AUTH CODE: MAISON-{Math.floor(Math.random() * 8999999 + 1000000)} • ORDER ID: {order.id}</div>
              <div className="text-neutral-600 font-sans font-medium text-[10.5px] pt-0.5">
                Greiðslukvittun og færsluhirðing er gefin út af Kling.is
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="border border-neutral-300 p-1.5 rounded bg-white">
                <QrCode className="w-10 h-10 text-neutral-800" />
              </div>
              <div className="text-left text-[9px] text-neutral-400 leading-tight">
                <div>INNSIGLAÐ</div>
                <div>VERIFIED</div>
                <div className="text-emerald-700 font-bold">{hidePrices ? "DESPACHADO" : "GREITT"}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer (hidden when printing) */}
        <div className="p-4 sm:p-5 border-t border-[#b2903b]/20 bg-[#f5f0e6] flex flex-wrap items-center justify-between gap-3 print:hidden">
          {onTrackOrder && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onTrackOrder(order);
              }}
              className="cursor-pointer inline-flex items-center gap-1.5 text-xs text-[#b2903b] hover:text-[#997c32] font-bold"
            >
              <Truck className="w-4 h-4" />
              <span>{language === "is" ? "Skoða rauntíma rakningu" : language === "es" ? "Ver seguimiento en vivo" : "View live tracking"}</span>
            </button>
          )}

          <div className="flex items-center gap-2 ml-auto">
            <button
              type="button"
              onClick={handlePrint}
              className="cursor-pointer px-4 py-2 bg-[#b2903b] hover:bg-[#997c32] text-white rounded text-xs font-semibold shadow-sm transition-colors flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>{language === "is" ? "Prenta kvittun" : language === "es" ? "Imprimir recibo" : "Print receipt"}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="cursor-pointer px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded text-xs font-medium transition-colors"
            >
              {language === "is" ? "Loka" : language === "es" ? "Cerrar" : "Close"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
