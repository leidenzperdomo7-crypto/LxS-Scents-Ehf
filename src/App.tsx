import { useState, useEffect, useRef } from "react";
import { Sparkles, Eye, Compass, BookOpen, Layers, Info, HelpCircle, X, Gift, Check, CheckCircle, Search, ShieldAlert, Award, Instagram, Facebook, Music, ChevronDown } from "lucide-react";
import Navbar from "./components/Navbar";
import ProductSection from "./components/ProductSection";
import CartDrawer from "./components/CartDrawer";
import ContactPage from "./components/ContactPage";
import ProfilePage from "./components/ProfilePage";
import CollectionView from "./components/CollectionView";
import CheckoutPage from "./components/CheckoutPage";
import ProductPage from "./components/ProductPage";
import SubscriptionsSection from "./components/SubscriptionsSection";
import { Fragrance, CustomScent, CartItem } from "./types";
import { FRAGRANCES, getIskPriceNumber } from "./data";
import { Language, TRANSLATIONS } from "./translations";
import { IMAGES } from "./imageConfig";
import emailjs from '@emailjs/browser';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';
import { getEmailJsConfig } from './emailPromo';
import {
  auth,
  onAuthStateChanged,
  saveUserCartToFirestore,
  subscribeToUserCart,
  clearUserCartInFirestore,
  saveOrderToFirestore
} from "./firebase";

const DOTTIR_FAQS = [
  { question: 'What is a perfume dupe or "inspired by" fragrance?', answer: 'We create original fragrances that are carefully crafted to mimic the scent profiles, key notes, and overall vibe of popular luxury perfumes. We focus on recreating the molecular architecture of the scent without charging the premium associated with designer brand marketing.' },
  { question: 'How long will the fragrance last on my skin?', answer: 'Our Perfumes are formulated for extreme longevity, lasting up to 12 hours on a single application.' },
  { question: 'Are your fragrances vegan and cruelty-free?', answer: 'Yes, our entire collection is 100% vegan and certified cruelty-free. We never test on animals, nor do we use any animal-derived ingredients in our formulations.' },
  { question: 'Are your perfumes safe for sensitive skin?', answer: "We formulate our fragrances following strict safety guidelines and avoid common allergens wherever possible. However, because everyone's skin chemistry is different, we highly recommend doing a patch-testing on your wrist before applying it fully." },
  { question: 'Do you offer international shipping?', answer: 'We currently ship to most major international destinations. Shipping costs, applicable customs duties, and delivery times are automatically calculated at checkout based on your exact location.' },
  { question: 'What is your return policy?', answer: 'We accept returns on eligible items within 10 days of the delivery date. The fragrance must be returned in its original packaging and in pristine condition, with the sticker fully intact. Once we receive and inspect your return, a full refund will be issued to your original form of payment within 5–7 business days.' },
  { question: 'Can I track my package?', answer: 'Yes. When your package is sent from the warehouse, you will receive an email with a tracking link where you can follow your package.' },
  { question: 'My order has not arrived, what should I do?', answer: 'When your package is sent from our warehouse, you received an email with a tracking link where you can track your package. If you cannot see your package via the tracking link, please contact us.' },
  { question: 'How should I store my perfume?', answer: 'To preserve the integrity and lifespan of the fragrance notes, keep your bottle in a cool, dry place. Extreme heat, direct sunlight, and humidity can break down the fragrance oils over time. A dark drawer or a closet shelf is the ideal environment.' },
  { question: 'How can I make my perfume last longer?', answer: 'Fragrance binds best to hydrated skin. For maximum longevity, apply an unscented lotion or body oil before spraying your perfume. Focus on your pulse points, where your body naturally emits heat to help project the scent, like your wrists, inner elbows, base of the neck and behind the knees.' },
  { question: 'Should I rub my wrists together after applying?', answer: 'No, rubbing your wrists together creates friction that can heat up the skin and "crush" the delicate top notes of the perfume, causing the scent to alter and fade much faster. Simply spray and let it air dry.' }
];

const DOTTIR_FAQS_IS = [
  { question: 'Hvað er ilmvatnslíking („dupe“) eða „innblásinn“ ilmur?', answer: 'Ilmirnir okkar eru vandlega blandaðir til að endurspegla nákvæmlega lyktina, helstu tónana og upplifunina af vinsælum hönnunarilmum. Við smíðum ilminn frá grunni til að ná fram nákvæmlega sömu gæðum, án þess að krefjast þess háa verðs sem annars fer í að borga fyrir lúxusmerkið sjálft.' },
  { question: 'Hversu lengi endist ilmurinn á húðinni?', answer: 'Ilmvötnin okkar eru samsett fyrir sérstaklega langa endingu og haldast í allt að 12 klukkustundir eftir eina úðun.' },
  { question: 'Eru ilmirnir ykkar vegan og ekki prófaðir á dýrum?', answer: 'Já, öll línan okkar er 100% vegan og með cruelty-free vottun. Við prófum aldrei á dýrum og notum engin innihaldsefni úr dýraríkinu í blöndurnar okkar.' },
  { question: 'Eru ilmvötnin ykkar örugg fyrir viðkvæma húð?', answer: 'Við framleiðum ilmina okkar samkvæmt ströngum öryggisstöðlum og forðumst algenga ofnæmisvalda eins og frekast er unnt. Þar sem húð er þó mismunandi frá manni til manns, mælum við eindregið með því að prófa ilminn fyrst á litlum fleti húðarinnar áður en hann er notaður að fullu.' },
  { question: 'Bjóðið þið upp á sendingar til útlanda?', answer: 'Sem stendur sendum við til helstu áfangastaða um allan heim. Sendingarkostnaður, hugsanleg tollgjöld og afhendingartími reiknast sjálfkrafa í greiðsluferlinu miðað við nákvæma staðsetningu þína.' },
  { question: 'Hvernig virka vöruskil?', answer: 'Þú getur skilað vörum til okkar innan 10 daga frá því að þú færð þær afhentar. Til að fá vöruna endurgreidda þarf ilmvatnið að vera í upprunalegum umbúðum, alveg ónotað og innsiglið óbrotið. Um leið og við höfum tekið við vörunni, farið yfir hana og samþykkt vöruskil og endurgreiðslu, endurgreiðum við upphæðina að fullu á þann greiðslumiðil sem notaður var við kaupin. Það tekur venjulega 5-7 virka daga fyrir endurgreiðsluna að skila sér.' },
  { question: 'Get ég rakið sendinguna mína?', answer: 'Já. Þegar pakkinn þinn er sendur frá vöruhúsinu færðu tölvupóst með sendingarnúmeri þar sem þú getur fylgst með sendingunni þinni.' },
  { question: 'Pöntunin mín er ekki komin, hvað á ég að gera?', answer: 'Þegar pakkinn þinn fór frá vöruhúsinu okkar fékkst þú tölvupóst með samningsnúmeri þar sem þú getur fylgst með sendingunni. Ef þú getur ekki séð upplýsingar um pakkann þinn í gegnum samningsnúmerið skaltu endilega hafa samband við okkur.' },
  { question: 'Hvernig geymi ég ilmvatnið best?', answer: 'Til að tryggja að ilmurinn haldi sér sem lengst mælum við með að geyma glasið á þurrum og svölum stað. Beint sólarljós, raki og mikill hiti geta skemmt ilmolíurnar með tímanum. Besta geymslan er því einfaldlega inni í lokuðum skáp eða í dimmri skúffu.' },
  { question: 'Hvernig læt ég ilmvatnið endast betur á húðinni?', answer: 'Til að ilmurinn endist sem lengst er best að spreyja honum á vel nærða og raka húð, gjarnan yfir lyktarlaust krem. Beindu úðanum að púlspunktum líkamans — úlnliðum, hálsi, og innanverðum olnbogum og hnjám. Þar virkjar líkamshitinn ilminn og hjálpar honum að dreifast yfir daginn.' },
  { question: 'Á ég að nudda úlnliðunum saman eftir á?', answer: 'Nei, alls ekki. Núningurinn hitar upp húðina og skemmir efstu ilmtónana, þannig að ilmurinn endist skemur og getur meira að segja breytt um lykt. Leyfðu ilmvatninu bara að loftþorna af sjálfu sér eftir að þú úðar því á þig.' }
];

const DOTTIR_PRIVACY_SECTIONS = [
  {
    title: "Changes to This Privacy Policy",
    content: (
      <div className="space-y-1.5">
        <p>We may update this Privacy Policy from time to time, including to reflect changes to our practices or for other operational, legal, or regulatory reasons. We will post the revised Privacy Policy on the Site, update the "Last updated" date and take any other steps required by applicable law.</p>
      </div>
    )
  },
  {
    title: "How We Collect and Use Your Personal Information",
    content: (
      <div className="space-y-1.5">
        <p>To provide the Services, we collect personal information about you from a variety of sources, as set out below. The information that we collect and use varies depending on how you interact with us.</p>
        <p>In addition to the specific uses set out below, we may use information we collect about you to communicate with you, provide or improve or improve the Services, comply with any applicable legal obligations, enforce any applicable terms of service, and to protect or defend the Services, our rights, and the rights of our users or others.</p>
      </div>
    )
  },
  {
    title: "What Personal Information We Collect",
    content: (
      <div className="space-y-1.5">
        <p>The types of personal information we obtain about you depends on how you interact with our Site and use our Services. When we use the term "personal information", we are referring to information that identifies, relates to, describes or can be associated with you. The following sections describe the categories and specific types of personal information we collect.</p>
      </div>
    )
  },
  {
    title: "Information We Collect Directly from You",
    content: (
      <div className="space-y-1.5">
        <p>Information that you directly submit to us through our Services may include:</p>
        <ul className="list-disc pl-5 space-y-2">
          <li><strong>Contact details</strong> including your name, address, phone number, and email.</li>
          <li><strong>Order information</strong> including your name, billing address, shipping address, payment confirmation, email address, and phone number.</li>
          <li><strong>Account information</strong> including your username, password, security questions and other information used for account security purposes.</li>
          <li><strong>Customer support information</strong> including the information you choose to include in communications with us, for example, when sending a message through the Services.</li>
        </ul>
        <p>Some features of the Services may require you to directly provide us with certain information about yourself. You may elect not to provide this information, but doing so may prevent you from using or accessing these features.</p>
      </div>
    )
  },
  {
    title: "Information We Collect about Your Usage",
    content: (
      <div className="space-y-1.5">
        <p>We may also automatically collect certain information about your interaction with the Services ("Usage Data"). To do this, we may use cookies, pixels and similar technologies ("Cookies"). Usage Data may include information about how you access and use our Site and your account, including device information, browser information, information about your network connection, your IP address and other information regarding your interaction with the Services.</p>
      </div>
    )
  },
  {
    title: "Information We Obtain from Third Parties",
    content: (
      <div className="space-y-1.5">
        <p>Finally, we may obtain information about you from third parties, including from vendors and service providers who may collect information on our behalf, such as:</p>
        <ul className="list-disc pl-5 space-y-2">
          <li>Companies who support our Site and Services.</li>
          <li>Our payment processors, who collect payment information (e.g., bank account, credit or debit card information, billing address) to process your payment in order to fulfill your orders and provide you with products or services you have requested, in order to perform our contract with you.</li>
          <li>When you visit our Site, open or click on emails we send you, or interact with our Services or advertisements, we, or third parties we work with, may automatically collect certain information using online tracking technologies such as pixels, web beacons, software developer kits, third-party libraries, and cookies.</li>
        </ul>
        <p>Any information we obtain from third parties will be treated in accordance with this Privacy Policy. Also see the section below, Third Party Websites and Links.</p>
      </div>
    )
  },
  {
    title: "How We Use Your Personal Information",
    content: (
      <div className="space-y-1.5">
        <ul className="list-disc pl-5 space-y-2">
          <li><strong>Providing Products and Services.</strong> We use your personal information to provide you with the Services in order to perform our contract with you, including to process your payments, fulfill your orders, to send notifications to you related to your account, purchases, returns, exchanges or other transactions, to create, maintain and otherwise manage your account, to arrange for shipping, facilitate any returns and exchanges and other features and functionalities related to your account.</li>
          <li><strong>Marketing and Advertising.</strong> We may use your personal information for marketing and promotional purposes, such as to send marketing, advertising and promotional communications by email, text message or postal mail, and to show you advertisements for products or services. This may include using your personal information to better tailor the Services and advertising on our Site and other websites. If you are an EEA resident, the legal basis for these data processing activities is our legitimate interest in selling our products, according to Art. 6 (1) (f) GDPR.</li>
          <li><strong>Security and Fraud Prevention.</strong> We use your personal information to detect, investigate or take action regarding possible fraudulent, illegal or malicious activity. If you choose to use the Services and register an account, you are responsible for keeping your account credentials safe. We highly recommend that you do not share your username, password, or other access details with anyone else. If you believe your account has been compromised, please contact us immediately. If you are an EEA resident, the legal basis for these data processing activities is our legitimate interest in keeping our website secure for you and other customers, according to Art. 6 (1) (f) GDPR.</li>
          <li><strong>Communicating with You and Service Improvement.</strong> We use your personal information to provide you with customer support and improve our Services. This is in our legitimate interests in order to be responsive to you, to provide effective services to you, and to maintain our business relationship with you according to Art. 6 (1) (f) GDPR.</li>
        </ul>
      </div>
    )
  },
  {
    title: "Cookies",
    content: (
      <div className="space-y-1.5">
        <p>Like many websites, we use Cookies on our Site. We use Cookies to power and improve our Site and our Services (including to remember your actions and preferences), to run analytics and better understand user interaction with the Services (in our legitimate interests to administer, improve and optimize the Services). We may also permit third parties and services providers to use Cookies on our Site to better tailor the services, products and advertising on our Site and other websites.</p>
        <p>Most browsers automatically accept Cookies by default, but you can choose to set your browser to remove or reject Cookies through your browser controls. Please keep in mind that removing or blocking Cookies can negatively impact your user experience and may cause some of the Services, including certain features and general functionality, to work incorrectly or no longer be available. Additionally, blocking Cookies may not completely prevent how we share information with third parties such as our advertising partners.</p>
      </div>
    )
  },
  {
    title: "How We Disclose Personal Information",
    content: (
      <div className="space-y-1.5">
        <p>In certain circumstances, we may disclose your personal information to third parties for contract fulfillment purposes, legitimate purposes and other reasons subject to this Privacy Policy. Such circumstances may include:</p>
        <ul className="list-disc pl-5 space-y-2">
          <li>With vendors or other third parties who perform services on our behalf (e.g., IT management, payment processing, data analytics, customer support, cloud storage, fulfillment and shipping).</li>
          <li>With business and marketing partners to provide services and advertise to you. Our business and marketing partners will use your information in accordance with their own privacy notices.</li>
          <li>When you direct, request us or otherwise consent to our disclosure of certain information to third parties, such as to ship you products or through your use of social media widgets or login integrations, with your consent.</li>
          <li>With our affiliates or otherwise within our corporate group, in our legitimate interests to run a successful business.</li>
          <li>In connection with a business transaction such as a merger or bankruptcy, to comply with any applicable legal obligations (including to respond to subpoenas, search warrants and similar requests), to enforce any applicable terms of service, and to protect or defend the Services, our rights, and the rights of our users or others.</li>
        </ul>
        <p>We disclose the following categories of personal information and sensitive personal information about users for the purposes set out above in "How we Collect and Use your Personal Information" and "How we Disclose Personal Information":</p>
        
        <div className="overflow-x-auto my-4 text-xs lg:text-sm">
          <table className="min-w-full divide-y border text-left">
            <thead>
              <tr className="bg-neutral-100">
                <th className="px-4 py-2 border font-medium">Category</th>
                <th className="px-4 py-2 border font-medium">Categories of Recipients</th>
              </tr>
            </thead>
            <tbody className="divide-y bg-white">
              <tr>
                <td className="px-4 py-2 border">Identifiers such as basic contact details and certain order and account information</td>
                <td className="px-4 py-2 border">Vendors and third parties who perform services on our behalf (such as Internet service providers, payment processors, fulfillment partners, customer support partners and data analytics providers); Business and marketing partners; Affiliates</td>
              </tr>
              <tr>
                <td className="px-4 py-2 border">Commercial information such as order information, shopping information and customer support information</td>
                <td className="px-4 py-2 border">Same as above</td>
              </tr>
              <tr>
                <td className="px-4 py-2 border">Internet or other similar network activity, such as Usage Data</td>
                <td className="px-4 py-2 border">Same as above</td>
              </tr>
              <tr>
                <td className="px-4 py-2 border">Geolocation data such as locations determined by an IP address or other technical measures</td>
                <td className="px-4 py-2 border">Same as above</td>
              </tr>
            </tbody>
          </table>
        </div>

        <p>We do not use or disclose sensitive personal information without your consent or for the purposes of inferring characteristics about you.</p>
        <p>With your consent we share personal information for the purpose of engaging in advertising and marketing activities, as follows.</p>
        <p>We have “sold” and “shared” (as those terms are defined in applicable law) personal information over the preceding 12 months for the purpose of engaging in advertising and marketing activities, as follows.</p>
        
        <div className="overflow-x-auto my-4 text-xs lg:text-sm">
          <table className="min-w-full divide-y border text-left">
            <thead>
              <tr className="bg-neutral-100">
                <th className="px-4 py-2 border font-medium">Category of Personal Information</th>
                <th className="px-4 py-2 border font-medium">Categories of Recipients</th>
              </tr>
            </thead>
            <tbody className="divide-y bg-white">
              <tr>
                <td className="px-4 py-2 border">Identifiers such as name, e-mail address and phone number</td>
                <td className="px-4 py-2 border">Business and marketing partners</td>
              </tr>
              <tr>
                <td className="px-4 py-2 border">Commercial information such as records of products or services purchased</td>
                <td className="px-4 py-2 border">Business and marketing partners</td>
              </tr>
              <tr>
                <td className="px-4 py-2 border">Usage Data</td>
                <td className="px-4 py-2 border">Business and marketing partners</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    )
  },
  {
    title: "User Generated Content",
    content: (
      <div className="space-y-1.5">
        <p>The Services may enable you to post product reviews and other user-generated content. If you choose to submit user generated content to any public area of the Services, this content will be public and accessible by anyone.</p>
        <p>We do not control who will have access to the information that you choose to make available to others, and cannot ensure that parties who have access to such information will respect your privacy or keep it secure. We are not responsible for the privacy or security of any information that you make publicly available, or for the accuracy, use or misuse of any information that you disclose or receive from third parties.</p>
      </div>
    )
  },
  {
    title: "Third Party Websites and Links",
    content: (
      <div className="space-y-1.5">
        <p>Our Site may provide links to websites or other online platforms operated by third parties. If you follow links to sites not affiliated or controlled by us, you should review their privacy and security policies and other terms and conditions. We do not guarantee and are not responsible for the privacy or security of such sites, including the accuracy, completeness, or reliability of information found on these sites. Information you provide on public or semi-public venues, including information you share on third-party social networking platforms may also be viewable by other users of the Services and/or users of those third-party platforms without limitation as to its use by us or by a third party. Our inclusion of such links does not, by itself, imply any endorsement of the content on such platforms or of their owners or operators, except as disclosed on the Services.</p>
      </div>
    )
  },
  {
    title: "Children's Data",
    content: (
      <div className="space-y-1.5">
        <p>The Services are not intended to be used by children, and we do not knowingly collect any personal information about children. If you are the parent or guardian of a child who has provided us with their personal information, you may contact us using the contact details set out below to request that it be deleted.</p>
        <p>As of the Effective Date of this Privacy Policy, we do not have actual knowledge that we “share” or “sell” (as those terms are defined in applicable law) personal information of individuals under 16 years of age.</p>
      </div>
    )
  },
  {
    title: "Security and Retention of Your Information",
    content: (
      <div className="space-y-1.5">
        <p>Please be aware that no security measures are perfect or impenetrable, and we cannot guarantee “perfect security.” In addition, any information you send to us may not be secure while in transit. We recommend that you do not use insecure channels to communicate sensitive or confidential information to us.</p>
        <p>How long we retain your personal information depends on different factors, such as whether we need the information to maintain your account, to provide the Services, comply with legal obligations, resolve disputes or enforce other applicable contracts and policies.</p>
      </div>
    )
  },
  {
    title: "Your Rights",
    content: (
      <div className="space-y-1.5">
        <p>Depending on where you live, you may have some or all of the rights listed below in relation to your personal information. However, these rights are not absolute, may apply only in certain circumstances and, in certain cases, we may decline your request as permitted by law.</p>
        <ul className="list-disc pl-5 space-y-2">
          <li><strong>Right to Access / Know:</strong> You may have a right to request access to personal information that we hold about you, including details relating to the ways in which we use and share your information.</li>
          <li><strong>Right to Delete:</strong> You may have a right to request that we delete personal information we maintain about you.</li>
          <li><strong>Right to Correct:</strong> You may have a right to request that we correct inaccurate personal information we maintain about you.</li>
          <li><strong>Right of Portability:</strong> You may have a right to receive a copy of the personal information we hold about you and to request that we transfer it to a third party, in certain circumstances and with certain exceptions.</li>
          <li><strong>Right to Opt out of Sale or Sharing or Targeted Advertising:</strong> You may have a right to direct us not to "sell" or "share" your personal information or to opt out of the processing of your personal information for purposes considered to be "targeted advertising", as defined in applicable privacy laws. Please note that if you visit our Site with the Global Privacy Control opt-out preference signal enabled, depending on where you are, we will automatically treat this as a request to opt-out of the "sale" or "sharing" of information for the device and browser that you use to visit the Site.</li>
          <li><strong>Restriction of Processing:</strong> You may have the right to ask us to stop or restrict our processing of personal information.</li>
          <li><strong>Withdrawal of Consent:</strong> Where we rely on consent to process your personal information, you may have the right to withdraw this consent.</li>
          <li><strong>Appeal:</strong> You may have a right to appeal our decision if we decline to process your request. You can do so by replying directly to our denial.</li>
          <li><strong>Managing Communication Preferences:</strong> We may send you promotional emails, and you may opt out of receiving these at any time by using the unsubscribe option displayed in our emails to you. If you opt out, we may still send you non-promotional emails, such as those about your account or orders that you have made.</li>
        </ul>
        <p>You may exercise any of these rights where indicated on our Site or by contacting us using the contact details provided below.</p>
        <p>We will not discriminate against you for exercising any of these rights. We may need to collect information from you to verify your identity, such as your email address or account information, before providing a substantive response to the request. In accordance with applicable laws, you may designate an authorized agent to make requests on your behalf to exercise your rights. Before accepting such a request from an agent, we will require that the agent provide proof you have authorized them to act on your behalf, and we may need you to verify your identity directly with us. We will respond to your request in a timely manner as required under applicable law.</p>
      </div>
    )
  },
  {
    title: "Complaints",
    content: (
      <div className="space-y-1.5">
        <p>If you have complaints about how we process your personal information, please contact us using the contact details provided below. If you are not satisfied with our response to your complaint, depending on where you live you may have the right to appeal our decision by contacting us using the contact details set out below, or lodge your complaint with your local data protection authority. For the EEA, you can find a list of the responsible data protection supervisory authorities here.</p>
      </div>
    )
  },
  {
    title: "International Users",
    content: (
      <div className="space-y-1.5">
        <p>Please note that we may transfer, store and process your personal information outside the country you live in. Your personal information is also processed by staff and third party service providers and partners in these countries.</p>
        <p>If we transfer your personal information out of Europe, we will rely on recognized transfer mechanisms like the European Commission's Standard Contractual Clauses, or any equivalent contracts issued by the relevant competent authority of the UK, as relevant, unless the data transfer is to a country that has been determined to provide an adequate level of protection.</p>
      </div>
    )
  },
  {
    title: "Contact",
    content: (
      <div className="space-y-1.5">
        <p>Should you have any questions about our privacy practices or this Privacy Policy, or if you would like to exercise any of the rights available to you, please email us at <a href="mailto:lxsscents@lxsscents.is" className="text-[#b2903b] hover:underline font-medium">lxsscents@lxsscents.is</a></p>
        <p>For the purpose of applicable data protection laws and if not explicitly stated otherwise, we are the data controller of your personal information.</p>
      </div>
    )
  }
];

