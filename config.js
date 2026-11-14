/* KINETIX site settings. The only file you normally need to edit on GitHub. */
window.KX_CONFIG = {
  // Paste the Apps Script Web App URL (ends with /exec) between the quotes.
  SCRIPT_URL: "https://script.google.com/macros/s/AKfycbwkpBLLJGhVbKW-y7fhAND6oSdUb0HcbxNZBOaWVdpNltdFGE78ULDgjuoJ-hoYR9-Hqg/exec",

  contacts: {
    whatsappKE: "+254 758 587 881",   // WhatsApp only (never shown on the site, only used by the WhatsApp buttons)
    phoneAE: "+971 54 456 4191",       // calls and WhatsApp (never shown on the site)
    email: "maxmeely@pm.me"            // shown with a Proton Mail icon
  },

  // Prices in AED. Visitors can switch currency on the site (see "currencies" below).
  services: [
    { k: "cv_standard", name: "Standard CV", price: 40, note: "Professionally written, 1-2 pages", icon: "file", cat: "cv" },
    { k: "cv_ats", name: "ATS & Technical CV", price: 50, note: "Keyword-optimised for screening systems", icon: "shield", cat: "cv" },
    { k: "cv_express", name: "Express CV Guide", price: 40, note: "Quick-turn CV with application guidance", icon: "zap", cat: "cv" },
    { k: "linkedin_basic", name: "LinkedIn Basic", price: 50, note: "Headline, About and experience", icon: "in", cat: "other" },
    { k: "linkedin_full", name: "LinkedIn Full", price: 100, note: "Full profile, skills and keyword strategy", icon: "in", cat: "other" },
    { k: "cert_single", name: "Single Certificate", price: 60, note: "Professional certificate layout", icon: "award", cat: "docs" },
    { k: "cert_batch", name: "Certificate Batch", price: 150, priceTo: 200, note: "Several certificates, one consistent style", icon: "award", cat: "docs" },
    { k: "doc_cleanup", name: "Offer Letter / Document Cleanup", price: 40, note: "Tidy, align and standardise a document", icon: "edit", cat: "docs" },
    { k: "pkg_site", name: "Site Job Package", price: 90, rush: 30, note: "CV, cover letter and certificate arrangement", includes: ["cover"], cat: "bundle" },
    { k: "pkg_career", name: "Full Career Package", price: 160, rush: 30, note: "CV, cover letter, LinkedIn and certificate pack", includes: ["cover", "linkedin"], cat: "bundle" }
  ],
  legal: { licence: "" },   // add your trade licence number here to show it on the Legal Notice page

  blog: [
    { title: "What a Gulf employer looks for in a CV", date: "13 Nov 2026", body: [
      "Recruiters in the UAE often scan a CV in under a minute. Put your name, target role, phone, email and current location at the top, then a short professional summary.",
      "Show your nationality, visa status and availability clearly. Employers in the GCC need to know whether you can start immediately or need a visa.",
      "List your most recent job first, with your duties as short bullet points. Keep certificates such as safety, welding or driving licences easy to find." ] },
    { title: "What is an ATS and why it matters", date: "13 Nov 2026", body: [
      "An ATS (applicant tracking system) is software many companies use to read and sort CVs before a person sees them.",
      "These systems read plain layouts best. Avoid text boxes, photos and complicated columns when applying online, and use clear headings such as Experience and Education.",
      "Use the words from the job advert where they are true for you, for example the job title and the main skills." ] },
    { title: "Documents to prepare before you apply", date: "13 Nov 2026", body: [
      "Keep a clear scan of your passport, certificates, licences and reference letters, and a recent passport-style photo.",
      "Write down your work history with employer names, locations and dates. Gaps are easier to explain when the dates are accurate.",
      "Send these to us with your order and we will arrange them in the order you choose." ] }
  ],

  coverLetter: { name: "Matching cover letter", price: 0 },   // set a price here if you want to charge for it
  extraRevision: 15,

  // Payment methods. Leave details empty to show "Ask on WhatsApp".
  payments: [
    { k: "mpesa", name: "M-Pesa", icon: "phone", lines: [["Number", "0758587881", true]] },
    { k: "equity", name: "Equity Bank", icon: "bank", lines: [["Paybill", "247247", true], ["Account", "0758587881", true]] },
    { k: "cash", name: "Cash", icon: "cash", lines: [["Where", "Arrange on WhatsApp"]] },
    { k: "card", name: "Card", icon: "card", lines: [] },
    { k: "binance", name: "Binance Pay", icon: "coin", logo: "binance-logo.png", qr: "binance-pay.png", lines: [["Binance Pay name", "MaxMeely", true]] }
  ],

  // Currency switcher. rate = how much of that currency 1 AED is worth. These are fallback rates;
  // the site refreshes them from a free live-rates service when the visitor is online.
  // step rounds the shown price to a tidy number. Prices are always charged in AED (or the equivalent we confirm on WhatsApp).
  currencies: [
    { c: "AED", s: "AED ", rate: 1, dp: 0, step: 1 },
    { c: "USD", s: "US$", rate: 0.2723, dp: 2, step: 0.5 },
    { c: "KES", s: "KSh ", rate: 35.2, dp: 0, step: 10 },
    { c: "EUR", s: "\u20ac", rate: 0.252, dp: 2, step: 0.5 },
    { c: "GBP", s: "\u00a3", rate: 0.214, dp: 2, step: 0.5 },
    { c: "SAR", s: "SAR ", rate: 1.021, dp: 0, step: 1 },
    { c: "QAR", s: "QAR ", rate: 0.991, dp: 0, step: 1 },
    { c: "KWD", s: "KWD ", rate: 0.0836, dp: 2, step: 0.05 },
    { c: "OMR", s: "OMR ", rate: 0.1047, dp: 2, step: 0.05 },
    { c: "BHD", s: "BHD ", rate: 0.1024, dp: 2, step: 0.05 },
    { c: "INR", s: "\u20b9", rate: 23.8, dp: 0, step: 5 },
    { c: "PKR", s: "PKR ", rate: 76, dp: 0, step: 10 },
    { c: "PHP", s: "\u20b1", rate: 15.5, dp: 0, step: 5 },
    { c: "NPR", s: "NPR ", rate: 36.8, dp: 0, step: 5 },
    { c: "BDT", s: "BDT ", rate: 32.7, dp: 0, step: 5 },
    { c: "LKR", s: "LKR ", rate: 82, dp: 0, step: 10 },
    { c: "EGP", s: "EGP ", rate: 13.6, dp: 0, step: 5 },
    { c: "UGX", s: "UGX ", rate: 994, dp: 0, step: 100 },
    { c: "TZS", s: "TZS ", rate: 708, dp: 0, step: 100 },
    { c: "NGN", s: "\u20a6", rate: 422, dp: 0, step: 100 },
    { c: "ZAR", s: "ZAR ", rate: 4.9, dp: 0, step: 1 },
    { c: "CAD", s: "CA$", rate: 0.373, dp: 2, step: 0.5 },
    { c: "AUD", s: "A$", rate: 0.408, dp: 2, step: 0.5 }
  ]
};
