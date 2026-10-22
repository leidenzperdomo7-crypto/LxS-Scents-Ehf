export type Language = "en" | "is" | "es";

export interface TranslationSchema {
  subTitle: string;
  heroHeaderFirst: string;
  heroHeaderSecondary: string;
  tagline: string;
  exploreCollection: string;
  launchSommelier: string;
  atelier: string;
  parfums: string;
  artOlfactif: string;
  sommelier: string;
  collectionBag: string;
  scentSommelierTitle: string;
  scentSommelierSubtitle: string;
  sommelierIntro: string;
  inspiredByLabel: string;
  searchPlaceholder: string;
  searchByLabel: string;
  allGenders: string;
  pourFemmeFlag: string;
  pourHommeFlag: string;
  unisexFlag: string;
  splitFemmeTitle: string;
  splitFemmeDesc: string;
  splitHommeTitle: string;
  splitHommeDesc: string;
  viewAllSection: string;
  boutiqueDiscountNotification: string;
  discountOfferText: string;
  discountBtnText: string;
  discountCodeLabel: string;
  dismissText: string;
  vatLabel: string;
  freeShippingLabel: string;
  securedTotal: string;
  recipientNameLabel: string;
  deliveryCoordinatesLabel: string;
  confirmCoordinatesBtn: string;
  enterRecipientBtn: string;
  concludeSessionBtn: string;
  orderCodeLabel: string;
  reservationLoggedTitle: string;
  sommelierStepTitle1: string;
  sommelierStepLabel1: string;
  sommelierStepTitle2: string;
  sommelierStepLabel2: string;
  sommelierStepTitle3: string;
  sommelierStepLabel3: string;
  sommelierStepTitle4: string;
  sommelierStepLabel4: string;
  sommelierStepTitle5: string;
  sommelierStepLabel5: string;
  sommelierFormulateBtn: string;
  addToBagBtn: string;
  ritualBtnText: string;
  aboutTabLabel: string;
  notePyramidLabel: string;
  materialLibraryTitle: string;
  materialLibraryHeader: string;
  materialLibraryIntro: string;
  traceabilityBadgeTitle: string;
  traceabilityBadgeDesc: string;
  originLabel: string;
  exploreSourcingLabel: string;
  customEditionTitle: string;
  customEditionDesc: string;
  atomizeTitle: string;
  atomizeCeremonyIntro: string;
  atomizeClickToSpray: string;
  atomizeSpraying: string;
  reformulateBtn: string;
  bestSellerMenu: string;
  womenMenu: string;
  menMenu: string;
  membershipMenu: string;
  aboutUsMenu: string;
  contactMenu: string;
}