const DOTTIR_PRIVACY_SECTIONS_IS = [
  {
    title: "Breytingar á þessari persónuverndarstefnu",
    content: (
      <div className="space-y-1.5">
        <p>Við gætum uppfært þessa persónuverndarstefnu af og til, þar á meðal til að endurspegla breytingar á venjum okkar eða af öðrum rekstrarlegum, lagalegum eða reglugerðarlegum ástæðum. Við munum birta endurskoðaða persónuverndarstefnu á vefsvæðinu, uppfæra dagsetninguna „Síðast uppfært“ og gera aðrar nauðsynlegar ráðstafanir sem krafist er samkvæmt viðeigandi lögum.</p>
      </div>
    )
  },
  {
    title: "Hvernig við söfnum og notum persónuupplýsingar þínar",
    content: (
      <div className="space-y-1.5">
        <p>Til að veita þjónustuna söfnum við persónuupplýsingum um þig frá ýmsum aðilum, eins og lýst er hér að neðan. Upplýsingarnar sem við söfnum og notum eru breytilegar eftir því hvernig þú hefur samskipti við okkur.</p>
        <p>Auk þeirra sérstöku nota sem fram koma hér að neðan gætum við notað upplýsingar sem við söfnum um þig til að hafa samskipti við þig, veita, bæta eða þróa þjónustuna, uppfylla viðeigandi lagaskyldur, framfylgja gildandi þjónustuskilmálum og til að vernda eða verja þjónustuna, réttindi okkar og réttindi notenda okkar eða annarra.</p>
      </div>
    )
  },
  {
    title: "Hvaða persónuupplýsingum við söfnum",
    content: (
      <div className="space-y-1.5">
        <p>Tegundir persónuupplýsinga sem við öflum um þig fara eftir því hvernig þú notar vefsvæði okkar og þjónustu. Þegar við notum hugtakið „persónuupplýsingar“ eigum við við upplýsingar sem auðkenna, tengjast, lýsa eða hægt er að tengja við þig. Eftirfarandi hlutar lýsa flokkum og sérstökum tegundum persónuupplýsinga sem við söfnum.</p>
      </div>
    )
  },
  {
    title: "Upplýsingar sem við söfnum beint frá þér",
    content: (
      <div className="space-y-1.5">
        <p>Upplýsingar sem þú sendir okkur beint í gegnum þjónustu okkar geta falið í sér:</p>
        <ul className="list-disc pl-5 space-y-2">
          <li><strong>Samskiptaupplýsingar</strong> þar á meðal nafn þitt, heimilisfang, símanúmer og netfang.</li>
          <li><strong>Pöntunarupplýsingar</strong> þar á meðal nafn þitt, reikningsheimilisfang, sendingarheimilisfang, staðfesting á greiðslu, netfang og símanúmer.</li>
          <li><strong>Reikningsupplýsingar</strong> þar á meðal notendanafn þitt, lykilorð, öryggisspurningar og aðrar upplýsingar sem notaðar eru í öryggisskyni.</li>
          <li><strong>Upplýsingar um þjónustu við viðskiptavini</strong> þar á meðal þær upplýsingar sem þú velur að hafa með í samskiptum við okkur, til dæmis þegar þú sendir skilaboð í gegnum þjónustuna.</li>
        </ul>
        <p>Sumir eiginleikar þjónustunnar kunna að krefjast þess að þú veitir okkur beint tilteknar upplýsingar um þig. Þú getur valið að veita ekki þessar upplýsingar, en það getur komið í veg fyrir að þú getir notað eða fengið aðgang að þessum eiginleikum.</p>
      </div>
    )
  },
  {
    title: "Upplýsingar sem við söfnum um notkun þína",
    content: (
      <div className="space-y-1.5">
        <p>Við gætum einnig sjálfkrafa safnað tilteknum upplýsingum um samskipti þín við þjónustuna („Notkunarupplýsingar“). Til að gera þetta gætum við notað vafrakökur (e. cookies), vefvitavísa (e. pixels) og svipaða tækni („Vafrakökur“). Notkunarupplýsingar geta falið í sér upplýsingar um hvernig þú nálgast og notar vefsvæði okkar og reikninginn þinn, þar á meðal upplýsingar um tæki, vafra, nettengingu þína, IP-tölu þína og aðrar upplýsingar varðandi samskipti þín við þjónustuna.</p>
      </div>
    )
  },
  {
    title: "Upplýsingar sem við fáum frá þriðja aðila",
    content: (
      <div className="space-y-1.5">
        <p>Að lokum gætum við fengið upplýsingar um þig frá þriðja aðila, þar á meðal frá söluaðilum og þjónustuveitendum sem gætu safnað upplýsingum fyrir okkar hönd, svo sem:</p>
        <ul className="list-disc pl-5 space-y-2">
          <li>Fyrirtækjum sem styðja vefsvæði okkar og þjónustu.</li>
          <li>Greiðslumiðlum okkar, sem safna greiðsluupplýsingum (t.d. bankareikningi, upplýsingum um kredit- eða debetkort, reikningsheimilisfangi) til að vinna úr greiðslu þinni til að uppfylla pantanir þínar og veita þér þær vörur eða þjónustu sem þú hefur beðið um, til að uppfylla samning okkar við þig.</li>
          <li>Þegar þú heimsækir vefsvæði okkar, opnar eða smellir á tölvupósta sem við sendum þér, eða hefur samskipti við þjónustu okkar eða auglýsingar, gætum við, eða þriðju aðilar sem við vinnum með, sjálfkrafa safnað tilteknum upplýsingum með því að nota rafræna rakningartækni á borð við vefvitavísa, hugbúnaðarþróunarsett, söfn þriðja aðila og vafrakökur.</li>
        </ul>
        <p>Farið verður með allar upplýsingar sem við fáum frá þriðja aðila í samræmi við þessa persónuverndarstefnu. Sjá einnig hlutann hér að neðan um Vefsvæði og tengla þriðja aðila.</p>
      </div>
    )
  },
  {
    title: "Hvernig við notum persónuupplýsingar þínar",
    content: (
      <div className="space-y-1.5">
        <ul className="list-disc pl-5 space-y-2">
          <li><strong>Að veita vörur og þjónustu:</strong> Við notum persónuupplýsingar þínar til að veita þér þjónustuna til að uppfylla samning okkar við þig, þar á meðal til að vinna úr greiðslum þínum, afgreiða pantanir þínar, til að senda þér tilkynningar tengdar reikningnum þínum, kaupum, vöruskilum, skiptum eða öðrum færslum, til að búa til, viðhalda og stjórna reikningnum þínum á annan hátt, til að sjá um sendingar, auðvelda vöruskil og skipti og aðra eiginleika og virkni sem tengjast reikningnum þínum.</li>
          <li><strong>Markaðssetning og auglýsingar:</strong> Við gætum notað persónuupplýsingar þínar í markaðs- og kynningarskyni, til dæmis til að senda markaðs-, auglýsinga- og kynningarsamskipti með tölvupósti, textaskilaboðum eða pósti, og til að sýna þér auglýsingar fyrir vörur eða þjónustu. Þetta getur falið í sér að nota persónuupplýsingar þínar til að sníða þjónustuna og auglýsingar betur á vefsvæðinu okkar og öðrum vefsíðum. Ef þú ert íbúi á Evrópska efnahagssvæðinu (EES) er lagagrundvöllur fyrir þessari gagnavinnslu lögmætir hagsmunir okkar af því að selja vörur okkar, í samræmi við f-lið 1. mgr. 6. gr. persónuverndarreglugerðarinnar (GDPR).</li>
          <li><strong>Öryggi og forvarnir gegn svikum:</strong> Við notum persónuupplýsingar þínar til að greina, rannsaka eða grípa til aðgerða varðandi hugsanlega sviksamlega, ólöglega eða skaðlega starfsemi. Ef þú velur að nota þjónustuna og skráir reikning, berð þú ábyrgð á því að halda innskráningarupplýsingum þínum öruggum. Við mælum eindregið með því að þú deilir ekki notendanafni þínu, lykilorði eða öðrum aðgangsupplýsingum með neinum öðrum. Ef þú telur að reikningurinn þinn hafi verið í hættu skaltu hafa samband við okkur tafarlaust. Ef þú ert íbúi á EES er lagagrundvöllur fyrir þessari gagnavinnslu lögmætir hagsmunir okkar af því að halda vefsíðu okkar öruggri fyrir þig og aðra viðskiptavini, í samræmi við f-lið 1. mgr. 6. gr. GDPR.</li>
          <li><strong>Samskipti við þig og endurbætur á þjónustu:</strong> Við notum persónuupplýsingar þínar til að veita þér þjónustu við viðskiptavini og bæta þjónustu okkar. Þetta er í okkar lögmætu hagsmunum til að geta svarað þér, veitt þér árangursríka þjónustu og viðhaldið viðskiptasambandi okkar við þig í samræmi við f-lið 1. mgr. 6. gr. GDPR.</li>
        </ul>
      </div>
    )
  },
  {
    title: "Vafrakökur (Cookies)",
    content: (
      <div className="space-y-1.5">
        <p>Eins og margar vefsíður notum við vafrakökur á vefsvæðinu okkar. Við notum vafrakökur til að knýja og bæta vefsvæði okkar og þjónustu (þar á meðal til að muna aðgerðir þínar og óskir), til að keyra greiningar og skilja betur samskipti notenda við þjónustuna (í okkar lögmætu hagsmunum af því að stjórna, bæta og fínstilla þjónustuna). Við gætum einnig leyft þriðju aðilum og þjónustuveitendum að nota vafrakökur á vefsvæðinu okkar til að sníða betur þjónustu, vörur og auglýsingar á okkar vefsvæði og öðrum vefsíðum.</p>
        <p>Flestir vafrar samþykkja sjálfkrafa vafrakökur, en þú getur valið að stilla vafrann þinn þannig að hann fjarlægi eða hafni vafrakökum í gegnum stillingar vafrans. Hafðu í huga að það að fjarlægja eða loka á vafrakökur getur haft neikvæð áhrif á notendaupplifun þína og gæti valdið því að sum þjónusta, þar á meðal ákveðnir eiginleikar og almenn virkni, virki rangt eða sé ekki lengur í boði. Að auki gæti lokun á vafrakökur ekki komið að fullu í veg fyrir það hvernig við deilum upplýsingum með þriðja aðila, svo sem auglýsingasamstarfsaðilum okkar.</p>
      </div>
    )
  },
  {
    title: "Hvernig við miðlum persónuupplýsingum",
    content: (
      <div className="space-y-1.5">
        <p>Við ákveðnar aðstæður gætum við miðlað persónuupplýsingum þínum til þriðja aðila í tilgangi þess að uppfylla samninga, lögmætum tilgangi og af öðrum ástæðum í samræmi við þessa persónuverndarstefnu. Slíkar aðstæður gætu falið í sér:</p>
        <ul className="list-disc pl-5 space-y-2">
          <li>Með söluaðilum eða öðrum þriðju aðilum sem veita þjónustu fyrir okkar hönd (t.d. upplýsingatæknistjórnun, greiðslumiðlun, gagnagreining, þjónustu við viðskiptavini, skýjageymsla, dreifing og sendingar).</li>
          <li>Með viðskipta- og markaðsaðilum til að veita þjónustu og auglýsa til þín. Viðskipta- og markaðsaðilar okkar munu nota upplýsingar þínar í samræmi við sínar eigin persónuverndaryfirlýsingar.</li>
          <li>Þegar þú beinir því til okkar, biður um eða samþykkir á annan hátt að við miðlum tilteknum upplýsingum til þriðja aðila, svo sem til að senda þér vörur eða með notkun þinni á smáforritum samfélagsmiðla eða innskráningartengingum, með þínu samþykki.</li>
          <li>Með hlutdeildarfélögum okkar eða á annan hátt innan fyrirtækjasamsteypu okkar, í okkar lögmætu hagsmunum af því að reka farsælt fyrirtæki.</li>
          <li>Í tengslum við viðskiptafærslu á borð við samruna eða gjaldþrot, til að uppfylla viðeigandi lagaskyldur (þar á meðal til að svara stefnum, leitarheimildum og svipuðum beiðnum), til að framfylgja viðeigandi þjónustuskilmálum og til að vernda eða verja þjónustuna, réttindi okkar og réttindi notenda okkar eða annarra.</li>
        </ul>
        <p>Við miðlum eftirfarandi flokkum persónuupplýsinga og viðkvæmra persónuupplýsinga um notendur í þeim tilgangi sem settur er fram hér að ofan í „Hvernig við söfnum og notum persónuupplýsingar þínar“ og „Hvernig við miðlum persónuupplýsingum“:</p>

        <div className="overflow-x-auto my-4 text-xs lg:text-sm">
          <table className="min-w-full divide-y border text-left">
            <thead>
              <tr className="bg-neutral-100">
                <th className="px-4 py-2 border font-medium">Flokkur</th>
                <th className="px-4 py-2 border font-medium">Flokkar viðtakenda</th>
              </tr>
            </thead>
            <tbody className="divide-y bg-white">
              <tr>
                <td className="px-4 py-2 border">Auðkenni, svo sem grunnsamskiptaupplýsingar og ákveðnar pöntunar- og reikningsupplýsingar</td>
                <td className="px-4 py-2 border">Söluaðilar og þriðju aðilar sem veita þjónustu fyrir okkar hönd (t.d. netþjónustuveitur, greiðslumiðlanir, dreifingaraðilar, þjónustuaðilar viðskiptavina og gagnagreiningaraðilar); Viðskipta- og markaðsaðilar; Hlutdeildarfélög</td>
              </tr>
              <tr>
                <td className="px-4 py-2 border">Viðskiptaupplýsingar, svo sem pöntunarupplýsingar, innkaupaupplýsingar og þjónustuupplýsingar viðskiptavina</td>
                <td className="px-4 py-2 border">Sama og að ofan</td>
              </tr>
              <tr>
                <td className="px-4 py-2 border">Netvirkni eða önnur svipuð netvirkni, svo sem notkunarupplýsingar</td>
                <td className="px-4 py-2 border">Sama og að ofan</td>
              </tr>
              <tr>
                <td className="px-4 py-2 border">Staðsetningargögn, svo sem staðsetningar ákvarðaðar út frá IP-tölu eða öðrum tæknilegum ráðstöfunum</td>
                <td className="px-4 py-2 border">Sama og að ofan</td>
              </tr>
            </tbody>
          </table>
        </div>

        <p>Við notum hvorki né miðlum viðkvæmum persónuupplýsingum án þíns samþykkis eða í þeim tilgangi að draga ályktanir um einkenni þín.</p>
        <p>Með þínu samþykki deilum við persónuupplýsingum í þeim tilgangi að stunda auglýsinga- og markaðsstarfsemi, sem hér segir.</p>
        <p>Við höfum „selt“ og „deilt“ (eins og þau hugtök eru skilgreind í viðeigandi lögum) persónuupplýsingum á síðustu 12 mánuðum í þeim tilgangi að stunda auglýsinga- og markaðsstarfsemi, sem hér segir:</p>

        <div className="overflow-x-auto my-4 text-xs lg:text-sm">
          <table className="min-w-full divide-y border text-left">
            <thead>
              <tr className="bg-neutral-100">
                <th className="px-4 py-2 border font-medium">Flokkur persónuupplýsinga</th>
                <th className="px-4 py-2 border font-medium">Flokkar viðtakenda</th>
              </tr>
            </thead>
            <tbody className="divide-y bg-white">
              <tr>
                <td className="px-4 py-2 border">Auðkenni, svo sem nafn, netfang og símanúmer</td>
                <td className="px-4 py-2 border">Viðskipta- og markaðsaðilar</td>
              </tr>
              <tr>
                <td className="px-4 py-2 border">Viðskiptaupplýsingar, svo sem skrár yfir vörur eða þjónustu sem keypt hefur verið</td>
                <td className="px-4 py-2 border">Viðskipta- og markaðsaðilar</td>
              </tr>
              <tr>
                <td className="px-4 py-2 border">Notkunarupplýsingar</td>
                <td className="px-4 py-2 border">Viðskipta- og markaðsaðilar</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    )
  },
  {
    title: "Notendaframleitt efni (User Generated Content)",
    content: (
      <div className="space-y-1.5">
        <p>Þjónustan kann að gera þér kleift að birta vöruumsagnir og annað efni frá notendum. Ef þú velur að senda inn efni frá notendum á opið svæði þjónustunnar verður það efni opinbert og aðgengilegt öllum.</p>
        <p>Við stjórnum ekki hver fær aðgang að upplýsingunum sem þú velur að gera aðgengilegar öðrum, og getum ekki tryggt að aðilar sem hafa aðgang að slíkum upplýsingum muni virða friðhelgi þína eða halda þeim öruggum. Við berum ekki ábyrgð á friðhelgi eða öryggi upplýsinga sem þú gerir opinberlega aðgengilegar, eða á nákvæmni, notkun eða misnotkun á neinum upplýsingum sem þú afhjúpar eða færð frá þriðja aðila.</p>
      </div>
    )
  },
  {
    title: "Vefsvæði og tenglar þriðja aðila",
    content: (
      <div className="space-y-1.5">
        <p>Vefsvæði okkar kann að innihalda tengla á vefsíður eða aðra netvettvanga sem reknir eru af þriðja aðila. Ef þú fylgir tenglum á síður sem við hvorki tengjumst né stjórnum, ættir þú að kynna þér persónuverndar- og öryggisstefnur þeirra ásamt öðrum skilmálum. Við ábyrgjumst ekki og berum ekki ábyrgð á persónuvernd eða öryggi slíkra vefsvæða, þar með talið nákvæmni, heildstæðni eða áreiðanleika upplýsinga sem finna má á þessum vefsvæðum. Upplýsingar sem þú veitir á opinberum eða hálf-opinberum vettvangi, þar á meðal upplýsingar sem þú deilir á samfélagsmiðlum þriðja aðila, gætu einnig verið sýnilegar öðrum notendum þjónustunnar og/eða notendum þessara vettvanga án nokkurra takmarkana af hálfu okkar eða þriðja aðila varðandi notkun þeirra. Innifaling slíkra tengla af okkar hálfu felur ekki í sér, út af fyrir sig, neina staðfestingu á efninu á slíkum vettvangi eða á eigendum eða rekstraraðilum þeirra, nema eins og upplýst er um í þjónustunni.</p>
      </div>
    )
  },
  {
    title: "Gögn barna",
    content: (
      <div className="space-y-1.5">
        <p>Þjónustan er ekki ætluð til notkunar af börnum og við söfnum ekki af ásetningi neinum persónuupplýsingum um börn. Ef þú ert foreldri eða forráðamaður barns sem hefur veitt okkur persónuupplýsingar sínar, getur þú haft samband við okkur með því að nota samskiptaupplýsingarnar sem settar eru fram hér að neðan til að biðja um að þeim verði eytt.</p>
        <p>Frá gildistökudegi þessarar persónuverndarstefnu höfum við ekki raunverulega vitneskju um að við „deilum“ eða „seljum“ (eins og þessi hugtök eru skilgreind í viðeigandi lögum) persónuupplýsingum einstaklinga yngri en 16 ára.</p>
      </div>
    )
  },
  {
    title: "Öryggi og varðveisla upplýsinga þinna",
    content: (
      <div className="space-y-1.5">
        <p>Vinsamlegast hafðu í huga að engar öryggisráðstafanir eru fullkomnar eða órjúfanlegar og við getum ekki tryggt „fullkomið öryggi“. Að auki geta allar upplýsingar sem þú sendir okkur verið óöruggar á meðan á sendingu stendur. Við mælum með því að þú notir ekki óöruggar leiðir til að miðla viðkvæmum eða trúnaðarupplýsingum til okkar.</p>
        <p>Hversu lengi við varðveitum persónuupplýsingar þínar fer eftir mismunandi þáttum, svo sem hvort við þurfum upplýsingarnar til að viðhalda reikningnum þínum, til að veita þjónustuna, uppfylla lagaskyldur, leysa úr ágreiningi eða framfylgja öðrum viðeigandi samningum og stefnum.</p>
      </div>
    )
  },
  {
    title: "Réttindi þín",
    content: (
      <div className="space-y-1.5">
        <p>Allt eftir því hvar þú býrð, gætir þú haft einhver eða öll réttindin sem talin eru upp hér að neðan í tengslum við persónuupplýsingar þínar. Hins vegar eru þessi réttindi ekki algild, geta aðeins átt við við tilteknar aðstæður og í sumum tilfellum gætum við hafnað beiðni þinni eins og lög leyfa.</p>
        <ul className="list-disc pl-5 space-y-2">
          <li><strong>Réttur til aðgangs / vitneskju:</strong> Þú gætir átt rétt á að biðja um aðgang að persónuupplýsingum sem við höfum um þig, þar á meðal upplýsingar varðandi þær leiðir sem við notum og deilum upplýsingunum þínum á.</li>
          <li><strong>Réttur til eyðingar:</strong> Þú gætir átt rétt á að biðja um að við eyðum persónuupplýsingum sem við höfum um þig.</li>
          <li><strong>Réttur til leiðréttingar:</strong> Þú gætir átt rétt á að biðja okkur um að leiðrétta rangar persónuupplýsingar sem við höfum um þig.</li>
          <li><strong>Réttur til gagnaflutnings:</strong> Þú gætir átt rétt á að fá afrit af persónuupplýsingunum sem við höfum um þig og biðja um að við flytjum þær til þriðja aðila, við ákveðnar aðstæður og með ákveðnum undantekningum.</li>
          <li><strong>Réttur til að hafna sölu, deilingu eða markvissum auglýsingum:</strong> Þú gætir átt rétt á að beina því til okkar að hvorki „selja“ né „deila“ persónuupplýsingum þínum eða að afþakka vinnslu persónuupplýsinga þinna í tilgangi sem telst vera „markvissar auglýsingar“, eins og það er skilgreint í viðeigandi persónuverndarlögum. Vinsamlegast athugaðu að ef þú heimsækir vefsvæði okkar með „Global Privacy Control“ valmöguleikann virkjaðan í vafranum þínum, allt eftir því hvar þú ert, munum við sjálfkrafa meðhöndla þetta sem beiðni um að hafna „sölu“ eða „deilingu“ upplýsinga fyrir það tæki og þann vafra sem þú notar til að heimsækja vefsvæðið.</li>
          <li><strong>Takmörkun á vinnslu:</strong> Þú gætir haft rétt á að biðja okkur um að hætta eða takmarka vinnslu okkar á persónuupplýsingum.</li>
          <li><strong>Afturköllun samþykkis:</strong> Þar sem við styðjumst við samþykki til að vinna með persónuupplýsingar þínar, gætir þú átt rétt á að afturkalla þetta samþykki.</li>
          <li><strong>Áfrýjun:</strong> Þú gætir átt rétt á að áfrýja ákvörðun okkar ef við höfnum því að verða við beiðni þinni. Þú getur gert það með því að svara synjun okkar beint.</li>
          <li><strong>Stjórnun á samskiptastillingum:</strong> Við gætum sent þér kynningartölvupósta, og þú getur hvenær sem er afþakkað að fá slíka pósta með því að nota afskráningarvalmöguleikann (unsubscribe) sem birtist í tölvupóstum okkar til þín. Ef þú afskráir þig, gætum við samt sent þér tölvupósta sem ekki eru í kynningarskyni, svo sem pósta varðandi reikninginn þinn eða pantanir sem þú hefur gert.</li>
        </ul>
        <p>Þú getur nýtt þér eitthvert þessara réttinda þar sem það er gefið til kynna á vefsvæði okkar eða með því að hafa samband við okkur í gegnum samskiptaupplýsingarnar hér að neðan.</p>
        <p>Við munum ekki mismuna þér fyrir að nýta þér eitthvert þessara réttinda. Við gætum þurft að safna upplýsingum frá þér til að sannreyna deili á þér, svo sem netfang þitt eða reikningsupplýsingar, áður en við veitum efnislegt svar við beiðninni. Í samræmi við gildandi lög getur þú tilnefnt viðurkenndan umboðsmann til að leggja fram beiðnir fyrir þína hönd til að nýta réttindi þín. Áður en við samþykkjum slíka beiðni frá umboðsmanni munum við krefjast þess að umboðsmaðurinn leggi fram sönnun fyrir því að þú hafir veitt honum heimild til að koma fram fyrir þína hönd, og við gætum þurft að þú sannreyndir deili á þér beint við okkur. Við munum svara beiðni þinni tímanlega eins og krafist er samkvæmt gildandi lögum.</p>
      </div>
    )
  },
  {
    title: "Kvartanir",
    content: (
      <div className="space-y-1.5">
        <p>Ef þú ert með kvartanir vegna þess hvernig við vinnum með persónuupplýsingar þínar, vinsamlegast hafðu samband við okkur í gegnum samskiptaupplýsingarnar hér að neðan. Ef þú ert ekki sátt(ur) við svar okkar við kvörtun þinni, allt eftir því hvar þú býrð, gætir þú haft rétt á að áfrýja ákvörðun okkar með því að hafa samband við okkur í gegnum samskiptaupplýsingarnar sem settar eru fram hér að neðan, eða lagt fram kvörtun hjá persónuverndarstofnun á þínu svæði. Fyrir EES-svæðið er að finna lista yfir ábyrgar eftirlitsstofnanir gagnaverndar hér.</p>
      </div>
    )
  },
  {
    title: "Alþjóðlegir notendur",
    content: (
      <div className="space-y-1.5">
        <p>Vinsamlegast athugaðu að við gætum flutt, geymt og unnið með persónuupplýsingar þínar utan þess lands sem þú býrð í. Persónuupplýsingar þínar eru einnig unnar af starfsfólki og þriðja aðila þjónustuveitendum og samstarfsaðilum í þessum löndum.</p>
        <p>Ef við flytjum persónuupplýsingar þínar út fyrir Evrópu munum við styðjast við viðurkennda flutningsstaðla eins og staðlaða samningsskilmála Evrópunefndarinnar eða hliðstæða samninga útgefna af viðeigandi lögbæru stjórnvaldi í Bretlandi, eftir því sem við á, nema gagnaflutningurinn sé til lands sem hefur verið metið svo að það veiti viðunandi verndarstig.</p>
      </div>
    )
  },
  {
    title: "Hafa samband",
    content: (
      <div className="space-y-1.5">
        <p>Ef þú hefur einhverjar spurningar um persónuverndarvenjur okkar eða þessa persónuverndarstefnu, eða ef þú vilt nýta einhver þeirra réttinda sem þér standa til boða, vinsamlegast sendu okkur tölvupóst á <a href="mailto:lxsscents@lxsscents.is" className="text-[#b2903b] hover:underline font-medium">lxsscents@lxsscents.is</a>.</p>
        <p>Í skilningi gildandi gagnaverndarlaga og ef annað er ekki tekið skýrt fram, erum við ábyrgðaraðili (e. data controller) persónuupplýsinga þinna.</p>
      </div>
    )
  }
];

