// Editorial content for the public site. General religious and travel
// information only — nothing here describes what a specific package includes.

export const HOLY_CITIES = [
  {
    slot: "makkah" as const,
    name: "Makkah al-Mukarramah",
    arabic: "مكة المكرمة",
    lead: "The birthplace of the Prophet Muhammad ﷺ and home of Masjid al-Haram.",
    body: "At the heart of Masjid al-Haram stands the Kaaba, the House of Allah and the qiblah toward which Muslims across the world turn in prayer. Here pilgrims perform Tawaf around the Kaaba and Sa'i between the hills of Safa and Marwah, and from here they set out for Mina, Arafah and Muzdalifah during the days of Hajj.",
    places: ["The Kaaba & Masjid al-Haram", "Safa and Marwah", "Zamzam", "Mina, Arafah & Muzdalifah"],
  },
  {
    slot: "madinah" as const,
    name: "Al-Madinah al-Munawwarah",
    arabic: "المدينة المنورة",
    lead: "The City of the Prophet ﷺ and home of Masjid an-Nabawi.",
    body: "Madinah welcomed the Prophet ﷺ after the Hijrah, and his mosque, Masjid an-Nabawi, beneath the Green Dome, is where he ﷺ rests. Visiting Madinah is not one of the rites of Hajj, but many pilgrims travel there before or after Hajj to pray in the Prophet's Mosque and send salutations upon him ﷺ.",
    places: ["Masjid an-Nabawi", "Ar-Rawdah ash-Sharifah", "Masjid Quba", "Mount Uhud"],
  },
];

export const HAJJ_DAYS = [
  {
    day: "8 Dhul Hijjah",
    name: "Yawm at-Tarwiyah",
    place: "Makkah → Mina",
    body: "Pilgrims enter (or remain in) ihram, make the intention for Hajj and travel to Mina, where they spend the day and night in prayer and remembrance.",
  },
  {
    day: "9 Dhul Hijjah",
    name: "Yawm 'Arafah",
    place: "Arafah → Muzdalifah",
    body: "The greatest day of Hajj. Pilgrims stand at Arafah from after midday until sunset in supplication — the standing (wuquf) is the essence of Hajj. After sunset they move to Muzdalifah to pray and rest under the open sky, and gather pebbles.",
  },
  {
    day: "10 Dhul Hijjah",
    name: "Yawm an-Nahr — Eid al-Adha",
    place: "Mina → Makkah",
    body: "Pilgrims stone Jamarat al-'Aqabah, offer the sacrifice (hady) where required, shave or trim their hair, and perform Tawaf al-Ifadah (with Sa'i where required).",
  },
  {
    day: "11–13 Dhul Hijjah",
    name: "Ayyam at-Tashreeq",
    place: "Mina",
    body: "Pilgrims stay in Mina and stone all three Jamarat each day. Those who wish may leave on the 12th after the stoning; others remain for the 13th.",
  },
  {
    day: "Before departing",
    name: "Tawaf al-Wada'",
    place: "Makkah",
    body: "The farewell Tawaf around the Kaaba, the last rite before pilgrims leave Makkah.",
  },
];

export const HAJJ_TYPES = [
  { name: "Tamattu'", body: "Umrah is performed first in the months of Hajj, the pilgrim leaves ihram, then enters ihram again for Hajj on the 8th. A sacrifice (hady) is required. This is the form most pilgrims travelling from abroad perform." },
  { name: "Qiran", body: "Umrah and Hajj are combined in a single ihram that is kept until the 10th of Dhul Hijjah. A sacrifice (hady) is required." },
  { name: "Ifrad", body: "Hajj alone, without Umrah, in a single ihram. No sacrifice is required." },
];

export const PREPARATION = [
  { title: "Your passport", body: "Make sure your international passport is valid well beyond your travel dates. Our team will confirm the current validity requirement when you book." },
  { title: "Health & vaccinations", body: "The Saudi authorities set health requirements for pilgrims, including vaccinations such as meningitis. Requirements change, so our team will confirm what applies for your season." },
  { title: "Learn the rites", body: "Study the steps of Hajj before you travel, so that each day is spent in worship rather than uncertainty. Our Hajj Guide is a good place to start." },
  { title: "Ihram & essentials", body: "Ihram garments (for men), modest clothing, comfortable footwear for long walks, any personal medication with prescriptions, and a small bag for Mina and Arafah." },
  { title: "Fitness for walking", body: "Hajj involves a lot of walking in heat and crowds. Building up your stamina in the months before travel makes a real difference." },
  { title: "Spiritual preparation", body: "Sincere repentance, settling debts and seeking forgiveness from others, and preparing your intention for a journey made purely for Allah." },
];

export const GENERAL_FAQS = [
  { q: "Do I need to create an account to book or pay?", a: "No. When you book, you receive a booking reference and a private link to your own booking and payment page. You can also find your booking any time with your reference and email address under “Make a Payment”." },
  { q: "Is my Hajj place secured as soon as I book?", a: "No. A booking is a request. Our team reviews it and confirms the package details and your total amount with you. Your place is secured only when we confirm your booking." },
  { q: "Can I pay in instalments?", a: "Yes. Once your booking has been approved, you can pay any amount, as many times as you like, until your balance is cleared. Your page shows the percentage paid and the balance remaining." },
  { q: "How do I pay?", a: "Online through Paystack (card, bank transfer or USSD) from your private booking page, or by the payment methods our team gives you. Every payment receives an official receipt." },
  { q: "Does the displayed price include everything?", a: "Not necessarily. Each package states what is and is not included once those details have been confirmed. Do not assume a price includes every tax, optional service, visa-related fee or other expense — ask us if anything is unclear." },
  { q: "Can families, groups and organisations book together?", a: "Yes. Individuals, families, group organisers and institutions are all welcome. Use the enquiry form to tell us about your group and we will advise on the options available." },
];
