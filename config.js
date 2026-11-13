/* KINETIX site settings. The only file you normally need to edit on GitHub. */
window.KX_CONFIG = {
  // Paste the Apps Script Web App URL (ends with /exec) between the quotes.
  SCRIPT_URL: "PASTE_WEB_APP_URL_HERE",

  contacts: {
    whatsappKE: "+254 758 587 881",   // WhatsApp only
    phoneAE: "+971 54 456 4191",       // calls and WhatsApp
    email: "maxmeely@pm.me"
  },

  // Prices in AED. rush = express surcharge for that service.
  services: [
    { k: "cv_standard", name: "Standard CV", price: 40, rush: 20, note: "Professionally written, 1-2 pages", cat: "cv" },
    { k: "cv_ats", name: "ATS & Technical CV", price: 50, rush: 20, note: "Keyword-optimised for screening systems", cat: "cv" },
    { k: "cv_express", name: "Express CV Guide", price: 40, rush: 20, note: "Quick-turn CV with application guidance", cat: "cv" },
    { k: "linkedin_basic", name: "LinkedIn Basic", price: 50, rush: 20, note: "Headline, About and experience", cat: "other" },
    { k: "linkedin_full", name: "LinkedIn Full", price: 100, rush: 20, note: "Full profile, skills and keyword strategy", cat: "other" },
    { k: "cert_single", name: "Single Certificate", price: 60, rush: 10, note: "Professional certificate layout", cat: "docs" },
    { k: "cert_batch", name: "Certificate Batch", price: 150, priceTo: 200, rush: 20, note: "Several certificates, one consistent style", cat: "docs" },
    { k: "doc_cleanup", name: "Offer Letter / Document Cleanup", price: 40, rush: 10, note: "Tidy, align and standardise a document", cat: "docs" },
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
    { k: "mpesa", name: "M-Pesa", lines: [["Number", "0758587881"]] },
    { k: "equity", name: "Equity Bank", lines: [["Paybill", "247247"], ["Account", "0758587881"]] },
    { k: "cash", name: "Cash", lines: [["Where", "Arrange on WhatsApp"]] },
    { k: "card", name: "Card", lines: [] },
    { k: "binance", name: "Binance", lines: [] }
  ]
};