const DOTTIR_SHIPPING_SECTIONS = [
  {
    title: "1. Order Processing Times",
    content: (
      <div className="space-y-1.5">
        <p>• Our warehouse processes and ships orders Monday through Friday, excluding weekends and major holidays.</p>
        <p>• Standard order processing takes 1-3 business days.</p>
        <p>• During high-volume periods (e.g., holiday seasons, new product launches, or major sales), processing may take up to 3-4 business days.</p>
        <p>• You will receive a shipping confirmation email containing your tracking number as soon as your shipping label is generated.</p>
      </div>
    )
  },
  {
    title: "2. Estimated Delivery Times",
    content: (
      <div className="space-y-1.5">
        <p>• Because ground shipping is the only legal option for perfumes, transit times may be slightly longer than you might expect for non-HAZMAT packages.</p>
        <p>• <strong>Standard Ground Transit:</strong> Once shipped, delivery typically takes 5-7 business days, depending on your distance from our fulfillment center in Reykjavík.</p>
        <p>• <strong>Delays:</strong> Delivery times are estimates provided by the shipping carrier and are not guaranteed. Severe weather, carrier volume constraints, and holiday rushes can affect transit times.</p>
      </div>
    )
  },
  {
    title: "3. Damaged, Leaking, or Lost Packages",
    content: (
      <div className="space-y-1.5">
        <p>• We carefully package our glass bottles with cushioning and absorbent materials to ensure they arrive safely, but damage during transit can occasionally occur.</p>
        <p>• <strong>Damaged or Leaking Items:</strong> If your package arrives damaged or your perfume is leaking, please contact us at <a href="mailto:lxsscents@lxsscents.is" className="text-[#b2903b] hover:underline font-medium">lxsscents@lxsscents.is</a> within 48 hours of delivery. You must include your order number and clear photos of the shipping box, the internal packaging, and the damaged bottle. We will promptly arrange a replacement or a refund.</p>
        <p>• <strong>Lost Packages:</strong> If your tracking information shows "Delivered" but you cannot locate the package, please wait 24 hours to see if it turns up, check with neighbors, and inspect your property. If it is still missing, contact us so we can file a trace and claim with the carrier.</p>
      </div>
    )
  },
  {
    title: "4. Contact Us",
    content: (
      <div className="space-y-1.5">
        <p>• If you have any questions about the shipping status of your order, please reach out to our support team: Email: <a href="mailto:lxsscents@lxsscents.is" className="text-[#b2903b] hover:underline font-medium">lxsscents@lxsscents.is</a></p>
      </div>
    )
  }
];

const DOTTIR_SHIPPING_SECTIONS_IS = [
  {
    title: "1. Afgreiðslutími pantana",
    content: (
      <div className="space-y-1.5">
        <p>• Vöruhús okkar afgreiðir og sendir pantanir frá mánudegi til föstudags, að undanskildum helgum og almennum frídögum.</p>
        <p>• Hefðbundinn afgreiðslutími pantana er 1-3 virkir dagar.</p>
        <p>• Á álagstímum (t.d. yfir hátíðir, við kynningu á nýjum vörum eða stórum útsölum) getur afgreiðslutími tekið allt að 3-4 virka daga.</p>
        <p>• Þú munt fá staðfestingarpóst varðandi sendinguna með rakningsnúmeri um leið og sendingarmiðinn þinn hefur verið búinn til.</p>
      </div>
    )
  },
  {
    title: "2. Áætlaður afhendingartími",
    content: (
      <div className="space-y-1.5">
        <p>• Þar sem landflutningar eru eini löglegi valkosturinn fyrir ilmvötn getur flutningstíminn verið aðeins lengri en þú gætir átt að venjast með pakka sem ekki flokkast sem hættulegur varningur (HAZMAT).</p>
        <p>• <strong>Hefðbundnir landflutningar:</strong> Eftir að varan hefur verið send tekur afhending venjulega 5-7 virka daga, allt eftir fjarlægð þinni frá dreifingarmiðstöð okkar í Reykjavík.</p>
        <p>• <strong>Tafir:</strong> Afhendingartímar eru áætlanir sem flutningsaðili gefur upp og eru ekki tryggðir. Slæmt veður, afkastagetutakmarkanir flutningsaðila og álag á hátíðum geta haft áhrif á flutningstíma.</p>
      </div>
    )
  },
  {
    title: "3. Skemmdir, lekandi eða týndir pakkar",
    content: (
      <div className="space-y-1.5">
        <p>• Við pökkum glerflöskunum okkar vandlega með höggdeyfandi og drægjum efnum til að tryggja að þær komist heilar á leiðarenda, en skemmdir í flutningi geta stundum átt sér stað.</p>
        <p>• <strong>Skemmdar eða lekandi vörur:</strong> Ef pakkinn þinn kemur skemmdur eða ilmvatnið þitt lekur, vinsamlegast hafðu samband við okkur á <a href="mailto:lxsscents@lxsscents.is" className="text-[#b2903b] hover:underline font-medium">lxsscents@lxsscents.is</a> innan 48 klukkustunda frá afhendingu. Þú verður að láta pöntunarnúmer þitt fylgja með ásamt skýrum ljósmyndum af sendingarkassanum, innri umbúðum og skemmdu flöskunni. Við munum fljótt afgreiða nýja vöru eða endurgreiðslu.</p>
        <p>• <strong>Týndir pakkar:</strong> Ef rakningsupplýsingar þínar sýna „Afhent“ (e. Delivered) en þú finnur ekki pakkann, vinsamlegast bíddu í 24 klukkustundir til að sjá hvort hann skili sér, athugaðu hjá nágrönnum og leitaðu í kringum húsnæðið þitt. Ef pakkinn er enn týndur skaltu hafa samband við okkur svo við getum hafið leit og gert kröfu á hendur flutningsaðila.</p>
      </div>
    )
  },
  {
    title: "4. Hafðu samband",
    content: (
      <div className="space-y-1.5">
        <p>• Ef þú hefur einhverjar spurningar um stöðu á sendingu pöntunar þinnar, vinsamlegast hafðu samband:<br/>Netfang: <a href="mailto:lxsscents@lxsscents.is" className="text-[#b2903b] hover:underline font-medium">lxsscents@lxsscents.is</a></p>
      </div>
    )
  }
];

