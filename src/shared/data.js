var KX_DATA = (function () {
  var africa = ["Algeria","Angola","Benin","Botswana","Burkina Faso","Burundi","Cameroon","Cape Verde","Central African Republic","Chad","Comoros","Congo (Brazzaville)","DR Congo","Cote d'Ivoire","Djibouti","Egypt","Equatorial Guinea","Eritrea","Eswatini","Ethiopia","Gabon","Gambia","Ghana","Guinea","Guinea-Bissau","Kenya","Lesotho","Liberia","Libya","Madagascar","Malawi","Mali","Mauritania","Mauritius","Morocco","Mozambique","Namibia","Niger","Nigeria","Rwanda","Sao Tome and Principe","Senegal","Seychelles","Sierra Leone","Somalia","South Africa","South Sudan","Sudan","Tanzania","Togo","Tunisia","Uganda","Zambia","Zimbabwe"];
  var asia = ["Bangladesh","India","Nepal","Pakistan","Sri Lanka","Philippines","Indonesia","Afghanistan","Myanmar"];
  var gcc = ["United Arab Emirates","Saudi Arabia","Qatar","Kuwait","Bahrain","Oman"];
  var other = ["Jordan","Lebanon","Syria","Iraq","Yemen","Palestine","Turkey","Iran","Other"];
  function uniq(a) { return a.filter(function (x, i) { return a.indexOf(x) === i; }); }
  var nationalities = uniq(africa.concat(asia, gcc, other)).sort();
  var locations = [
    { c: "United Arab Emirates", g: "UAE", cities: ["Abu Dhabi","Dubai","Sharjah","Ajman","Ras Al Khaimah","Fujairah","Umm Al Quwain","Al Ain","Mussafah","Musaffah ICAD","Ruwais","Jebel Ali","Khalifa Industrial Zone (KIZAD)","Ghantoot","Al Dhafra / Madinat Zayed","Habshan","Ruwais / Western Region","Offshore / Island sites"] },
    { c: "Saudi Arabia", g: "KSA", cities: ["Riyadh","Jeddah","Dammam","Al Khobar","Jubail","Yanbu","Mecca","Medina","NEOM / Tabuk","Other"] },
    { c: "Qatar", g: "QAT", cities: ["Doha","Al Wakrah","Al Khor","Ras Laffan","Mesaieed","Other"] },
    { c: "Kuwait", g: "KWT", cities: ["Kuwait City","Ahmadi","Hawally","Shuaiba","Other"] },
    { c: "Bahrain", g: "BHR", cities: ["Manama","Muharraq","Riffa","Sitra","Other"] },
    { c: "Oman", g: "OMN", cities: ["Muscat","Sohar","Salalah","Duqm","Nizwa","Other"] }
  ];
  return {
    nationalities: nationalities,
    gcc: gcc,
    locations: locations,
    homeRegions: ["East Africa","West Africa","Southern Africa","North Africa","Central Africa","South Asia","South-East Asia","Middle East","Other"],
    visa: [
      { k: "employment", l: "Employment visa (UAE)" },
      { k: "visit", l: "Visit / tourist visa" },
      { k: "cancelled", l: "Visa cancelled - in UAE (grace period)" },
      { k: "residence_family", l: "Family / dependent residence" },
      { k: "golden", l: "Golden visa / investor" },
      { k: "freelance", l: "Freelance / self-employed permit" },
      { k: "outside", l: "Outside the UAE - needs a visa" },
      { k: "demob", l: "Ready for demobilisation (immediate)" },
      { k: "noc", l: "NOC available from current employer" },
      { k: "gcc_resident", l: "Resident in another GCC country" }
    ],
    availability: [
      { k: "immediate", l: "Immediate" },
      { k: "1w", l: "Within 1 week" },
      { k: "2w", l: "Within 2 weeks" },
      { k: "1m", l: "1 month notice" },
      { k: "2m", l: "2 months notice" },
      { k: "3m", l: "3 months notice" }
    ],
    education: [
      { k: "none", l: "No formal schooling listed", r: 0 },
      { k: "primary", l: "Primary school", r: 1 },
      { k: "secondary", l: "Secondary / High school certificate", r: 2 },
      { k: "vocational", l: "Vocational / Trade certificate", r: 3 },
      { k: "diploma", l: "Diploma", r: 4 },
      { k: "higher_diploma", l: "Higher national diploma", r: 5 },
      { k: "bachelor", l: "Bachelor's degree", r: 6 },
      { k: "postgrad", l: "Postgraduate diploma", r: 7 },
      { k: "master", l: "Master's degree", r: 8 },
      { k: "phd", l: "Doctorate (PhD)", r: 9 }
    ],
    languages: ["English","Arabic","Hindi","Urdu","Swahili","French","Amharic","Hausa","Yoruba","Igbo","Luganda","Somali","Tagalog","Bengali","Nepali","Tamil","Malayalam","Portuguese","Shona","Zulu","Other"],
    langLevels: ["Native","Fluent","Good","Basic"],
    licenceCountries: ["UAE","Home country only","None"],
    marital: ["Single","Married","Divorced","Widowed"],
    styles: [
      { k: "ats_classic", l: "Classic ATS", ats: true, d: "Single column, plain headings. Passes recruitment software." },
      { k: "ats_compact", l: "Compact ATS", ats: true, d: "Tighter spacing to fit a long history on two pages." },
      { k: "exec_navy", l: "Executive", ats: false, d: "Navy header band, clean sections. Corporate and office roles." },
      { k: "side_navy", l: "Modern sidebar", ats: false, d: "Dark sidebar with contact, skills and languages." },
      { k: "side_teal", l: "Fresh sidebar", ats: false, d: "Light sidebar with a teal accent." },
      { k: "site_bold", l: "Site-ready", ats: false, d: "Bold charcoal and amber. Trades, oil and gas, site work." }
    ],
    certKinds: ["Safety","Technical / Trade","Professional","Medical","Driving / Equipment","Academic","Other"]
  };
})();