export const TRANSLATIONS: Record<Language, TranslationSchema> = {
  en: {
    subTitle: "LxS SCENTS",
    heroHeaderFirst: "Your Own",
    heroHeaderSecondary: "Signature Scent",
    tagline: "EXPERIENCE THE WORLD'S MOST COVETED FRAGRANCES WITHOUT THE DESIGNER MARKUP\nLUXURY SCENTS - HONESTLY PRICED",
    exploreCollection: "Explore Collection",
    launchSommelier: "Launch Scent Sommelier",
    atelier: "L'Atelier",
    parfums: "Les Parfums",
    artOlfactif: "L'Art Olfactif",
    sommelier: "Scent Sommelier",
    collectionBag: "Your Shopping Cart",
    scentSommelierTitle: "Scent Sommelier",
    scentSommelierSubtitle: "L'Atelier d'Intelligence Olfactive",
    sommelierIntro: "We do not merely create perfumes, we distill memories. Describe your desired spiritual coordinate, mood, and favored compound materials, and our AI scent sommelier will synthesize your bespoke signature bottling.",
    inspiredByLabel: "Inspired by:",
    searchPlaceholder: "Search fragrance name, notes (rose, saffron) or brand (Tom Ford, Byredo)...",
    searchByLabel: "Search",
    allGenders: "Collections",
    pourFemmeFlag: "Pour Femme (Women)",
    pourHommeFlag: "Pour Homme (Men)",
    unisexFlag: "Unisex",
    splitFemmeTitle: "Ladies Collection",
    splitFemmeDesc: "",
    splitHommeTitle: "Gentlemen Collection",
    splitHommeDesc: "",
    viewAllSection: "View Selected Anthology",
    boutiqueDiscountNotification: "Exclusive Atelier Invitation",
    discountOfferText: "We invite you to experience LxS SCENTS with a complimentary 20% savings on your first purchase.",
    discountBtnText: "Claim Scent Privilege",
    discountCodeLabel: "YOUR PRIVILEGE CODE",
    dismissText: "Close Invitation",
    vatLabel: "VAT (11%)",
    freeShippingLabel: "Express Secure Courier Shipping",
    securedTotal: "Secured Total",
    recipientNameLabel: "Secure Recipient Full Name",
    deliveryCoordinatesLabel: "Delivery Address",
    confirmCoordinatesBtn: "Confirm Delivery Address",
    enterRecipientBtn: "Enter Delivery Recipient First",
    concludeSessionBtn: "Conclude Order",
    orderCodeLabel: "Secure Order Code",
    reservationLoggedTitle: "Order Logged",
    sommelierStepTitle1: "01 • Olfactory Aura",
    sommelierStepLabel1: "Olfactory Aura Atmosphere",
    sommelierStepTitle2: "02 • Sartorial Esthetic",
    sommelierStepLabel2: "Sartorial Esthetic / Fashion Coordinate",
    sommelierStepTitle3: "03 • Projection",
    sommelierStepLabel3: "Projection Weight & Intensity Trace",
    sommelierStepTitle4: "04 • Absolutes Selection",
    sommelierStepLabel4: "Primary Botanical Absolutes (Select up to 4)",
    sommelierStepTitle5: "05 • Poetic Notes",
    sommelierStepLabel5: "Atmospheric / Sensory Prose Instructions (Optional)",
    sommelierFormulateBtn: "Commence Olfactory Formulation",
    addToBagBtn: "ADD TO CART",
    ritualBtnText: "L'Art du Rituel",
    aboutTabLabel: "About",
    notePyramidLabel: "Note Pyramid",
    materialLibraryTitle: "Matières Premières Absolues",
    materialLibraryHeader: "L'Art Olfactif & Sourcing",
    materialLibraryIntro: "Our search for authentic elegance. We partner with vetted fragrance houses worldwide, ensuring that every drop of fragrance oil is ethically sourced, macerated to optimal maturity, and bottled with precision.",
    traceabilityBadgeTitle: "100% Quality & Authenticity Pledge",
    traceabilityBadgeDesc: "Every bottle of LxS SCENTS is formulated in certified laboratories complying with strict IFRA standards.",
    originLabel: "Origin:",
    exploreSourcingLabel: "Explore Sourcing",
    customEditionTitle: "L'Édition Unique",
    customEditionDesc: "Includes customized physical formulation, master bottle engraving, custom travel vial matching, and premium courier delivery.",
    atomizeTitle: "Atelier wear ceremony",
    atomizeCeremonyIntro: "Review the custom formulated ceremony to atomize your signature formulation correctly onto your pulse zones:",
    atomizeClickToSpray: "Click to Spray Essence",
    atomizeSpraying: "Spraying Aura Mist",
    reformulateBtn: "Reformulate",
    bestSellerMenu: "Best Sellers",
    womenMenu: "Ladies",
    menMenu: "Gentlemen",
    membershipMenu: "Membership",
    aboutUsMenu: "About Us",
    contactMenu: "Contact"
  },
  is: {
    subTitle: "LxS SCENTS",
    heroHeaderFirst: "Þinn Eigin",
    heroHeaderSecondary: "Einkennisilmur",
    tagline: "UPPLIFÐU EFTIRSÓTTUSTU ILMI HEIMS - ÁN HÖNNUÐAÁLAGNINGAR\nLÚXUSILMIR – SANNGJARNT VERÐ",
    exploreCollection: "SKOÐA VÖRUÚRVAL",
    launchSommelier: "Opna Ilmsómmer",
    atelier: "Atelier-ið",
    parfums: "Les Parfums",
    artOlfactif: "Ilmlist",
    sommelier: "Ilmsómmer",
    collectionBag: "KARFAN MÍN",
    scentSommelierTitle: "Ilmsómmer",
    scentSommelierSubtitle: "Atelier gervigreindarilmsins",
    sommelierIntro: "Við búum ekki bara til ilmvatn, við eimum minningar. Lýstu þinni andlegu hnit, skapi og uppáhalds hráefnum og gervigreindar-sómmerinn okkar mun hanna þinn einstaka ilmsmit.",
    inspiredByLabel: "Innblásið af:",
    searchPlaceholder: "Leitaðu að ilmi, nótum (rós, saffran) eða vörumerki (Tom Ford, Byredo)...",
    searchByLabel: "Leita",
    allGenders: "Vöruúrval",
    pourFemmeFlag: "Fyrir Henni (Pour Femme)",
    pourHommeFlag: "Fyrir Honum (Pour Homme)",
    unisexFlag: "Unisex ilmur",
    splitFemmeTitle: "Dömu Ilmir",
    splitFemmeDesc: "",
    splitHommeTitle: "Herra Ilmir",
    splitHommeDesc: "",
    viewAllSection: "Skoða valið safn",
    boutiqueDiscountNotification: "Einkatilboð frá LxS SCENTS",
    discountOfferText: "Við bjóðum þér að upplifa LxS SCENTS með 20% kynningarafslætti á þinni fyrstu flösku eða klassískum kaupum.",
    discountBtnText: "Virkja Ilmréttindi",
    discountCodeLabel: "EINKAKÓÐINN ÞINN",
    dismissText: "Loka boðskorði",
    vatLabel: "Virðisaukaskattur (VSK 11%)",
    freeShippingLabel: "Örugg hraðsending með sendiboða",
    securedTotal: "Heildarverð",
    recipientNameLabel: "Nafn móttakanda",
    deliveryCoordinatesLabel: "Heimilisfang afhendingar",
    confirmCoordinatesBtn: "Staðfesta Heimilisfang",
    enterRecipientBtn: "Sláðu inn nafn móttakanda",
    concludeSessionBtn: "Ljúka pöntun",
    orderCodeLabel: "Pöntunarkóði",
    reservationLoggedTitle: "Pöntun Skráð",
    sommelierStepTitle1: "01 • Ilmskip",
    sommelierStepLabel1: "Andrúmsloft eða stemning ilmsins",
    sommelierStepTitle2: "02 • Klæðnaður",
    sommelierStepLabel2: "Klæðastíll eða tískukóði",
    sommelierStepTitle3: "03 • Styrkur",
    sommelierStepLabel3: "Styrkleiki og slóð ilmsins",
    sommelierStepTitle4: "04 • Hráefnaval",
    sommelierStepLabel4: "Aðal botanical hráefni (veldu allt að 4)",
    sommelierStepTitle5: "05 • Lýsing",
    sommelierStepLabel5: "Andrúmsloft eða tilfinningalýsing í texta (valfrjálst)",
    sommelierFormulateBtn: "Hefja ilmsmíð",
    addToBagBtn: "SETJA Í KÖRFU",
    ritualBtnText: "Siðir ilmsins",
    aboutTabLabel: "Saga",
    notePyramidLabel: "Ilmpíramídi",
    materialLibraryTitle: "Matières Premières Absolues",
    materialLibraryHeader: "Ilmlist og Uppruni",
    materialLibraryIntro: "Leit okkar að gæðum og hreinleika. Við veljum eingöngu vottaðar ilmolíur og náttúruleg hráefni sem uppfylla ströngustu alþjóðlegu IFRA öryggisstaðla.",
    traceabilityBadgeTitle: "100% Gæðatrygging og hreinleiki",
    traceabilityBadgeDesc: "Sérhver flaska af LxS SCENTS er framleidd samkvæmt ströngustu stöðlum með vottuðum ilmefnum.",
    originLabel: "Uppruni:",
    exploreSourcingLabel: "Skoða uppruna",
    customEditionTitle: "Einstök útgáfa",
    customEditionDesc: "Inniheldur sérsniðna formúlu, leturgröft á flöskuna, ferðaglas sem passar við og flotta hraðsendingu.",
    atomizeTitle: "Siðvenjur ilmsins",
    atomizeCeremonyIntro: "Skoðaðu þessa sérsniðnu siðvenju til að sprauta ilminum rétt á þína púlsstaði:",
    atomizeClickToSpray: "Sprauta ilminum",
    atomizeSpraying: "Smitar ilmtáru á húð",
    reformulateBtn: "Sérsníða aftur",
    bestSellerMenu: "Vinsælast",
    womenMenu: "Dömur",
    menMenu: "Herrar",
    membershipMenu: "Áskriftir",
    aboutUsMenu: "Um Okkur",
    contactMenu: "Hafa Samband"
  },
  es: {
    subTitle: "LxS SCENTS",
    heroHeaderFirst: "Tu Propio",
    heroHeaderSecondary: "Aroma Personal",
    tagline: "EXPERIMENTA LAS FRAGANCIAS MÁS CODICIADAS SIN EL PRECIO DE DISEÑADOR\nAROMAS DE LUJO - A PRECIOS JUSTOS",
    exploreCollection: "Explorar Colección",
    launchSommelier: "Iniciar Sommelier de Aromas",
    atelier: "El Taller",
    parfums: "Los Perfumes",
    artOlfactif: "Arte Olfativo",
    sommelier: "Sommelier de Aromas",
    collectionBag: "Tu Carrito",
    scentSommelierTitle: "Sommelier de Aromas",
    scentSommelierSubtitle: "El Taller de Inteligencia Olfativa",
    sommelierIntro: "No solo creamos perfumes, destilamos recuerdos. Describe tus emociones, tu estado de ánimo y los materiales preferidos, y nuestro sommelier de inteligencia artificial creará tu aroma personalizado.",
    inspiredByLabel: "Inspirado en:",
    searchPlaceholder: "Buscar perfume, notas o marca...",
    searchByLabel: "Buscar",
    allGenders: "Colecciones",
    pourFemmeFlag: "Para Ella",
    pourHommeFlag: "Para Él",
    unisexFlag: "Unisex",
    splitFemmeTitle: "Línea Femenina",
    splitFemmeDesc: "Flores blancas aterciopeladas y suave ámbar.",
    splitHommeTitle: "Línea Masculina",
    splitHommeDesc: "Maderas oscuras, especias y cuero rico.",
    viewAllSection: "Ver toda la colección",
    boutiqueDiscountNotification: "Alerta de Descuento",
    discountOfferText: "Obtén un 20% de descuento en tu primer pedido personalizado o clásico.",
    discountBtnText: "Reclamar Descuento",
    discountCodeLabel: "TU CÓDIGO",
    dismissText: "Cerrar",
    vatLabel: "IVA (12%)",
    freeShippingLabel: "Envío Gratuito Garantizado",
    securedTotal: "Total Seguro",
    recipientNameLabel: "Nombre del Destinatario",
    deliveryCoordinatesLabel: "Dirección de Entrega",
    confirmCoordinatesBtn: "Confirmar Dirección",
    enterRecipientBtn: "Ingresar Nombre",
    concludeSessionBtn: "Concluir",
    orderCodeLabel: "Código de Pedido",
    reservationLoggedTitle: "Reserva Registrada",
    sommelierStepTitle1: "01 • Inspiración",
    sommelierStepLabel1: "Atmósfera del aroma",
    sommelierStepTitle2: "02 • Estilo",
    sommelierStepLabel2: "Código de vestimenta",
    sommelierStepTitle3: "03 • Fuerza",
    sommelierStepLabel3: "Intensidad",
    sommelierStepTitle4: "04 • Ingredientes",
    sommelierStepLabel4: "Componentes botánicos principales",
    sommelierStepTitle5: "05 • Descripción",
    sommelierStepLabel5: "Descripción opcional",
    sommelierFormulateBtn: "Crear Aroma",
    addToBagBtn: "Agregar a la Bolsa",
    ritualBtnText: "Ritual de Fragancia",
    aboutTabLabel: "Historia",
    notePyramidLabel: "Pirámide Olfativa",
    materialLibraryTitle: "Librería de Materiales",
    materialLibraryHeader: "Ingredientes Crudos",
    materialLibraryIntro: "Colaboramos de forma ética en todo el mundo.",
    traceabilityBadgeTitle: "100% Trazabilidad",
    traceabilityBadgeDesc: "Cada botella cuenta con un registro de ingredientes.",
    originLabel: "Origen:",
    exploreSourcingLabel: "Ver opciones de origen",
    customEditionTitle: "Edición Personalizada",
    customEditionDesc: "Contiene una botella grabada a medida.",
    atomizeTitle: "Vaporizar",
    atomizeCeremonyIntro: "Ceremonia de pulverización",
    atomizeClickToSpray: "Clic para vaporizar",
    atomizeSpraying: "Vaporizando...",
    reformulateBtn: "Reformular",
    bestSellerMenu: "Más Vendidos",
    womenMenu: "Mujeres",
    menMenu: "Hombres",
    membershipMenu: "Membresías",
    aboutUsMenu: "Nosotros",
    contactMenu: "Contacto"
  }
};