const DOTTIR_REFUND_SECTIONS = [
  {
    title: "1. Return Window",
    content: (
      <p>• We accept returns on eligible items within 10 days of the delivery date. If 10 days have passed since your order was delivered, we unfortunately cannot offer you a refund or exchange.</p>
    )
  },
  {
    title: "2. Eligibility for Returns",
    content: (
      <div className="space-y-1.5">
        <p>• To be eligible for a return, your item must meet the following strict conditions:</p>
        <p>• The fragrance must be returned in its original packaging and in pristine condition, with the sticker fully intact. Once we receive and inspect your return, a full refund will be issued to your original form of payment within 5–7 business days.</p>
      </div>
    )
  },
  {
    title: "3. Non-Returnable Items",
    content: (
      <div className="space-y-1.5">
        <p>• For health, safety, and hygiene reasons, we cannot accept returns or issue refunds for the following items:</p>
        <p>• Perfumes that have been opened, unsealed, or sprayed (even once).</p>
        <p>• Sample sizes, gift cards and items purchased on "Sale".</p>
      </div>
    )
  },
  {
    title: "4. Damaged, Leaking, or Defective Products",
    content: (
      <div className="space-y-1.5">
        <p>• We take great care in packaging our fragrances, but accidents during transit can happen. If your perfume arrives damaged, leaking, or with a defective atomizer, we will make it right.</p>
        <p>• Notification: You must contact us at <a href="mailto:lxsscents@lxsscents.is" className="text-[#b2903b] hover:underline font-medium">lxsscents@lxsscents.is</a> within 48 hours of delivery.</p>
        <p>• Evidence: Please include your order number and clear photographs or videos showing the damage, the leaking bottle, and the shipping box.</p>
        <p>• Resolution: Upon verification, we will send a replacement free of charge or issue a full refund to your original payment method.</p>
      </div>
    )
  },
  {
    title: "5. How to Initiate a Return",
    content: (
      <div className="space-y-1.5">
        <p>• Please do not send your purchase back to the manufacturer or return it without prior authorization.</p>
        <p>• Email our customer support team at <a href="mailto:lxsscents@lxsscents.is" className="text-[#b2903b] hover:underline font-medium">lxsscents@lxsscents.is</a> with your order number and reason for return.</p>
        <p>• Once approved, we will provide you with a Return Merchandise Authorization (RMA) number and the return shipping address.</p>
        <p>• Shipping Warning: Because perfumes contain alcohol, they are classified as hazardous materials (HAZMAT). You must use standard ground shipping to return the item. Expedited air shipping is illegal for these products without specialized handling.</p>
      </div>
    )
  },
  {
    title: "6. Return Shipping Costs",
    content: (
      <div className="space-y-1.5">
        <p>• Customer Responsibility: You are responsible for paying the shipping costs for returning an item due to a change of mind. Original shipping costs are non-refundable.</p>
        <p>• Our Responsibility: If the return is due to our error (e.g., you received the wrong item) or a damaged product, we will provide a prepaid return shipping label.</p>
      </div>
    )
  },
  {
    title: "7. Refund Processing",
    content: (
      <div className="space-y-1.5">
        <p>• Once your return is received and inspected by our warehouse, we will send you an email notifying you of the approval or rejection of your refund.</p>
        <p>• Approval: If approved, your refund will be processed, and a credit will automatically be applied to your credit card or original method of payment within 5-7 business days.</p>
        <p>• Rejection: If the returned item is found to be opened, sprayed, or missing its original seal, the return will be rejected. The item can be shipped back to you at your expense, or it will be disposed of.</p>
      </div>
    )
  },
  {
    title: "8. Contact Us",
    content: (
      <div className="space-y-1.5">
        <p>• If you have any questions or concerns regarding your specific order or our return process, please reach out to us:</p>
        <p>Email: <a href="mailto:lxsscents@lxsscents.is" className="text-[#b2903b] hover:underline font-medium">lxsscents@lxsscents.is</a></p>
      </div>
    )
  }
];

const DOTTIR_REFUND_SECTIONS_IS = [
  {
    title: "1. Skilafrestur",
    content: (
      <p>• Við tökum við skilum á tækum vörum innan 10 daga frá afhendingardegi. Ef 10 dagar eru liðnir frá því að pöntunin þín var afhent getum við því miður ekki boðið þér endurgreiðslu eða vöruskil.</p>
    )
  },
  {
    title: "2. Skilyrði fyrir skilum",
    content: (
      <div className="space-y-1.5">
        <p>• Til að eiga rétt á skilum verður varan þín að uppfylla eftirfarandi ströng skilyrði:</p>
        <p>• Ilmvatninu verður að skila í upprunalegum umbúðum og í fullkomnu ástandi, með límmiðann alveg óskemmdan. Þegar við höfum móttekið, skoðað og samþyllt skilavöruna mun full endurgreiðsla verða lögð inn á upprunalegan greiðslumiðil þinn innan 5–7 virkra daga.</p>
      </div>
    )
  },
  {
    title: "3. Vörur sem fást ekki endurgreiddar",
    content: (
      <div className="space-y-1.5">
        <p>• Af heilsufars-, öryggis- og hreinlætisástæðum getum við ekki tekið við skilum eða endurgreitt eftirfarandi vörur:</p>
        <p>• Ilmvötn sem hafa verið opnuð, innsigli rofið á eða úðuð (jafnvel þótt það sé aðeins einu sinni).</p>
        <p>• Prufustærðir, gjafakort og vörur sem keyptar eru á útsölu.</p>
      </div>
    )
  },
  {
    title: "4. Skemmdar, lekandi eða gallaðar vörur",
    content: (
      <div className="space-y-1.5">
        <p>• Við vöndum okkur mjög við pökkun ilmanna okkar en slys geta orðið í flutningum. Ef ilmvatnið þitt kemur skemmt, lekandi eða með gallaðan úðara, munum við bæta úr því.</p>
        <p>• Tilkynning: Þú verður að hafa samband við okkur á <a href="mailto:lxsscents@lxsscents.is" className="text-[#b2903b] hover:underline font-medium">lxsscents@lxsscents.is</a> innan 48 klukkustunda frá afhendingu.</p>
        <p>• Sönnunargögn: Vinsamlegast láttu pöntunarnúmer þitt fylgja með ásamt skýrum ljósmyndum eða myndböndum sem sýna skemmdirnar, lekandi flöskuna og sendingarkassann.</p>
        <p>• Úrlausn: Að lokinni sannprófun munum við senda nýja vöru að kostnaðarlausu eða endurgreiða að fullu inn á upprunalegan greiðslumiðil.</p>
      </div>
    )
  },
  {
    title: "5. Hvernig á að hefja skilaferli",
    content: (
      <div className="space-y-1.5">
        <p>• Vinsamlegast sendu kaupin þín ekki aftur til framleiðanda eða skilaðu þeim án undangenginnar heimildar.</p>
        <p>• Sendu tölvupóst á <a href="mailto:lxsscents@lxsscents.is" className="text-[#b2903b] hover:underline font-medium">lxsscents@lxsscents.is</a> með pöntunarnúmeri þínu og ástæðu skilanna.</p>
        <p>• Þegar skilin hafa verið samþykkt munum við veita þér RMA-númer (vöruskilaheimildarnúmer) og heimilisfang fyrir skil sendingar.</p>
        <p>• Viðvörun vegna sendingar: Þar sem ilmvötn innihalda alkóhól flokkast þau sem hættulegur varningur (HAZMAT). Þú verður að nota venjulega landflutninga til að skila vörunni. Hraðsendingar með flugi eru ólöglegar fyrir þessar vörur án sérstakrar meðhöndlunar.</p>
      </div>
    )
  },
  {
    title: "6. Sendingarkostnaður vegna skila",
    content: (
      <div className="space-y-1.5">
        <p>• Ábyrgð viðskiptavinar: Þú berð ábyrgð á að greiða sendingarkostnað við að skila vöru ef þú skiptir um skoðun. Upprunalegur sendingarkostnaður fæst ekki endurgreiddur.</p>
        <p>• Okkar ábyrgð: Ef skilin eru tilkomin vegna mistaka okkar (t.d. að þú hafir fengið ranga vöru) eða skemmdrar vöru, munum við útvega fyrirframgreiddan sendingarmiða fyrir skilin.</p>
      </div>
    )
  },
  {
    title: "7. Úrvinnsla endurgreiðslna",
    content: (
      <div className="space-y-1.5">
        <p>• Þegar skilavaran þín er móttekin og skoðuð á lager okkar munum við senda þér tölvupóst til að tilkynna þér um samþykki eða höfnun á endurgreiðslunni.</p>
        <p>• Samþykkt: Ef endurgreiðslan er samþykkt verður hún afgreidd og innlegg sjálfkrafa lagt inn á upprunalegan greiðslumiðil innan 5-7 virkra daga.</p>
        <p>• Höfnun: Ef í ljós kemur að skilavaran hefur verið opnuð, úðuð eða að upprunalegt innsigli vantar verður skilunum hafnað. Hægt er að senda vöruna aftur til þín á þinn kostnað, annars verður henni fargað.</p>
      </div>
    )
  },
  {
    title: "8. Hafðu samband",
    content: (
      <div className="space-y-1.5">
        <p>• Ef þú hefur einhverjar spurningar eða áhyggjur varðandi þína pöntun eða skilaferlið okkar, vinsamlegast hafðu samband við okkur:</p>
        <p>Netfang: <a href="mailto:lxsscents@lxsscents.is" className="text-[#b2903b] hover:underline font-medium">lxsscents@lxsscents.is</a></p>
      </div>
    )
  }
];

const DOTTIR_TERMS_SECTIONS = [
  {
    title: "1. General Conditions",
    content: (
      <ul className="list-disc pl-6 space-y-3">
        <li><strong>Age Restriction:</strong> By agreeing to these Terms, you represent that you are at least the age of majority in your state or province of residence.</li>
        <li><strong>Right of Refusal:</strong> We reserve the right to refuse service to anyone for any reason at any time.</li>
        <li><strong>Account Security:</strong> You are responsible for maintaining the confidentiality of your account and password. We cannot and will not be liable for any loss or damage from your failure to maintain this security.</li>
      </ul>
    )
  },
  {
    title: "2. Products and Services",
    content: (
      <div className="space-y-1.5">
        <p>Perfume products have specific characteristics that must be acknowledged prior to purchase:</p>
        <ul className="list-disc pl-6 space-y-3">
          <li><strong>Product Descriptions:</strong> We make every effort to display the colors, packaging, and descriptions of our fragrances as accurately as possible. However, we cannot guarantee that your computer monitor's display will be completely accurate.</li>
          <li><strong>Batch Variations:</strong> Fragrances made with natural ingredients may experience slight variations in scent or color from batch to batch. This is normal and not considered a defect.</li>
          <li><strong>Allergies and Skin Reactions:</strong> Our products include a list of ingredients. It is your responsibility to check for allergens. We are not liable for any allergic reactions, skin irritations, or health issues resulting from the use of our products. Always perform a patch test before full application.</li>
        </ul>
      </div>
    )
  },
  {
    title: "3. Shipping and Delivery",
    content: (
      <div className="space-y-1.5">
        <p>Because perfumes contain alcohol, they are subject to strict shipping regulations.</p>
        <ul className="list-disc pl-6 space-y-3">
          <li><strong>Shipping Restrictions:</strong> Perfumes are classified as hazardous materials (HAZMAT) by many shipping carriers. Consequently, expedited shipping (like overnight air) may not be available, and international shipping may be restricted.</li>
          <li><strong>Delivery Times:</strong> Estimated delivery times are provided at checkout but are not guaranteed. We are not responsible for delays caused by the carrier or customs.</li>
        </ul>
      </div>
    )
  },
  {
    title: "4. Returns and Refunds",
    content: (
      <div className="space-y-1.5">
        <p>Due to the personal and hygienic nature of fragrance products, our return policy is strictly enforced.</p>
        <ul className="list-disc pl-6 space-y-3">
          <li><strong>Eligible Returns:</strong> We accept returns on eligible items within 10 days of the delivery date. The fragrance must be returned in its original packaging and in pristine condition, with the sticker fully intact.</li>
          <li><strong>Non-Returnable Items:</strong> For hygiene and safety reasons, any perfume that has been opened, sprayed, or unsealed cannot be returned or refunded.</li>
          <li><strong>Damaged Goods:</strong> If your item arrives damaged or leaking, please contact us within 48 hours of delivery with photographic evidence, and we will issue a replacement or refund.</li>
        </ul>
      </div>
    )
  },
  {
    title: "5. Pricing and Billing",
    content: (
      <ul className="list-disc pl-6 space-y-3">
        <li><strong>Price Changes:</strong> Prices for our products are subject to change without notice. We reserve the right to modify or discontinue a product at any time.</li>
        <li><strong>Accuracy of Billing:</strong> You agree to provide current, complete, and accurate purchase and account information for all purchases made at our store. We reserve the right to cancel any order if we suspect fraudulent activity.</li>
      </ul>
    )
  },
  {
    title: "6. Intellectual Property",
    content: (
      <p>All content on this website, including but not limited to logos, text, graphics, images, product names, and site design, is the property of LxS Scents and is protected by copyright and trademark laws. You may not use, reproduce, or distribute our content without written permission.</p>
    )
  },
  {
    title: "7. Limitation of Liability",
    content: (
      <p>In no case shall LxS Scents, our directors, officers, employees, or suppliers be liable for any injury, loss, claim, or any direct, indirect, incidental, punitive, or consequential damages of any kind (including lost profits or lost revenue) arising from your use of any of our products or our website.</p>
    )
  },
  {
    title: "8. Governing Law",
    content: (
      <p>These Terms of Service and any separate agreements whereby we provide you services shall be governed by and construed in accordance with the laws of Iceland.</p>
    )
  },
  {
    title: "9. Changes to Terms of Service",
    content: (
      <p>We reserve the right to update, change, or replace any part of these Terms of Service by posting updates and changes to our website. It is your responsibility to check our website periodically for changes.</p>
    )
  },
  {
    title: "10. Contact Information",
    content: (
      <div className="space-y-1.5">
        <p>Questions about the Terms of Service should be sent to us at:</p>
        <p>Email: <strong><a href="mailto:lxsscents@lxsscents.is" className="hover:underline text-[#b2903b]">lxsscents@lxsscents.is</a></strong></p>
      </div>
    )
  }
];

const DOTTIR_TERMS_SECTIONS_IS = [
  {
    title: "1. Seljandi",
    content: (
      <p>
        LxS Scents ehf., kennitala 6906261600, 110 Reykjavík, Ísland. Netfang: <a href="mailto:lxsscents@lxsscents.is" className="hover:underline text-[#b2903b]">lxsscents@lxsscents.is</a>. Færslan fer fram í nafni seljanda og birtist þannig á kortayfirliti.
      </p>
    )
  },
  {
    title: "2. Greiðsla og mynt",
    content: (
      <p>
        Öll verð eru gefin upp í íslenskum krónum (ISK) nema annað sé tekið fram. Virðisaukaskattur er innifalinn í verðunum þegar við á.
      </p>
    )
  },
  {
    title: "3. Greiðsla með kröfu",
    content: (
      <p>
        Ef greitt er með kröfu í netbanka getur LxS Scents ehf. lagt seðilgjald á kröfuna til að mæta bankakostnaði hennar. Sé krafa ógreidd eftir eindaga getur LxS Scents ehf. reiknað dráttarvexti samkvæmt lögum nr. 38/2001 um vexti og verðtryggingu frá gjalddaga til greiðsludags.
      </p>
    )
  },
  {
    title: "4. Vara, þjónusta og áskriftir",
    content: (
      <p>
        Lýsing á vöru eða þjónustu er gefin á vörusíðu eða í greiðslulýsingu. Sé um áskrift að ræða koma tíðni og verð áskriftar fram fyrir kaup og er greitt fyrir hvert tímabil þar til áskriftinni er sagt upp. Áskrifandi getur sagt upp áskrift hvenær sem er með því að hafa samband við LxS Scents ehf. á netfanginu <a href="mailto:lxsscents@lxsscents.is" className="hover:underline text-[#b2903b]">lxsscents@lxsscents.is</a>. Uppsögn tekur gildi í lok yfirstandandi áskriftartímabils og eftir það er ekki innheimt fyrir áskriftina. Að öðru leyti en leiðir af skilarétti samkvæmt 6. tölulið fæst greitt áskriftartímabil ekki endurgreitt, nema annað komi fram í lýsingu áskriftarinnar.
      </p>
    )
  },
  {
    title: "5. Afhending og sendingarkostnaður",
    content: (
      <p>
        Afhendingarmáti, afhendingartími og sendingarkostnaður koma fram í lýsingu vöru eða þjónustu áður en greitt er. Sé afhendingartími ekki tilgreindur eru vörur afhentar eða sendar innan 30 daga frá greiðslu.
      </p>
    )
  },
  {
    title: "6. Skilafrestur og réttur til að falla frá kaupum",
    content: (
      <p>
        Almennur skilafrestur á vörum er 14 dagar frá móttöku, nema annað sé sérstaklega tekið fram. Kaupandi ber sendingarkostnað við að skila vöru, nema um gallaða eða ranga vöru sé að ræða. Vara sem skilað er skal vera ónotuð, í upprunalegum umbúðum og í sama ástandi og hún var afhent.
      </p>
    )
  },
  {
    title: "7. Gallar og kvartanir",
    content: (
      <p>
        Komi í ljós galli á vöru eða þjónustu skal kaupandi tilkynna það til LxS Scents ehf. eins fljótt og auðið er á netfangið <a href="mailto:lxsscents@lxsscents.is" className="hover:underline text-[#b2903b]">lxsscents@lxsscents.is</a>. Seljandi mun bæta úr galla, afhenda nýja vöru eða endurgreiða samkvæmt lögum um neytendakaup nr. 48/2003 eða lögum um þjónustukaup nr. 42/2000 eftir því sem við á.
      </p>
    )
  },
  {
    title: "8. Meðferð persónuupplýsinga",
    content: (
      <p>
        LxS Scents ehf. vinnur persónuupplýsingar í tengslum við greiðslur í samræmi við gildandi persónuverndarlög nr. 90/2018. Upplýsingar eru eingöngu notaðar til að afgreiða pöntun og tryggja réttmæta framkvæmd greiðslu. LxS Scents ehf. geymir engar kortaupplýsingar. Greiðslumiðlun fer fram í gegnum örugga greiðslugátt viðurkennds þjónustuaðila.
      </p>
    )
  },
  {
    title: "9. Lög og varnarþing",
    content: (
      <p>
        Um skilmála þessa og kaup á vefsvæðinu gilda íslensk lög. Rísi mál vegna þeirra skal það rekið fyrir Héraðsdómi Reykjavíkur.
      </p>
    )
  }
];

export default function App() {
  // Navigation active anchors
  const [activeSection, setActiveSection] = useState<string>("atelier");
  
  // Multi-view Routing state ('boutique' represents the main home collection, 'contact' represents the dedicated message logs form page)
  const [activeView, setActiveView] = useState<"boutique" | "contact" | "femme-collection" | "homme-collection" | "checkout" | "account" | "product" | "membership">(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("payment_status") === "success") return "account";
    const view = params.get("view");
    if (view === "membership" || view === "ilmklubbur") return "boutique";
    if (view === "profile" || view === "account" || view === "admin" || view === "dashboard" || view === "orders") return "account";
    if (view === "boutique") return "boutique";
    if (view === "contact") return "contact";
    if (view === "product") return "product";
    return "boutique";
  });

  const [selectedProduct, setSelectedProduct] = useState<Fragrance | null>(null);
  const [lastCollectionGender, setLastCollectionGender] = useState<"femme" | "homme">("femme");

  const [profileResetKey, setProfileResetKey] = useState<number>(0);
  const [profileInitialSubView, setProfileInitialSubView] = useState<"dashboard" | "membership">("dashboard");

  // Kling checkout confirmation toast state
  const [klingOrderConfirmed, setKlingOrderConfirmed] = useState<string | null>(null);

  // Confirmar pedido si el usuario regresa de la pasarela de Kling
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const paymentStatus = params.get("payment_status");
    const orderId = params.get("order_id");

    if (paymentStatus === "success" && orderId) {
      const savedPending = localStorage.getItem("pending_kling_order");
      if (savedPending) {
        try {
          const { orderPayload } = JSON.parse(savedPending);
          if (orderPayload) {
            saveOrderToFirestore(auth.currentUser?.uid || "guest", orderPayload);
            clearUserCartInFirestore(auth.currentUser?.uid || "guest");
            try {
              const existing = JSON.parse(localStorage.getItem("userOrders") || "[]");
              if (Array.isArray(existing) && !existing.some((o: any) => o.id === orderPayload.id)) {
                existing.unshift(orderPayload);
                localStorage.setItem("userOrders", JSON.stringify(existing));
              }
            } catch {
              // ignore local order cache error
            }
          }
        } catch (e) {
          console.warn("Error recuperando pedido pendiente:", e);
        }
        localStorage.removeItem("pending_kling_order");
        setCart([]);
        setKlingOrderConfirmed(orderId);
      }
      localStorage.setItem("user_isLoggedIn", "true");
      setActiveView("account");
      setProfileResetKey((prev) => prev + 1);
      // Limpiar los parámetros de la URL sin recargar
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  // Profile Drawer state
  const [isProfileOpen, setIsProfileOpen] = useState<boolean>(false);

  // Global filters
  const [genderFilter, setGenderFilter] = useState<"all" | "femme" | "homme" | "bestseller">("all");

  // Footwear policy modals
  const [isFaqOpen, setIsFaqOpen] = useState<boolean>(false);
  const [isPrivacyOpen, setIsPrivacyOpen] = useState<boolean>(false);
  const [isShippingOpen, setIsShippingOpen] = useState<boolean>(false);
  const [isRefundOpen, setIsRefundOpen] = useState<boolean>(false);
  const [isTermsOpen, setIsTermsOpen] = useState<boolean>(false);
  const [isAboutOpen, setIsAboutOpen] = useState<boolean>(false);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);
  const [openPrivacyIndex, setOpenPrivacyIndex] = useState<number | null>(null);
  const [openShippingIndex, setOpenShippingIndex] = useState<number | null>(null);
  const [openRefundIndex, setOpenRefundIndex] = useState<number | null>(null);
  const [openTermsIndex, setOpenTermsIndex] = useState<number | null>(null);

  // App-level Multilingual & Search state
  const [language, setLanguage] = useState<Language>("is");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Cart states
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem("luxury_cart");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [activeCoupon, setActiveCoupon] = useState<{ code: string; percent: number } | null>(null);

  // Guard flag to prevent infinite loops between Firestore snapshot listener and local save effect
  const isRemoteCartUpdate = useRef<boolean>(false);

  // Helper to verify if cart contents are structurally identical
  const areCartItemsIdentical = (a: CartItem[], b: CartItem[]) => {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (
        a[i].fragrance.id !== b[i].fragrance.id ||
        a[i].quantity !== b[i].quantity ||
        a[i].sizeSelected !== b[i].sizeSelected
      ) {
        return false;
      }
    }
    return true;
  };

  // Sync cart with localStorage
  useEffect(() => {
    try {
      localStorage.setItem("luxury_cart", JSON.stringify(cart));
    } catch (e) {
      console.warn("Could not save cart to localStorage:", e);
    }
  }, [cart]);

  // Real-time Firestore Cart Sync for authenticated user
  useEffect(() => {
    let unsubCart: (() => void) | null = null;

    const unsubAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        // Subscribe to user cart in Firestore
        unsubCart = subscribeToUserCart(user.uid, (firestoreCart) => {
          if (firestoreCart && Array.isArray(firestoreCart.items)) {
            setCart((prevCart) => {
              if (areCartItemsIdentical(prevCart, firestoreCart.items)) {
                return prevCart; // Keep identical reference to prevent re-render cascades
              }
              isRemoteCartUpdate.current = true;
              return firestoreCart.items;
            });

            if (firestoreCart.discountCode && firestoreCart.discountPercent) {
              setActiveCoupon((prevCoupon) => {
                if (
                  prevCoupon &&
                  prevCoupon.code === firestoreCart.discountCode &&
                  prevCoupon.percent === firestoreCart.discountPercent
                ) {
                  return prevCoupon; // Keep identical reference
                }
                isRemoteCartUpdate.current = true;
                return {
                  code: firestoreCart.discountCode,
                  percent: firestoreCart.discountPercent
                };
              });
            } else if (!firestoreCart.discountCode) {
              setActiveCoupon((prevCoupon) => {
                if (!prevCoupon) return null;
                isRemoteCartUpdate.current = true;
                return null;
              });
            }
          }
        });
      } else {
        if (unsubCart) {
          unsubCart();
          unsubCart = null;
        }
      }
    });

    return () => {
      unsubAuth();
      if (unsubCart) unsubCart();
    };
  }, []);

  // Save cart to Firestore on every update if user is authenticated (skips if update was remote)
  useEffect(() => {
    if (isRemoteCartUpdate.current) {
      isRemoteCartUpdate.current = false;
      return;
    }
    if (auth.currentUser) {
      const subtotal = cart.reduce((acc, item) => acc + getIskPriceNumber(item.fragrance.id) * item.quantity, 0);
      saveUserCartToFirestore(
        auth.currentUser.uid,
        cart,
        subtotal,
        activeCoupon?.code,
        activeCoupon?.percent
      );
    }
  }, [cart, activeCoupon]);

  // Focus modal states
  const [activeRitualFragrance, setActiveRitualFragrance] = useState<Fragrance | null>(null);

  // Secure 1-Minute Discount Advertiser Modal
  const [showDiscountModal, setShowDiscountModal] = useState<boolean>(false);
  const [copiedCodeCode, setCopiedCodeCode] = useState<boolean>(false);
  const [promoEmail, setPromoEmail] = useState<string>("");
  const [promoEmailSuccess, setPromoEmailSuccess] = useState<boolean>(false);
  const [promoEmailError, setPromoEmailError] = useState<string>("");
  const [promoHoneypot, setPromoHoneypot] = useState<string>("");
  const [lastPromoTime, setLastPromoTime] = useState<number>(0);

  const t = TRANSLATIONS[language];

  const pfT: Record<Language, any> = {
    en: {
      openingHoursTitle: "Opening Hours",
      monFri: "Monday - Friday: 10:00 - 18:00",
      sat: "Saturday: 12:00 - 18:00",
      sun: "Sunday: Closed",
      locationTitle: "Location & Connection",
      reykjavik: "Reykjavik, Iceland",
      contactUs: "Contact us: lxsscents@lxsscents.is",
      accessForm: "Access Correspondence Form",
      policiesTitle: "LEGAL",
      faq: "FAQ",
      privacy: "Privacy Policy",
      terms: "Terms & Conditions",
      returnRefund: "Return & Refund Policy",
      shipping: "Shipping Policy",
      termsModalTitle: "Terms & Conditions - LxS SCENTS",
      termsModalContent1: "All formulations, aromatic compositions, and product descriptions produced under LxS SCENTS are proprietary to LxS SCENTS.",
      termsModalContent2: "All fragrances are crafted with certified fragrance oils complying with IFRA international regulations. Orders are dispatched in tamper-evident packaging.",
      closeTermsBtn: "Close Terms",
      aboutUsTitle: "Our Story & Heritage",
      aboutUsContent1: "LxS SCENTS was created to bring the world's most coveted luxury fragrance profiles directly to perfume lovers without unreasonable designer markups. We believe premium fragrance should be accessible, enduring, and honest.",
      aboutUsContent2: "Each bottle is carefully compounded with high concentrations of premium aromatic oils, ensuring outstanding longevity and sillage on the skin.",
      closeAboutUsBtn: "Return to Store"
    },
    is: {
      openingHoursTitle: "Afgreiðslutími",
      monFri: "MÁN - FÖS: 10:00 - 18:00",
      sat: "Laugardagur: 12:00 - 18:00",
      sun: "Sunnudagur: Lokað",
      locationTitle: "Staðsetning & Samskipti",
      reykjavik: "Reykjavík, Ísland",
      contactUs: "HAFA SAMBAND: lxsscents@lxsscents.is",
      accessForm: "Samskiptaform handa þér",
      policiesTitle: "SKILMÁLAR",
      faq: "Algengar Spurningar",
      privacy: "Persónuverndarstefna",
      terms: "Viðskiptaskilmálar",
      returnRefund: "Skilaskilmálar",
      shipping: "Sendingarskilmálar",
      termsModalTitle: "Viðskiptaskilmálar LxS SCENTS",
      termsModalContent1: "Allar formúlur, vörumerkjasamsetningar og vörulýsingar eru eign LxS SCENTS.",
      termsModalContent2: "Ilmvötnin okkar eru framleidd samkvæmt ströngustu alþjóðlegum IFRA stöðlum. Allar pantanir eru sendar í innsigluðum, öruggum umbúðum.",
      closeTermsBtn: "Loka",
      aboutUsTitle: "Saga okkar og Hugmyndafræði",
      aboutUsContent1: "LxS SCENTS var stofnað með það markmið að færa viðskiptavinum eftirsóttustu lúxusilmi heims án óhóflegrar hönnuðaálagningar. Við teljum að hágæða ilmvötn eigi að vera aðgengileg öllum á sanngjörnu verði.",
      aboutUsContent2: "Hver einasti ilmur í safninu okkar er unninn úr vönduðum ilmolíum í hárri samþjöppun (Eau de Parfum) sem tryggir einstaka endingu í allt að 12 klukkustundir.",
      closeAboutUsBtn: "Loka og til baka"
    },
    es: {
      openingHoursTitle: "Horario de Apertura",
      monFri: "Lunes - Viernes: 10:00 - 18:00",
      sat: "Sábado: 12:00 - 18:00",
      sun: "Domingo: Cerrado",
      locationTitle: "Ubicación y Contacto",
      reykjavik: "Reikiavik, Islandia",
      contactUs: "Contáctenos: lxsscents@lxsscents.is",
      accessForm: "Acceder al Formulario de Contacto",
      policiesTitle: "LEGAL",
      faq: "Preguntas Frecuentes",
      privacy: "Política de Privacidad",
      terms: "Términos y Condiciones",
      returnRefund: "Política de Devolución",
      shipping: "Política de Envío",
      termsModalTitle: "Términos y Condiciones - LxS SCENTS",
      termsModalContent1: "Todas las formulaciones y descripciones de producto producidas bajo LxS SCENTS son propiedad exclusiva.",
      termsModalContent2: "Nuestras fragancias son elaboradas con aceites aromáticos de alta graduación cumpliendo con las regulaciones internacionales IFRA.",
      closeTermsBtn: "Cerrar",
      aboutUsTitle: "Nuestra Historia",
      aboutUsContent1: "LxS SCENTS nació con la misión de ofrecer las composiciones olfativas más exclusivas y codiciadas del mundo, con una excelente concentración y longevidad, sin los sobrecostos de las marcas de diseñador.",
      aboutUsContent2: "Cada fragancia es formulada con materias primas certificadas garantizando una estela refinada y una fijación de hasta 12 horas en piel.",
      closeAboutUsBtn: "Volver a la Tienda"
    }
  };

  const pf = pfT[language] || pfT.en;

  // Cleanse memory of signya97@gmail.com from registered promo emails
  useEffect(() => {
    try {
      const registeredListStr = localStorage.getItem("registeredPromoEmails");
      if (registeredListStr) {
        const parsed = JSON.parse(registeredListStr);
        if (Array.isArray(parsed)) {
          const cleaned = parsed.filter(
            (item: unknown) => typeof item === "string" && item.trim().toLowerCase() !== "signya97@gmail.com"
          );
          localStorage.setItem("registeredPromoEmails", JSON.stringify(cleaned));
        }
      }
    } catch {
      // Ignore parsing errors
    }
  }, []);

  // Trigger advertising popup after 30 seconds (30,000 milliseconds)
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowDiscountModal(true);
    }, 30000);
    return () => clearTimeout(timer);
  }, []);

  // Update navbar section observer on scroll
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const offset = 220;
      const perfEl = document.getElementById("les-parfums");
      const askriftirEl = document.getElementById("askriftir-section");

      if (askriftirEl && scrollY >= askriftirEl.offsetTop - offset) {
        setActiveSection("membership");
      } else if (perfEl && scrollY >= perfEl.offsetTop - offset) {
        setActiveSection("parfums");
      } else {
        setActiveSection("atelier");
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Handle URL view query if pointing to membership
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const view = params.get("view");
    if (view === "membership" || view === "ilmklubbur") {
      setTimeout(() => {
        const el = document.getElementById("askriftir-section");
        if (el) {
          const offset = 80;
          const elementPosition = el.getBoundingClientRect().top + window.scrollY;
          window.scrollTo({
            top: elementPosition - offset,
            behavior: "smooth"
          });
        }
      }, 300);
    }
  }, []);

  // Scroll function to navigate sections smoothly
  const handleNavigation = (sectionId: string) => {
    setActiveSection(sectionId);
    if (sectionId === "atelier") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      const element = document.getElementById(sectionId);
      if (element) {
        const offset = 80; // Offset for navbar
        const elementPosition = element.getBoundingClientRect().top + window.scrollY;
        window.scrollTo({
          top: elementPosition - offset,
          behavior: "smooth"
        });
      }
    }
  };

  const handleProductClick = (fragrance: Fragrance) => {
    setSelectedProduct(fragrance);
    setActiveView("product");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Cart Management
  const handleAddToCart = (fragrance: Fragrance) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.fragrance.id === fragrance.id);
      if (existing) {
        return prev.map((item) =>
          item.fragrance.id === fragrance.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { fragrance, quantity: 1, sizeSelected: fragrance.size }];
    });
    setIsCartOpen(true);
  };

  const handleAddCustomToCart = (customScent: CustomScent) => {
    const uniqueId = `bespoke-${Date.now()}`;
    const bespokeProduct: Fragrance = {
      id: uniqueId,
      name: customScent.name.toUpperCase(),
      price: 285,
      size: "50ml",
      concentration: customScent.concentration,
      classification: customScent.classification,
      tagline: customScent.sillage,
      image: "", // Custom item uses generic gradient icon inside bag
      topNotes: customScent.topNotes,
      heartNotes: customScent.heartNotes,
      baseNotes: customScent.baseNotes,
      season: customScent.season,
      sillage: customScent.sillage,
      description: customScent.poeticDescription,
      color: customScent.colorPalette[0] || "#c5a855",
      secondaryColor: customScent.colorPalette[1] || "#080808"
    };

    setCart((prev) => [...prev, { fragrance: bespokeProduct, quantity: 1, sizeSelected: "50ml" }]);
    setIsCartOpen(true);
  };

  const handleUpdateQty = (id: string, isCustom: boolean, change: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.fragrance.id === id) {
            const nextQty = item.quantity + change;
            return { ...item, quantity: nextQty };
          }
          return item;
        })
        .filter((item) => item.quantity > 0)
    );
  };

  const handleRemoveItem = (id: string, isCustom: boolean) => {
    setCart((prev) => prev.filter((item) => item.fragrance.id !== id));
  };

  const handleClearCart = () => {
    setCart([]);
    setActiveCoupon(null);
    if (auth.currentUser) {
      clearUserCartInFirestore(auth.currentUser.uid);
    }
  };

  const handleApplyCoupon = (code: string) => {
    const clean = code.trim().toUpperCase();
    let coupon: { code: string; percent: number } | null = null;
    if (clean === "NORDIC10") coupon = { code: clean, percent: 10 };
    else if (clean === "FROST20") coupon = { code: clean, percent: 20 };
    else if (clean === "ISLANDIA15") coupon = { code: clean, percent: 15 };
    else if (clean === "WELCOME10" || clean === "WELCOME" || clean === "LXSSCENT10" || clean === "LXSSCENTS10") coupon = { code: clean, percent: 10 };
    else if (clean === "LUXURY20") coupon = { code: clean, percent: 20 };
    else if (clean === "HONEST50" || clean === "HONEST") coupon = { code: clean, percent: 50 };
    else if (clean === "BFSHIPPING") coupon = { code: clean, percent: 0 };

    if (coupon) {
      setActiveCoupon(coupon);
      if (auth.currentUser) {
        const subtotal = cart.reduce((acc, item) => acc + getIskPriceNumber(item.fragrance.id) * item.quantity, 0);
        saveUserCartToFirestore(auth.currentUser.uid, cart, subtotal, coupon.code, coupon.percent);
      }
      return {
        success: true,
        message: language === "is"
          ? `${coupon.percent > 0 ? `${coupon.percent}%` : "Frí sending"} afsláttur virkjaður!`
          : language === "es"
          ? `¡Descuento ${coupon.percent > 0 ? `${coupon.percent}%` : "envío gratis"} aplicado!`
          : `Discount applied successfully!`
      };
    }

    return {
      success: false,
      message: language === "is" ? "Ógildur afsláttarkóði." : language === "es" ? "Código de descuento no válido." : "Invalid discount code."
    };
  };

  const triggerCopyPrivilege = () => {
    setCopiedCodeCode(true);
    setTimeout(() => {
      setCopiedCodeCode(false);
    }, 2000);
  };

  return (
    <div id="luxury-app-root" className="bg-[#f5f2eb] text-[#1c1b18] selection:bg-gold-500/40 selection:text-black min-h-screen">
      
      {/* Toast de confirmación de pedido Kling */}
      {klingOrderConfirmed && (
        <div className="fixed top-24 right-4 sm:right-6 z-[9999] max-w-md w-[calc(100%-2rem)] bg-white border border-[#b2903b]/40 rounded-2xl shadow-2xl p-4 sm:p-5 text-left animate-in fade-in slide-in-from-top duration-300">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-600 flex-shrink-0">
              <CheckCircle className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#b2903b] font-bold">
                  {language === "is" ? "PÖNTUN STAÐFEST" : language === "es" ? "PEDIDO CONFIRMADO" : "ORDER CONFIRMED"}
                </span>
                <button
                  type="button"
                  onClick={() => setKlingOrderConfirmed(null)}
                  className="cursor-pointer text-neutral-400 hover:text-neutral-700 p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-sm font-semibold text-neutral-900 mt-0.5">
                {language === "is" ? "Takk fyrir pöntunina!" : language === "es" ? "¡Gracias por su compra!" : "Thank you for your order!"}
              </p>
              <p className="text-xs text-neutral-600 mt-1 font-mono">
                {language === "is"
                  ? `Pöntun ${klingOrderConfirmed} hefur verið vistuð í kerfinu okkar.`
                  : language === "es"
                  ? `Pedido ${klingOrderConfirmed} registrado y guardado en Firestore.`
                  : `Order ${klingOrderConfirmed} has been recorded in our system.`}
              </p>
              <div className="mt-3 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setKlingOrderConfirmed(null);
                    setProfileInitialSubView("dashboard");
                    setActiveView("account");
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className="cursor-pointer text-xs bg-[#b2903b] hover:bg-[#997c32] text-white px-3 py-1.5 rounded-sm font-medium tracking-wide uppercase transition-colors"
                >
                  {language === "is" ? "Skoða pantanir" : language === "es" ? "Ver pedido" : "View orders"}
                </button>
                <button
                  type="button"
                  onClick={() => setKlingOrderConfirmed(null)}
                  className="cursor-pointer text-xs text-neutral-500 hover:text-neutral-800 px-2 py-1.5"
                >
                  {language === "is" ? "Loka" : language === "es" ? "Cerrar" : "Dismiss"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Nav Bar sticky element */}
      <Navbar
        activeSection={activeView === "membership" ? "membership" : activeSection}
        onNavigate={(sec) => {
          setActiveView("boutique");
          handleNavigation(sec);
        }}
        cart={cart}
        onOpenCart={() => setIsCartOpen(true)}
        language={language}
        setLanguage={setLanguage}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onOpenContact={() => setActiveView("contact")}
        onOpenProfile={() => {
          setProfileInitialSubView("dashboard");
          setActiveView("account");
          setProfileResetKey(prev => prev + 1);
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
        onOpenMembership={() => {
          setActiveSection("membership");
          if (activeView !== "boutique") {
            setActiveView("boutique");
            setGenderFilter("all");
            setSearchQuery("");
            setTimeout(() => {
              const element = document.getElementById("askriftir-section");
              if (element) {
                const offset = 80;
                const elementPosition = element.getBoundingClientRect().top + window.scrollY;
                window.scrollTo({
                  top: elementPosition - offset,
                  behavior: "smooth"
                });
              }
            }, 100);
          } else {
            setGenderFilter("all");
            setSearchQuery("");
            setTimeout(() => {
              const element = document.getElementById("askriftir-section");
              if (element) {
                const offset = 80;
                const elementPosition = element.getBoundingClientRect().top + window.scrollY;
                window.scrollTo({
                  top: elementPosition - offset,
                  behavior: "smooth"
                });
              }
            }, 50);
          }
        }}
        onFilterGender={(filter) => {
          if (filter === "femme") {
            setLastCollectionGender("femme");
            setActiveView("femme-collection");
            window.scrollTo({ top: 0, behavior: "smooth" });
          } else if (filter === "homme") {
            setLastCollectionGender("homme");
            setActiveView("homme-collection");
            window.scrollTo({ top: 0, behavior: "smooth" });
          } else if (filter === "bestseller") {
            setGenderFilter("all");
            setActiveView("boutique");
            setTimeout(() => {
              const element = document.getElementById("bestseller-heading-section");
              if (element) {
                const offset = 180; // Larger offset to clear the tall doubled-row header comfortably
                const elementPosition = element.getBoundingClientRect().top + window.scrollY;
                window.scrollTo({
                  top: elementPosition - offset,
                  behavior: "smooth"
                });
              }
            }, 100);
          } else {
            setGenderFilter("all");
            setActiveView("boutique");
            handleNavigation("les-parfums");
          }
        }}
        genderFilter={
          activeView === "femme-collection"
            ? "femme"
            : activeView === "homme-collection"
            ? "homme"
            : activeView === "product" && selectedProduct?.gender === "homme"
            ? "homme"
            : activeView === "product" && selectedProduct?.gender === "femme"
            ? "femme"
            : genderFilter
        }
      />

      {activeView === "boutique" ? (
        <>
          {/* Hero Visual Section */}
          <section
            id="atelier"
            className="relative w-full pt-[56px] sm:pt-[120px] pb-4 sm:pb-6 flex flex-col justify-center items-center overflow-hidden bg-[#f5f2eb]"
          >
            {/* Ambient floating golden particles dust */}
            <div className="absolute inset-0 pointer-events-none z-0">
              <div className="absolute bottom-10 left-[20%] w-[120px] h-[120px] bg-gold-400/10 blur-[80px] rounded-full" />
              <div className="absolute top-24 right-[15%] w-[180px] h-[180px] bg-gold-600/5 blur-[120px] rounded-full" />
            </div>

            {/* The Image (Starting right under the header) */}
            <div className={`relative z-10 w-[115%] sm:w-[110%] md:w-[105%] flex-shrink-0 max-w-none mt-0 aspect-[1280/614] ${searchQuery ? "hidden" : ""}`}>
              <img
                src={IMAGES.hero}
                alt="LxS SCENTS Hero Display"
                referrerPolicy="no-referrer"
                loading="eager"
                fetchPriority="high"
                decoding="async"
                width={1280}
                height={614}
                className="w-full h-auto block transition-opacity duration-700"
              />
            </div>

            {/* Central Core Branding text presentation (The Header) */}
            <div id="hero-brand-contents" className={`relative z-20 text-center px-6 max-w-4xl space-y-4 mt-6 sm:mt-24 ${searchQuery ? "hidden" : ""}` }>
              {/* Grand Elegant Calligraphy Monogram Logo Overlay */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.15] z-[-1] -mt-10 sm:-mt-20">
                <img
                  src="https://i.postimg.cc/wMYnCZpf/LOGO-B2903B-removebg-preview.png"
                  alt="LxS SCENTS Shadow Logo"
                  loading="lazy"
                  decoding="async"
                  width={700}
                  height={550}
                  className="w-[450px] sm:w-[700px] h-[350px] sm:h-[550px] object-contain drop-shadow-[0_15px_30px_rgba(178,144,59,0.3)]"
                />
              </div>

              <span className="text-sm sm:text-base md:text-lg tracking-[0.5em] sm:tracking-[0.6em] text-gold-600 font-sans font-medium uppercase block">
                {t.subTitle}
              </span>

              <h1 className="font-serif italic font-thin text-5xl sm:text-7xl lg:text-8xl tracking-wide text-[#1c1b18] flex flex-col items-center mt-2 relative z-10">
                <span className="leading-none pb-2">{t.heroHeaderFirst}</span>
                <span className="font-serif not-italic font-thin bg-gradient-to-r from-gold-500 via-gold-600 to-gold-500 bg-clip-text text-transparent leading-[1.3] pb-1 -mt-4">
                  {t.heroHeaderSecondary}
                </span>
              </h1>

              <div className="w-16 h-[2px] bg-gold-500 mx-auto mt-0 sm:mt-5 lg:mt-6" />

              <p className="font-sans text-[#4c4a45] font-normal text-[8.5px] min-[360px]:text-[9.5px] sm:text-[12px] md:text-[15px] leading-relaxed sm:leading-relaxed max-w-full sm:max-w-4xl mx-auto tracking-[0.02em] sm:tracking-[0.05em] whitespace-normal sm:whitespace-pre-line break-words px-2 sm:px-0 text-center !mt-2 sm:!mt-8 lg:!mt-8">
                {t.tagline}
              </p>

              <div className="flex justify-center items-center pt-2 sm:pt-10 lg:pt-12">
                <button
                  id="hero-explore-btn"
                  onClick={() => handleNavigation("les-parfums")}
                  className="cursor-pointer bg-gold-500 hover:bg-gold-600 text-white px-8 py-2.5 sm:px-12 sm:py-3.5 tracking-[0.25em] font-sans font-medium text-[8px] sm:text-[10px] uppercase rounded-xs transition-all duration-300 shadow-[0_4px_20px_rgba(178,144,59,0.2)] hover:shadow-[0_4px_25px_rgba(178,144,59,0.35)]"
                >
                  {t.exploreCollection}
                </button>
              </div>
            </div>

          </section>

          {/* Curated collection Section - Filters automatically with Navbar Search state */}
          <ProductSection
            onAddToCart={handleAddToCart}
            onOpenRitual={(f) => setActiveRitualFragrance(f)}
            onProductClick={handleProductClick}
            language={language}
            searchQuery={searchQuery}
            genderFilter={genderFilter}
            setGenderFilter={setGenderFilter}
            onOpenContact={() => {
              setLastCollectionGender(genderFilter === "homme" ? "homme" : "femme");
              setActiveView("contact");
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            onSelectCollection={(gender) => {
              setLastCollectionGender(gender);
              setActiveView(gender === "femme" ? "femme-collection" : "homme-collection");
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          />

          {/* Áskriftir / Subscriptions section on main page under Vinsælast section */}
          <SubscriptionsSection
            language={language}
            onAddToCart={handleAddToCart}
            onOpenCart={() => setIsCartOpen(true)}
          />


        </>
      ) : activeView === "femme-collection" ? (
        <CollectionView
          gender="femme"
          language={language}
          onBack={() => {
            setGenderFilter("all");
            setSearchQuery("");
            setActiveView("boutique");
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
          onAddToCart={handleAddToCart}
          onOpenRitual={(f) => setActiveRitualFragrance(f)}
          onProductClick={handleProductClick}
          searchQuery={searchQuery}
          onOpenContact={() => {
            setLastCollectionGender("femme");
            setActiveView("contact");
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
        />
      ) : activeView === "homme-collection" ? (
        <CollectionView
          gender="homme"
          language={language}
          onBack={() => {
            setGenderFilter("all");
            setSearchQuery("");
            setActiveView("boutique");
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
          onAddToCart={handleAddToCart}
          onOpenRitual={(f) => setActiveRitualFragrance(f)}
          onProductClick={handleProductClick}
          searchQuery={searchQuery}
          onOpenContact={() => {
            setLastCollectionGender("homme");
            setActiveView("contact");
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
        />
      ) : activeView === "checkout" ? (
        <CheckoutPage
          cart={cart}
          language={language}
          onBack={() => {
            setActiveView("boutique");
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
          onClearCart={handleClearCart}
          appliedCoupon={activeCoupon}
          onCouponChange={(c) => {
            setActiveCoupon((prev) => {
              if (!c && !prev) return null;
              if (c && prev && c.code === prev.code && c.percent === prev.percent) return prev;
              return c;
            });
          }}
          onOrderCompleted={() => {
            setProfileResetKey((prev) => prev + 1);
            setActiveView("account");
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
        />
      ) : activeView === "account" || activeView === "membership" ? (
        <ProfilePage
          key={profileResetKey}
          language={language}
          initialSubView={activeView === "membership" ? "membership" : profileInitialSubView}
          onBack={() => {
            setActiveView("boutique");
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
          onAddToCart={handleAddToCart}
          onOpenCart={() => setIsCartOpen(true)}
        />
      ) : activeView === "product" && selectedProduct ? (
        <ProductPage
          product={selectedProduct}
          language={language}
          onBack={() => {
            if (selectedProduct.gender === "femme") {
              setActiveView("femme-collection");
            } else if (selectedProduct.gender === "homme") {
              setActiveView("homme-collection");
            } else {
              setActiveView("boutique");
            }
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
          onAddToCart={handleAddToCart}
        />
      ) : (
        <ContactPage
          language={language}
          onBackToBoutique={() => {
            setActiveView(lastCollectionGender === "homme" ? "homme-collection" : "femme-collection");
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
          onBackToCollection={() => {
            setActiveView(lastCollectionGender === "homme" ? "homme-collection" : "femme-collection");
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
        />
      )}

      {/* Scent Ritual Ceremony Dialogue Modal */}
      {activeRitualFragrance && (
        <div id="ritual-overlay" className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop clicks close */}
          <div
            id="ritual-overlay-clickclose"
            onClick={() => setActiveRitualFragrance(null)}
            className="absolute inset-0 bg-black/85 backdrop-blur-md"
          />

          {/* Modal card */}
          <div
            id="ritual-modal-card"
            className="relative w-full max-w-lg bg-[#0e0e0d] border border-gold-400/20 shadow-2xl p-8 rounded-sm text-center space-y-6 z-10 animate-luxury-entrance"
          >
            <button
              id="close-ritual-modal"
              onClick={() => setActiveRitualFragrance(null)}
              aria-label="Close formula wear ceremony"
              className="cursor-pointer absolute top-4 right-4 p-2 text-neutral-500 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <span className="text-gold-500 text-[9px] tracking-[0.45em] font-sans uppercase block mb-1">
                L'Art du Rituel de Wear
              </span>
              <h3 className="font-serif italic text-2xl tracking-wide text-neutral-100 font-light">
                Wearing Ceremony • {activeRitualFragrance.name}
              </h3>
              <div className="w-10 h-[1px] bg-gold-400 mx-auto mt-4" />
            </div>

            <div className="space-y-4 text-xs font-sans text-neutral-400 leading-relaxed text-left">
              <p>
                <strong className="text-neutral-200 block text-[10px] font-mono uppercase tracking-widest mb-1">
                  I. Act of Atomization
                </strong>
                Depress the vaporisateur trigger exactly seven inches from the chest, warm jugular artery, and tips of the hair curves. Allow the cloud mist to settle silently without friction.
              </p>
              <p>
                <strong className="text-neutral-200 block text-[10px] font-mono uppercase tracking-widest mb-1">
                  II. Crucial Abstained Friction
                </strong>
                Never press or rub the wrists together. Friction damages the delicate, high-volatility top-notes (like saffron and juniper), prematurely releasing the precious absolute particles.
              </p>
              <p>
                <strong className="text-neutral-200 block text-[10px] font-mono uppercase tracking-widest mb-1">
                  III. Fabric Contact & Temperature
                </strong>
                Apply on bare skin specifically after warm bathing while body heat is radiating. For extreme persistence, mist once inside the wool or silk cardigans linings, forming a slow, radiant scent fortress.
              </p>
              <p className="text-[10px] italic text-gold-400/90 pt-2 border-t border-neutral-900 leading-normal">
                *The raw agarwoods and iris particles in {activeRitualFragrance.name} will continue to mature, shift, and lock onto your personal skin chemistry, forming a custom aura completely unique to your body.
              </p>
            </div>

            <button
              id="ritual-modal-acknowledge"
              onClick={() => setActiveRitualFragrance(null)}
              className="cursor-pointer bg-neutral-950 hover:bg-neutral-900 hover:text-white border border-gold-400/30 text-gold-300 py-3 px-8 text-xs font-sans tracking-widest uppercase rounded-xs transition-all duration-300"
            >
              Conclude Ritual Wisdom
            </button>
          </div>
        </div>
      )}

      {/* Cart bag slide-out Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        onUpdateQty={handleUpdateQty}
        onRemoveItem={handleRemoveItem}
        onClearCart={handleClearCart}
        language={language}
        onCheckout={() => {
          setActiveView("checkout");
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
        appliedCoupon={activeCoupon}
        onApplyCoupon={handleApplyCoupon}
        onRemoveCoupon={() => {
          setActiveCoupon(null);
          if (auth.currentUser) {
            const subtotal = cart.reduce((acc, item) => acc + getIskPriceNumber(item.fragrance.id) * item.quantity, 0);
            saveUserCartToFirestore(auth.currentUser.uid, cart, subtotal, "", 0);
          }
        }}
      />

      {/* 60-Second Promotional/Discount Advertiser Modal Popup */}
      {showDiscountModal && (
        <div id="advertiser-discount-overlay" className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            id="ad-overlay-backdrop-close"
            onClick={() => setShowDiscountModal(false)}
            className="absolute inset-0 bg-[#f5f2eb]/35 backdrop-blur-[2px] transition-opacity duration-300"
          />

          <div
            id="discount-commercial-card"
            className="relative w-[95%] sm:w-full max-w-4xl scale-[0.8] sm:scale-100 transform origin-center bg-[#f5f2eb] border border-neutral-300 z-10 rounded-sm shadow-2xl flex flex-col md:flex-row overflow-hidden animate-luxury-entrance max-h-[90vh]"
          >
            {/* Elegant Close Indicator */}
            <button
              id="close-ad-popup-btn"
              onClick={() => setShowDiscountModal(false)}
              className="cursor-pointer absolute top-4 right-4 p-1.5 rounded-full text-neutral-500 hover:text-neutral-800 hover:bg-black/5 transition-all z-20"
              title={t.dismissText}
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
              
              {/* Keep the small logo on the top right side */}
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
                  {language === 'is' ? "10% AFSLÁTTUR AF FYRSTU PÖNTUN" : language === 'es' ? "RECIBE 10% DE DESCUENTO EN TU PRIMER PEDIDO" : "GET 10% OFF YOUR FIRST ORDER"}
                </h2>
                <p className="text-[8px] sm:text-[9.5px] md:text-[11px] lg:text-[12.5px] text-neutral-500 font-sans tracking-wide whitespace-nowrap">
                  {language === 'is' ? "Og vertu fyrst(ur) til að heyra af sérstökum tilboðum" : language === 'es' ? "Y sé el primero en enterarte de nuestras ofertas especiales" : "And be the first one to hear about our special offers"}
                </p>
              </div>

              {/* Email Subscription Box & 10% Off Action Button */}
              {!promoEmailSuccess ? (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (promoHoneypot) {
                      console.warn("Spam bot promo submission blocked.");
                      return;
                    }
                    const now = Date.now();
                    if (now - lastPromoTime < 2500) {
                      setPromoEmailError(language === 'is' ? "Vinsamlegast bíddu augnablik." : language === 'es' ? "Por favor espera unos segundos." : "Please wait a moment.");
                      return;
                    }
                    setLastPromoTime(now);

                    const disposable = ["mailinator.com", "tempmail.com", "10minutemail.com", "guerrillamail.com", "dispostable.com"];
                    const domain = promoEmail.split("@")[1]?.toLowerCase().trim();
                    if (domain && disposable.includes(domain)) {
                      setPromoEmailError(language === 'is' ? "Ógilt netfang." : language === 'es' ? "Por favor introduce un correo válido." : "Please use a valid email.");
                      return;
                    }

                    if (promoEmail && promoEmail.includes("@")) {
                      const emailNormalized = promoEmail.trim().toLowerCase();
                      const registeredListStr = localStorage.getItem("registeredPromoEmails") || "[]";
                      let registeredEmails: string[] = [];
                      try {
                        registeredEmails = JSON.parse(registeredListStr);
                      } catch {
                        registeredEmails = [];
                      }
                      if (!Array.isArray(registeredEmails)) {
                        registeredEmails = [];
                      }
                      
                      // Purge signya97@gmail.com from remembered emails
                      registeredEmails = registeredEmails.filter(
                        (item) => typeof item === "string" && item.trim().toLowerCase() !== "signya97@gmail.com"
                      );

                      if (emailNormalized !== "signya97@gmail.com" && registeredEmails.includes(emailNormalized)) {
                        setPromoEmailError(
                          language === 'is'
                            ? "Þetta netfang hefur þegar verið skráð fyrir afsláttinn"
                            : language === 'es'
                              ? "Este correo electrónico ya ha sido registrado para el descuento"
                              : "This email has already been registered for the discount"
                        );
                        return;
                      }

                      if (emailNormalized !== "signya97@gmail.com") {
                        registeredEmails.push(emailNormalized);
                      }

                      // a) Guarda el correo en Firestore en 'promo_recipients' y 'newsletter'
                      try {
                        setDoc(doc(db, "promo_recipients", emailNormalized), {
                          email: emailNormalized,
                          promoCode: "LXSSCENTS10",
                          sentAt: serverTimestamp()
                        }, { merge: true }).catch(err => console.warn("Could not save to promo_recipients:", err));

                        setDoc(doc(db, "newsletter", emailNormalized), {
                          email: emailNormalized,
                          createdAt: new Date().toISOString()
                        }, { merge: true }).catch(err => console.warn("Could not save to newsletter:", err));
                      } catch (dbErr) {
                        console.warn("Firestore promo registration warning:", dbErr);
                      }

                      // b) Dispara EmailJS con Service ID: 'service_k8k3rsu', Template ID: 'template_g25ynha', y parámetros: { to_email: email, discount_code: 'LXSSCENTS10' }
                      try {
                        const emailConfig = getEmailJsConfig();
                        emailjs.send(
                          "service_k8k3rsu",
                          "template_g25ynha",
                          {
                            to_email: emailNormalized,
                            discount_code: "LXSSCENTS10"
                          },
                          emailConfig.PUBLIC_KEY
                        ).catch(emailErr => console.warn("EmailJS welcome promo dispatch warning:", emailErr));
                      } catch (emailErr) {
                        console.warn("EmailJS warning:", emailErr);
                      }

                      // c) Muestra: "Takk! Kóðinn hefur verið sendur í tölvupóstinn þinn." y guarda en localStorage.
                      localStorage.setItem("registeredPromoEmails", JSON.stringify(registeredEmails));
                      localStorage.setItem("pendingDiscountCode", "LXSSCENTS10");
                      setPromoEmailError("");
                      setPromoEmailSuccess(true);
                    }
                  }}
                  className="w-full space-y-3.5"
                >
                  {/* Anti-spam trap field */}
                  <input
                    type="text"
                    name="b_promo_trap"
                    value={promoHoneypot}
                    onChange={(e) => setPromoHoneypot(e.target.value)}
                    style={{ display: "none", position: "absolute", left: "-9999px" }}
                    tabIndex={-1}
                    autoComplete="off"
                    aria-hidden="true"
                  />

                  <div className="w-full">
                    <input
                      type="email"
                      required
                      value={promoEmail}
                      onChange={(e) => {
                        setPromoEmail(e.target.value);
                        setPromoEmailError("");
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
                      placeholder={language === 'is' ? "Sláðu inn netfangið þitt" : language === 'es' ? "Introduce tu correo electrónico" : "Enter your email"}
                      className="w-full bg-white border border-neutral-300 text-sm p-3.5 outline-none text-neutral-900 focus:border-[#b2903b] rounded-sm font-sans placeholder-neutral-400 text-center tracking-normal"
                    />
                  </div>

                  {promoEmailError && (
                    <p className="text-xs sm:text-sm text-red-600 font-sans mt-1 text-center font-medium">
                      {promoEmailError}
                    </p>
                  )}

                  <button
                    type="submit"
                    className="cursor-pointer w-full bg-[#b2903b] hover:bg-[#997c32] text-white text-center font-sans tracking-[0.15em] font-bold py-3.5 rounded-sm text-xs uppercase transition-all duration-300 shadow-md"
                  >
                    {language === 'is' ? "FÁÐU 10% AFSLÁTT" : language === 'es' ? "OBTENER 10% DESCUENTO" : "GET 10% OFF"}
                  </button>
                </form>
              ) : (
                <div className="w-full py-5 px-6 bg-[#fbf9f5] border border-[#b2903b]/30 rounded-sm text-center space-y-3 animate-luxury-entrance">
                  <h3 className="text-[#b2903b] font-serif font-bold block text-base sm:text-lg tracking-wide">
                    {language === 'is' ? "Takk fyrir!" : language === 'es' ? "¡Gracias!" : "Thank you!"}
                  </h3>
                  <p className="text-xs sm:text-sm text-neutral-700 font-sans whitespace-nowrap leading-relaxed">
                    {language === 'is' 
                      ? "Kóðinn hefur verið sendur í tölvupóstinn þinn." 
                      : language === 'es'
                        ? "El código de descuento ha sido enviado a tu correo"
                        : "The discount code has been sent to your email"}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      localStorage.setItem("pendingDiscountCode", "LXSSCENTS10");
                      setShowDiscountModal(false);
                    }}
                    className="cursor-pointer bg-[#b2903b] hover:bg-[#997c32] text-white text-xs font-bold tracking-widest px-6 py-3 uppercase mt-2 rounded-xs transition-all w-full leading-none shadow-sm"
                  >
                    {language === 'is' ? "Halda áfram að versla" : language === 'es' ? "Continuar comprando" : "Continue shopping"}
                  </button>
                </div>
              )}

              {/* No Thanks option */}
              {!promoEmailSuccess && (
                <button
                  onClick={() => setShowDiscountModal(false)}
                  className="cursor-pointer text-center text-neutral-400 hover:text-neutral-900 transition-colors text-[10px] sm:text-xs uppercase font-sans tracking-widest block mx-auto underline mt-1"
                >
                  {language === 'is' ? "Nei takk..." : language === 'es' ? "No gracias..." : "No thanks..."}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Discreet floating VIP gift banner launcher, so user doesn't have to wait 30 seconds during testing */}
      <div className="fixed bottom-6 right-6 z-40">
        <button
          onClick={() => {
            setPromoEmail("");
            setPromoEmailError("");
            setPromoEmailSuccess(false);
            setShowDiscountModal(true);
          }}
          className="cursor-pointer group relative flex items-center justify-center bg-[#b2903b] hover:bg-[#997c32] text-white p-2.5 h-10 w-10 sm:p-3 sm:h-12 sm:w-12 rounded-full shadow-2xl transition-all duration-300 focus:outline-none"
          title="Open VIP Voucher Scent Privilege Offer"
        >
          <Gift className="w-4 h-4 sm:w-5 sm:h-5 group-hover:scale-110 transition-transform" />
        </button>
      </div>

      {/* Creative Footer / Brand fine detail coordinates */}
      <footer id="brand-footer" className="bg-[#fbf9f5] border-t border-gold-500/15 text-[#4c4a45] py-8 sm:py-16 font-sans uppercase relative z-20">
        <div className="max-w-7xl mx-auto px-6 space-y-6 sm:space-y-12">
          
          {/* Main Footer Grid: 3 columns (Left, Middle, Right) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 sm:gap-12 text-left sm:text-center md:text-left text-[8px] sm:text-[9.5px] tracking-widest border-b border-gold-500/10 pb-4 sm:pb-12">
            
            {/* Col 1: Left Side - Opening Hours */}
            <div className="space-y-1.5 text-left">
              <span className="font-serif text-[9.5px] sm:text-[11px] text-[#b2903b] tracking-[0.3em] font-bold block uppercase">
                {pf.openingHoursTitle}
              </span>
              <div className="space-y-3.5 text-[#1c1b18] font-sans text-[8px] sm:text-[9.5px] leading-relaxed">
                <div className="space-y-0.5">
                  <p className="tracking-wider"><span className="sm:hidden">• </span>{pf.monFri}</p>
                  <p className="tracking-wider"><span className="sm:hidden">• </span>{pf.sat}</p>
                  <p className="tracking-wider"><span className="sm:hidden">• </span>{pf.sun}</p>
                </div>
              </div>
            </div>

            {/* Col 2: Middle - About Us header, Reykjavik, Contact email and Social icons */}
            <div className="space-y-1.5">
              <span className="font-serif text-[9.5px] sm:text-[11px] text-[#b2903b] tracking-[0.3em] font-bold block uppercase">
                {language === 'is' ? "UM OKKUR" : language === 'es' ? "SOBRE NOSOTROS" : "ABOUT US"}
              </span>
              <div className="space-y-1 font-sans text-[8px] sm:text-[9.5px] leading-relaxed text-[#1c1b18] tracking-wider flex flex-col items-start">
                <div className="">
                  <button
                    onClick={() => setIsAboutOpen(true)}
                    className="cursor-pointer text-left sm:text-center md:text-left hover:text-gold-600 hover:underline transition-colors uppercase tracking-wider duration-200 block text-[8px] sm:text-[9.5px] text-[#1c1b18]"
                  >
                    <span className="sm:hidden">• </span>{language === 'is' ? "UM OKKUR" : language === 'es' ? "SOBRE NOSOTROS" : "ABOUT US"}
                  </button>
                </div>
                <p className="uppercase tracking-wider text-[#1c1b18] font-normal text-left sm:text-center md:text-left w-full">
                  <span className="sm:hidden">• </span>{language === 'is' ? "HAFA SAMBAND: " : "CONTACT US: "}
                  <a href="mailto:lxsscents@lxsscents.is" className="hover:text-gold-600 transition-colors underline sm:no-underline">
                    LXSSCENTS@LXSSCENTS.IS
                  </a>
                </p>
                <p className="text-[#4c4a45] tracking-wider text-[8px] sm:text-[9.5px] text-left sm:text-center md:text-left w-full">
                  {pf.reykjavik}
                </p>
                
                {/* Social media icons grid list */}
                <div className="flex items-center justify-start sm:justify-center md:justify-start space-x-3 pt-2 sm:pt-4 w-full">
                  <a
                    href="https://instagram.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 sm:p-2 bg-white border border-gold-500/15 hover:border-gold-500 hover:text-gold-600 rounded text-[#1c1b18] transition-all duration-300"
                    title="Instagram @lxsscents"
                  >
                    <Instagram className="w-4 h-4 sm:w-5 sm:h-5" />
                  </a>
                  <a
                    href="https://facebook.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 sm:p-2 bg-white border border-gold-500/15 hover:border-gold-500 hover:text-gold-600 rounded text-[#1c1b18] transition-all duration-300"
                    title="Facebook LxS SCENTS"
                  >
                    <Facebook className="w-4 h-4 sm:w-5 sm:h-5" />
                  </a>
                </div>
              </div>
            </div>

            {/* Col 3: Right Side - Policies */}
            <div className="space-y-1.5">
              <span className="font-serif text-[9.5px] sm:text-[11px] text-[#b2903b] tracking-[0.3em] font-bold block uppercase text-left sm:text-center md:text-left w-full">
                {pf.policiesTitle}
              </span>
              <ul className="space-y-1 font-sans text-[8px] sm:text-[9.5px] leading-relaxed text-[#1c1b18] tracking-wider flex flex-col items-start sm:items-center md:items-start">
                <li>
                  <button
                    onClick={() => setIsFaqOpen(true)}
                    className="cursor-pointer text-left sm:text-center md:text-left hover:text-gold-600 hover:underline transition-colors uppercase tracking-wider duration-200 whitespace-nowrap"
                  >
                    <span className="sm:hidden">• </span>{pf.faq}
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setIsPrivacyOpen(true)}
                    className="cursor-pointer text-left sm:text-center md:text-left hover:text-gold-600 hover:underline transition-colors uppercase tracking-wider duration-200 whitespace-nowrap"
                  >
                    <span className="sm:hidden">• </span>{pf.privacy}
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setIsTermsOpen(true)}
                    className="cursor-pointer text-left sm:text-center md:text-left hover:text-gold-600 hover:underline transition-colors uppercase tracking-wider duration-200 whitespace-nowrap"
                  >
                    <span className="sm:hidden">• </span>{pf.terms}
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setIsRefundOpen(true)}
                    className="cursor-pointer text-left sm:text-center md:text-left hover:text-gold-600 hover:underline transition-colors uppercase tracking-wider duration-200 whitespace-nowrap"
                  >
                    <span className="sm:hidden">• </span>{pf.returnRefund}
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setIsShippingOpen(true)}
                    className="cursor-pointer text-left sm:text-center md:text-left hover:text-gold-600 hover:underline transition-colors uppercase tracking-wider duration-200 whitespace-nowrap"
                  >
                    <span className="sm:hidden">• </span>{pf.shipping}
                  </button>
                </li>
              </ul>
            </div>

          </div>

          {/* Copyright Row */}
          <div className="flex flex-col items-center justify-center text-[#4c4a45] font-sans text-[8px] sm:text-[9.5px] tracking-wider gap-3 sm:gap-4 pt-1 sm:pt-4 uppercase text-center">
            <div className="text-center">
              <p className="text-[#1c1b18] font-serif italic text-[11.5px] sm:text-[13px] tracking-[0.3em] mb-1 leading-none">LxS SCENTS</p>
              <p className="text-[8px] sm:text-[9.5px] text-[#4c4a45]">REYKJAVIK • ICELAND</p>
            </div>
            <p className="text-center text-[8px] sm:text-[9.5px] text-[#4c4a45] whitespace-nowrap normal-case">
              © {new Date().getFullYear()} LxS Scents ehf. {language === "is" ? "Öll réttindi áskilin" : "All rights reserved."}
            </p>
          </div>

        </div>
      </footer>



      {/* FAQ Modal */}
      {isFaqOpen && (
        <div id="faq-overlay-modal" className="fixed inset-0 z-50 bg-[#f4f4f4] overflow-y-auto">
          <div className="relative w-full max-w-4xl mx-auto px-6 py-20 animate-luxury-entrance text-[#1c1b18] min-h-screen flex flex-col">
            <button onClick={() => setIsFaqOpen(false)} className="cursor-pointer fixed top-6 right-6 md:top-10 md:right-10 p-3 bg-white border border-[#e5e5e5] rounded-full shadow-sm text-neutral-500 hover:text-black z-20"><X className="w-5 h-5" /></button>
            
            <div className="mb-10 mt-8">
              <h1 className="text-5xl md:text-6xl font-sans text-[#2d3748] tracking-widest uppercase" style={{fontFamily: "'Inter', sans-serif"}}>
                {language === 'is' ? 'Algengar spurningar' : 'FAQ'}
              </h1>
            </div>

            <div className="w-full">
              <div className="border-t border-[#e2e8f0]">
                {(language === 'is' ? DOTTIR_FAQS_IS : DOTTIR_FAQS).map((faq, index) => (
                  <div key={index} className="border-b border-[#e2e8f0]">
                    <button 
                      onClick={() => setOpenFaqIndex(openFaqIndex === index ? null : index)}
                      className="w-full py-5 flex justify-between items-center text-left focus:outline-none cursor-pointer group"
                    >
                      <span className="text-lg text-[#4a5568] font-sans tracking-wide font-bold">{faq.question}</span>
                      <ChevronDown className={`w-4 h-4 text-[#a0aec0] transition-transform duration-300 group-hover:text-[#4a5568] ${openFaqIndex === index ? 'rotate-180' : ''}`} strokeWidth={1.5} />
                    </button>
                    <div className={`overflow-hidden transition-all duration-300 ease-in-out ${openFaqIndex === index ? 'max-h-40 pb-5 opacity-100' : 'max-h-0 opacity-0'}`}>
                      <p className="text-lg text-[#718096] leading-relaxed font-light">
                        {faq.answer}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-14 mb-10 flex flex-col justify-center items-center gap-8">
              <button 
                onClick={() => setIsFaqOpen(false)}
                className="px-8 py-3 text-sm tracking-widest uppercase border border-gold-500 hover:border-gold-600 text-gold-500 hover:text-gold-600 transition-colors duration-300 font-sans cursor-pointer focus:outline-none"
              >
                {language === 'is' ? 'AFTUR Á FORSÍÐU' : 'Back to main page'}
              </button>
              <img 
                src="https://i.postimg.cc/wMYnCZpf/LOGO-B2903B-removebg-preview.png" 
                alt="Brand Logo" 
                loading="lazy"
                decoding="async"
                width={240}
                height={128}
                className="h-32 object-contain opacity-80 cursor-pointer hover:opacity-100 transition-opacity" 
                referrerPolicy="no-referrer" 
                onClick={() => {
                  setIsFaqOpen(false);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Privacy Policy Modal */}
      {isPrivacyOpen && (
        <div id="privacy-overlay-modal" className="fixed inset-0 z-50 bg-[#f4f4f4] overflow-y-auto">
          <div className="relative w-full max-w-4xl mx-auto px-6 py-20 animate-luxury-entrance text-[#1c1b18] min-h-screen flex flex-col">
            <button onClick={() => setIsPrivacyOpen(false)} className="cursor-pointer fixed top-6 right-6 md:top-10 md:right-10 p-3 bg-white border border-[#e5e5e5] rounded-full shadow-sm text-neutral-500 hover:text-black z-20"><X className="w-5 h-5" /></button>
            
            <div className="mb-5 mt-8">
              <h1 className="text-4xl md:text-5xl font-sans text-[#2d3748] tracking-widest uppercase mb-6" style={{fontFamily: "'Inter', sans-serif"}}>
                {language === 'is' ? 'Persónuverndarstefna' : 'Privacy Policy'}
              </h1>
              <div className="space-y-4 text-lg text-[#4a5568] font-sans font-light leading-relaxed mb-5">
                {language === 'is' ? (
                  <>
                    <p>Þessi persónuverndarstefna lýsir því hvernig LxS Scents („vefsvæðið“, „við“, „okkur“ eða „okkar“) safnar, notar og miðlar persónuupplýsingum þínum þegar þú heimsækir, notar þjónustu okkar eða verslar á lxsscents.com („vefsvæðið“) eða átt í öðrum samskiptum við okkur varðandi vefsvæðið (sameiginlega kallað „þjónustan“).</p>
                    <p>Í skilningi þessarar persónuverndarstefnu merkir „þú“ og „þitt“ þig sem notanda þjónustunnar, hvort sem þú ert viðskiptavinur, gestur á vefsvæðinu eða annar einstaklingur sem við höfum safnað upplýsingum um samkvæmt þessari persónuverndarstefnu.</p>
                    <p>Vinsamlegast lestu þessa persónuverndarstefnu vandlega.</p>
                  </>
                ) : (
                  <>
                    <p>This Privacy Policy describes how LxS Scents (the "Site", "we", "us", or "our") collects, uses, and discloses your personal information when you visit, use our services, or make a purchase from lxsscents.com (the "Site") or otherwise communicate with us regarding the Site (collectively, the "Services").</p>
                    <p>For purposes of this Privacy Policy, "you" and "your" means you as the user of the Services, whether you are a customer, website visitor, or another individual whose information we have collected pursuant to this Privacy Policy.</p>
                    <p>Please read this Privacy Policy carefully.</p>
                  </>
                )}
              </div>
            </div>

            <div className="w-full">
              <div className="border-t border-[#e2e8f0]">
                {(language === 'is' ? DOTTIR_PRIVACY_SECTIONS_IS : DOTTIR_PRIVACY_SECTIONS).map((section, index) => (
                  <div key={index} className="border-b border-[#e2e8f0]">
                    <button 
                      onClick={() => setOpenPrivacyIndex(openPrivacyIndex === index ? null : index)}
                      className="w-full py-5 flex justify-between items-center text-left focus:outline-none cursor-pointer group"
                    >
                      <span className="text-lg text-[#4a5568] font-sans tracking-wide font-bold">{section.title}</span>
                      <ChevronDown className={`w-4 h-4 text-[#a0aec0] transition-transform duration-300 group-hover:text-[#4a5568] ${openPrivacyIndex === index ? 'rotate-180' : ''}`} strokeWidth={1.5} />
                    </button>
                    <div className={`overflow-hidden transition-all duration-300 ease-in-out ${openPrivacyIndex === index ? 'max-h-[3000px] pb-5 opacity-100' : 'max-h-0 opacity-0'}`}>
                      <div className="text-lg text-[#718096] leading-relaxed font-light">
                        {section.content}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-14 mb-10 flex flex-col justify-center items-center gap-8">
              <button 
                onClick={() => setIsPrivacyOpen(false)}
                className="px-8 py-3 text-sm tracking-widest uppercase border border-gold-500 hover:border-gold-600 text-gold-500 hover:text-gold-600 transition-colors duration-300 font-sans cursor-pointer focus:outline-none"
              >
                {language === 'is' ? 'AFTUR Á FORSÍÐU' : 'Back to main page'}
              </button>
              <img 
                src="https://i.postimg.cc/wMYnCZpf/LOGO-B2903B-removebg-preview.png" 
                alt="Brand Logo" 
                loading="lazy"
                decoding="async"
                width={240}
                height={128}
                className="h-32 object-contain opacity-80 cursor-pointer hover:opacity-100 transition-opacity" 
                referrerPolicy="no-referrer" 
                onClick={() => {
                  setIsPrivacyOpen(false);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Shipping Policy Modal */}
      {isShippingOpen && (
        <div id="shipping-overlay-modal" className="fixed inset-0 z-50 bg-[#f4f4f4] overflow-y-auto">
          <div className="relative w-full max-w-4xl mx-auto px-6 py-20 animate-luxury-entrance text-[#1c1b18] min-h-screen flex flex-col">
            <button onClick={() => setIsShippingOpen(false)} className="cursor-pointer fixed top-6 right-6 md:top-10 md:right-10 p-3 bg-white border border-[#e5e5e5] rounded-full shadow-sm text-neutral-500 hover:text-black z-20"><X className="w-5 h-5" /></button>
            <div className="mb-5 mt-8">
              <h1 className="text-4xl md:text-5xl font-sans text-[#2d3748] tracking-widest uppercase mb-6" style={{fontFamily: "'Inter', sans-serif"}}>{pf.shipping}</h1>
              <div className="space-y-4 text-lg text-[#4a5568] font-sans font-light leading-relaxed mb-5">
                {language === 'is' ? (
                  <p>Við hjá LxS Scents bjóðum upp á innanlandssendingar um allt <strong>Ísland</strong> og alþjóðlegar sendingar til valinna svæða um allan heim.</p>
                ) : (
                  <p>We at LxS Scents offer domestic shipping across <strong>Iceland</strong> and international shipping to selected global regions.</p>
                )}
              </div>
            </div>
            
            <div className="w-full">
              <div className="border-t border-[#e2e8f0]">
                {(language === 'is' ? DOTTIR_SHIPPING_SECTIONS_IS : DOTTIR_SHIPPING_SECTIONS).map((section, index) => (
                  <div key={index} className="border-b border-[#e2e8f0]">
                    <button 
                      onClick={() => setOpenShippingIndex(openShippingIndex === index ? null : index)}
                      className="w-full py-5 flex justify-between items-center text-left focus:outline-none cursor-pointer group"
                    >
                      <span className="text-lg text-[#4a5568] font-sans tracking-wide font-bold">{section.title}</span>
                      <ChevronDown className={`w-4 h-4 text-[#a0aec0] transition-transform duration-300 group-hover:text-[#4a5568] ${openShippingIndex === index ? 'rotate-180' : ''}`} strokeWidth={1.5} />
                    </button>
                    <div className={`overflow-hidden transition-all duration-300 ease-in-out ${openShippingIndex === index ? 'max-h-[3000px] pb-5 opacity-100' : 'max-h-0 opacity-0'}`}>
                      <div className="text-lg text-[#718096] leading-relaxed font-light">
                        {section.content}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-14 mb-10 flex flex-col justify-center items-center gap-8">
              <button 
                onClick={() => setIsShippingOpen(false)}
                className="px-8 py-3 text-sm tracking-widest uppercase border border-gold-500 hover:border-gold-600 text-gold-500 hover:text-gold-600 transition-colors duration-300 font-sans cursor-pointer focus:outline-none"
              >
                {language === 'is' ? 'AFTUR Á FORSÍÐU' : 'Back to main page'}
              </button>
              <img 
                src="https://i.postimg.cc/wMYnCZpf/LOGO-B2903B-removebg-preview.png" 
                alt="Brand Logo" 
                loading="lazy"
                decoding="async"
                width={240}
                height={128}
                className="h-32 object-contain opacity-80 cursor-pointer hover:opacity-100 transition-opacity" 
                referrerPolicy="no-referrer" 
                onClick={() => {
                  setIsShippingOpen(false);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Refund and Return Policy Modal */}
      {isRefundOpen && (
        <div id="refund-overlay-modal" className="fixed inset-0 z-50 bg-[#f4f4f4] overflow-y-auto">
          <div className="relative w-full max-w-4xl mx-auto px-6 py-20 animate-luxury-entrance text-[#1c1b18] min-h-screen flex flex-col">
            <button onClick={() => setIsRefundOpen(false)} className="cursor-pointer fixed top-6 right-6 md:top-10 md:right-10 p-3 bg-white border border-[#e5e5e5] rounded-full shadow-sm text-neutral-500 hover:text-black z-20"><X className="w-5 h-5" /></button>
            <div className="mb-5 mt-8">
              <h1 className="text-4xl md:text-5xl font-sans text-[#2d3748] tracking-widest uppercase mb-6" style={{fontFamily: "'Inter', sans-serif"}}>{pf.returnRefund}</h1>
              <div className="space-y-4 text-lg text-[#4a5568] font-sans font-light leading-relaxed mb-5">
                {language === 'is' ? (
                  <p>Við hjá LxS Scents viljum við að þú sért fyllilega ánægð(ur) með ilmkaupin þín. Vegna persónulegs og hreinlætislegs eðlis ilmvatna, sem og flutningsreglna varðandi eldfima vökva, eru skilareglur okkar strangar. Vinsamlegast lestu eftirfarandi leiðbeiningar vandlega áður en þú hefur skilaferli.</p>
                ) : (
                  <p>At LxS Scents, we want you to be completely satisfied with your fragrance purchase. Due to the personal and hygienic nature of perfumes, as well as shipping regulations concerning flammable liquids, our return policy is strict. Please read the following guidelines carefully before initiating a return.</p>
                )}
              </div>
            </div>
            
            <div className="w-full">
              <div className="border-t border-[#e2e8f0]">
                {(language === 'is' ? DOTTIR_REFUND_SECTIONS_IS : DOTTIR_REFUND_SECTIONS).map((section, index) => (
                  <div key={index} className="border-b border-[#e2e8f0]">
                    <button 
                      onClick={() => setOpenRefundIndex(openRefundIndex === index ? null : index)}
                      className="w-full py-5 flex justify-between items-center text-left focus:outline-none cursor-pointer group"
                    >
                      <span className="text-lg text-[#4a5568] font-sans tracking-wide font-bold">{section.title}</span>
                      <ChevronDown className={`w-4 h-4 text-[#a0aec0] transition-transform duration-300 group-hover:text-[#4a5568] ${openRefundIndex === index ? 'rotate-180' : ''}`} strokeWidth={1.5} />
                    </button>
                    <div className={`overflow-hidden transition-all duration-300 ease-in-out ${openRefundIndex === index ? 'max-h-[3000px] pb-5 opacity-100' : 'max-h-0 opacity-0'}`}>
                      <div className="text-lg text-[#718096] leading-relaxed font-light">
                        {section.content}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-14 mb-10 flex flex-col justify-center items-center gap-8">
              <button 
                onClick={() => setIsRefundOpen(false)}
                className="px-8 py-3 text-sm tracking-widest uppercase border border-gold-500 hover:border-gold-600 text-gold-500 hover:text-gold-600 transition-colors duration-300 font-sans cursor-pointer focus:outline-none"
              >
                {language === 'is' ? 'AFTUR Á FORSÍÐU' : 'Back to main page'}
              </button>
              <img 
                src="https://i.postimg.cc/wMYnCZpf/LOGO-B2903B-removebg-preview.png" 
                alt="Brand Logo" 
                loading="lazy"
                decoding="async"
                width={240}
                height={128}
                className="h-32 object-contain opacity-80 cursor-pointer hover:opacity-100 transition-opacity" 
                referrerPolicy="no-referrer" 
                onClick={() => {
                  setIsRefundOpen(false);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Terms and Conditions Modal */}
      {isTermsOpen && (
        <div id="terms-overlay-modal" className="fixed inset-0 z-50 bg-[#f4f4f4] overflow-y-auto">
          <div className="relative w-full max-w-4xl mx-auto px-6 py-20 animate-luxury-entrance text-[#1c1b18] min-h-screen flex flex-col">
            <button onClick={() => setIsTermsOpen(false)} className="cursor-pointer fixed top-6 right-6 md:top-10 md:right-10 p-3 bg-white border border-[#e5e5e5] rounded-full shadow-sm text-neutral-500 hover:text-black z-20"><X className="w-5 h-5" /></button>
            <div className="mb-5 mt-8">
              <h1 className="text-4xl md:text-5xl font-sans text-[#2d3748] tracking-widest uppercase mb-6" style={{fontFamily: "'Inter', sans-serif"}}>
                {language === 'is' ? 'Almennir skilmálar fyrir greiðslur hjá LxS Scents ehf.' : pf.terms}
              </h1>
              <div className="space-y-4 text-lg text-[#4a5568] font-sans font-light leading-relaxed mb-5">
                {language === 'is' ? (
                  <>
                    <p>Þessir skilmálar gilda um greiðslur með korti eða kröfu á greiðslusíðum LxS Scents ehf. (kt. 6906261600). Með því að ljúka greiðslu staðfestir þú að þú hafir lesið skilmálana og samþykkir þá.</p>
                  </>
                ) : (
                  <>
                    <p>Welcome to LxS Scents ("we," "our," or "us").</p>
                    <p>By accessing or using our website (lxsscents.com) and purchasing our products, you agree to be bound by the following Terms of Service.</p>
                    <p>Please read them carefully.</p>
                  </>
                )}
              </div>
            </div>
            
            <div className="w-full">
              <div className="border-t border-[#e2e8f0]">
                {(language === 'is' ? DOTTIR_TERMS_SECTIONS_IS : DOTTIR_TERMS_SECTIONS).map((section, index) => (
                  <div key={index} className="border-b border-[#e2e8f0]">
                    <button 
                      onClick={() => setOpenTermsIndex(openTermsIndex === index ? null : index)}
                      className="w-full py-5 flex justify-between items-center text-left focus:outline-none cursor-pointer group"
                    >
                      <span className="text-lg text-[#4a5568] font-sans tracking-wide font-bold">{section.title}</span>
                      <ChevronDown className={`w-4 h-4 text-[#a0aec0] transition-transform duration-300 group-hover:text-[#4a5568] ${openTermsIndex === index ? 'rotate-180' : ''}`} strokeWidth={1.5} />
                    </button>
                    <div className={`overflow-hidden transition-all duration-300 ease-in-out ${openTermsIndex === index ? 'max-h-[3000px] pb-5 opacity-100' : 'max-h-0 opacity-0'}`}>
                      <div className="text-lg text-[#718096] leading-relaxed font-light">
                        {section.content}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-14 mb-10 flex flex-col justify-center items-center gap-8">
              <button 
                onClick={() => setIsTermsOpen(false)}
                className="px-8 py-3 text-sm tracking-widest uppercase border border-gold-500 hover:border-gold-600 text-gold-500 hover:text-gold-600 transition-colors duration-300 font-sans cursor-pointer focus:outline-none"
              >
                {language === 'is' ? 'AFTUR Á FORSÍÐU' : 'Back to main page'}
              </button>
              <img 
                src="https://i.postimg.cc/wMYnCZpf/LOGO-B2903B-removebg-preview.png" 
                alt="Brand Logo" 
                loading="lazy"
                decoding="async"
                width={240}
                height={128}
                className="h-32 object-contain opacity-80 cursor-pointer hover:opacity-100 transition-opacity" 
                referrerPolicy="no-referrer" 
                onClick={() => {
                  setIsTermsOpen(false);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
              />
            </div>
          </div>
        </div>
      )}


      {/* About Us Story Modal */}
      {isAboutOpen && (
        <div id="about-us-overlay-modal" className="fixed inset-0 z-50 bg-[#f4f4f4] overflow-y-auto">
          <div className="relative w-full max-w-4xl mx-auto px-6 py-20 animate-luxury-entrance text-[#1c1b18] min-h-screen flex flex-col justify-between">
            <button onClick={() => setIsAboutOpen(false)} className="cursor-pointer fixed top-6 right-6 md:top-10 md:right-10 p-3 bg-white border border-[#e5e5e5] rounded-full shadow-sm text-neutral-500 hover:text-black z-20"><X className="w-5 h-5" /></button>
            
            <div className="flex flex-col items-center flex-grow">
              {/* Top Logo */}
              <div className="mb-14 mt-4 flex justify-center w-full">
                <img 
                  src="https://i.postimg.cc/wMYnCZpf/LOGO-B2903B-removebg-preview.png" 
                  alt="Brand Logo" 
                  loading="lazy"
                  decoding="async"
                  width={360}
                  height={192}
                  className="h-48 object-contain opacity-90 cursor-pointer hover:opacity-100 transition-opacity" 
                  referrerPolicy="no-referrer" 
                  onClick={() => {
                    setIsAboutOpen(false);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                />
              </div>

              {/* Title Content */}
              <div className="w-full text-center mb-10">
                <h1 className="text-4xl md:text-5xl font-serif tracking-wide text-[#2d3748] uppercase mb-6">
                  {language === 'is' ? <>Velkomin til L<span className="lowercase">x</span>S Scents</> : <>Welcome to L<span className="lowercase">x</span>S Scents</>}
                </h1>
                <div className="w-16 h-[1px] bg-[#c5a855] mx-auto" />
              </div>

              {/* Text Content */}
              <div className="w-full max-w-3xl space-y-6 text-lg text-[#4a5568] font-sans font-light leading-relaxed mb-6">
                {language === 'is' ? (
                  <>
                    <p>
                      Okkur finnst að þú ættir ekki að þurfa að tæma bankann til að lykta dásamlega. Við elskum hágæða ilmvötn en fengum nóg af okurverðinu í bransanum. Markmiðið okkar er því sáraeinfalt: að gera vinsælustu og flottustu ilma heims aðgengilegri fyrir alla.
                    </p>
                    <p>
                      Alltof lengi hafa þekktustu ilmvatns fyrirtækin lagt á svokallaðan „vörumerkjaskatt“ – rukkað alltof mikið til að borga fyrir frægt fólk í auglýsingum, dýrar herferðir og stórar umbúðir. Við ákváðum að henda þessu öllu út og leggja einungis áherslu á það sem skiptir máli: ilminn sjálfan.
                    </p>
                    <p>
                      <strong className="font-bold text-[#1c1b18]">Listin við fullkomnu blönduna</strong><br/>
                      Það er algjör list og nákvæmnisvinna að búa til hinn fullkomna ilm. Við erum sérfræðingar í ilmgerð og tökum eftirsóttustu ilmina algjörlega í nefið með því að nota nákvæmlega sömu gæðaefni og þekktustu ilmvatns fyrirtækin. Með því að einblína eingöngu á efnafræðina á bak við lyktina, fáum við fram ilm sem er nákvæmlega eins og uppáhalds lúxusilmurinn þinn, sem endist alveg jafn lengi og jafnvel lengur.
                    </p>
                    <p>
                      <strong className="font-bold text-[#1c1b18]">Einfaldleikinn í fyrirrúmi</strong><br/>
                      Útlitið okkar snýst um að hafa hlutina einfalda – hugsaðu þér hreinar, beinar glerflöskur sem liggja flatar á hrárri steinklöpp. Við felum okkur ekki á bak við eitthvað prjál því ilmirnir okkar tala sínu máli. Með því að hafa hlutina svona stílhreina og einfalda tryggjum við að hver einasta króna sem þú borgar fari beint í gæðin á ilmvatninu sjálfu.
                    </p>
                    <p>
                      <strong className="font-bold text-[#1c1b18]">Af hverju LxS Scents?</strong><br/>
                      • Heiðarlegt verð: Upplifðu 100% lúxus á broti af verðinu.<br/>
                      • Fyrsta flokks hráefni: Við notum nákvæmlega sömu gæða ilmolíur og þekktustu ilmvatns fyrirtækin til að tryggja djúpan og langvarandi ilm.<br/>
                      • Algjört gagnsæi: Við erum með allt uppi á borðum. Við segjum þér nákvæmlega hvaða ilmir veita okkur innblástur svo þú getir fundið þína uppáhalds lykt auðveldlega.<br/>
                      • Engar dýratilraunir: Við tökum siðferðið alvarlega. Ilmvötnin okkar eru aldrei prófuð á dýrum og við framleiðum þau með virðingu fyrir umhverfinu.
                    </p>
                    <p>
                      <strong className="font-bold text-[#1c1b18]">Ilmaðu af lúxus, eyddu af skynsemi</strong><br/>
                      Ilmurinn þinn segir þína sögu. Þú átt skilið að bera ilm sem þú elskar án þess að láta verðmiðann stjórna því hvernig þú vilt lykta. Skoðaðu úrvalið okkar af hágæða ilmum og finndu hversu vel skynsamlegur lúxus getur lyktað.
                    </p>
                  </>
                ) : (
                  <>
                    <p>
                      We believe that smelling extraordinary shouldn't require a designer budget. 
                      Born from a love of high-end perfumery and a frustration with industry markups, our mission is simple: to make the world's most iconic and beloved scents accessible to everyone.
                    </p>
                    <p>
                      For too long, the fragrance industry has relied on a "brand tax" - charging premium prices to cover the costs of celebrity endorsements, massive marketing campaigns, and elaborate packaging. 
                      We decided to strip all of that away and focus entirely on what actually matters: the juice inside the bottle.
                    </p>
                    <p>
                      <strong className="font-bold text-[#1c1b18]">The Art of the Perfect Match</strong><br/>
                      Creating a flawless alternative to a luxury fragrance is an exact science and a true art form.
                      We are master perfumers who reverse-engineer top-tier scents, sourcing the exact same high-quality botanicals, absolutes, and synthetic molecules used by designer houses. 
                      By focusing purely on the chemistry and harmony of the notes, we deliver fragrances that are indistinguishable from your high-end favorites, with the same impressive longevity and sillage.
                    </p>
                    <p>
                      <strong className="font-bold text-[#1c1b18]">Unapologetically Minimalist</strong><br/>
                      Our aesthetic is grounded in striking simplicity—picture clean, perfectly straight glass bottles resting on raw stone.
                      We do not hide behind flashy packaging because our formulas speak for themselves. By keeping our presentation minimalist and direct, we ensure that every dollar you spend goes directly into the quality of the perfume.
                    </p>
                    <p>
                      <strong className="font-bold text-[#1c1b18]">Why Choose Us?</strong><br/>
                      • No Markups: Experience 100% of the luxury for a fraction of the cost.<br/>
                      • Premium Ingredients: We use the same fine fragrance oils as the classic designer houses to ensure a complex, high-quality olfactory experience.<br/>
                      • Radical Transparency: No gatekeeping and no secrets. We tell you exactly what scent profiles inspire our creations so you can find your signature scent with ease.<br/>
                      • Cruelty-Free Practices: Ethical production is non-negotiable. Our fragrances are never tested on animals and are crafted with respect for the environment.
                    </p>
                    <p>
                      <strong className="font-bold text-[#1c1b18]">Smell Expensive, Spend Smart</strong><br/>
                      Your signature scent is an extension of your identity, and you deserve to wear what you love without compromise. Explore our collection of masterfully crafted alternatives and discover how smart luxury feels—and smells.
                    </p>
                  </>
                )}
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="mt-7 mb-10 flex flex-col justify-center items-center gap-4 w-full">
              <button 
                onClick={() => {
                  setIsAboutOpen(false);
                  setActiveView("boutique");
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className="cursor-pointer bg-gold-500 hover:bg-gold-600 text-white px-8 py-2.5 sm:px-12 sm:py-3.5 tracking-[0.25em] font-sans font-medium text-[8px] sm:text-[10px] uppercase rounded-xs transition-all duration-300 shadow-[0_4px_20px_rgba(178,144,59,0.2)] hover:shadow-[0_4px_25px_rgba(178,144,59,0.35)]"
              >
                {t.exploreCollection}
              </button>
              <img 
                src="https://i.postimg.cc/wMYnCZpf/LOGO-B2903B-removebg-preview.png" 
                alt="Brand Logo" 
                loading="lazy"
                decoding="async"
                width={240}
                height={128}
                className="h-32 object-contain opacity-80 cursor-pointer hover:opacity-100 transition-opacity" 
                referrerPolicy="no-referrer" 
                onClick={() => {
                  setIsAboutOpen(false);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
              />
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
