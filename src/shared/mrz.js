/* MRZ (Machine Readable Zone) reader for passports (TD3, 2 lines x 44) and ID cards
   (TD1, 3 lines x 30, e.g. the back of an Emirates ID). Pure parsing + ICAO 9303 check-digit
   validation - no OCR here. KX.ocrText() (below) does the actual image-to-text step, lazily. */
(function () {
  var KX = window.KX;
  KX.MRZ = {};

  /* ICAO alpha-3 country code -> the exact nationality strings used by KX_DATA.nationalities.
     Covers every country currently in that list; an unmapped code falls back to null (caller
     shows "Other" / lets the client pick manually rather than guessing). */
  var CODES = {
    DZA: 'Algeria', AGO: 'Angola', BEN: 'Benin', BWA: 'Botswana', BFA: 'Burkina Faso', BDI: 'Burundi',
    CMR: 'Cameroon', CPV: 'Cape Verde', CAF: 'Central African Republic', TCD: 'Chad', COM: 'Comoros',
    COG: 'Congo (Brazzaville)', COD: 'DR Congo', CIV: "Cote d'Ivoire", DJI: 'Djibouti', EGY: 'Egypt',
    GNQ: 'Equatorial Guinea', ERI: 'Eritrea', SWZ: 'Eswatini', ETH: 'Ethiopia', GAB: 'Gabon', GMB: 'Gambia',
    GHA: 'Ghana', GIN: 'Guinea', GNB: 'Guinea-Bissau', KEN: 'Kenya', LSO: 'Lesotho', LBR: 'Liberia',
    LBY: 'Libya', MDG: 'Madagascar', MWI: 'Malawi', MLI: 'Mali', MRT: 'Mauritania', MUS: 'Mauritius',
    MAR: 'Morocco', MOZ: 'Mozambique', NAM: 'Namibia', NER: 'Niger', NGA: 'Nigeria', RWA: 'Rwanda',
    STP: 'Sao Tome and Principe', SEN: 'Senegal', SYC: 'Seychelles', SLE: 'Sierra Leone', SOM: 'Somalia',
    ZAF: 'South Africa', SSD: 'South Sudan', SDN: 'Sudan', TZA: 'Tanzania', TGO: 'Togo', TUN: 'Tunisia',
    UGA: 'Uganda', ZMB: 'Zambia', ZWE: 'Zimbabwe',
    BGD: 'Bangladesh', IND: 'India', NPL: 'Nepal', PAK: 'Pakistan', LKA: 'Sri Lanka', PHL: 'Philippines',
    IDN: 'Indonesia', AFG: 'Afghanistan', MMR: 'Myanmar',
    ARE: 'United Arab Emirates', SAU: 'Saudi Arabia', QAT: 'Qatar', KWT: 'Kuwait', BHR: 'Bahrain', OMN: 'Oman',
    JOR: 'Jordan', LBN: 'Lebanon', SYR: 'Syria', IRQ: 'Iraq', YEM: 'Yemen', PSE: 'Palestine', TUR: 'Turkey', IRN: 'Iran'
  };
  KX.MRZ.countryName = function (code) { return CODES[String(code || '').toUpperCase()] || null; };

  function cval(ch) {
    if (ch >= '0' && ch <= '9') return ch.charCodeAt(0) - 48;
    if (ch >= 'A' && ch <= 'Z') return ch.charCodeAt(0) - 55; // A=10 ... Z=35
    return 0; // '<' and anything unexpected
  }
  function checkDigit(s) {
    var w = [7, 3, 1], sum = 0;
    for (var i = 0; i < s.length; i++) sum += cval(s[i]) * w[i % 3];
    return sum % 10;
  }
  function matchesCheck(field, checkCh) {
    if (!/^[0-9]$/.test(checkCh)) return false; // OCR noise or a non-digit where a digit must be
    return checkDigit(field) === +checkCh;
  }
  function names(field) {
    var parts = field.split('<<');
    var surname = (parts[0] || '').replace(/</g, ' ').trim();
    var given = (parts[1] || '').replace(/</g, ' ').trim();
    function cap(s) { return s.toLowerCase().replace(/\b[a-z]/g, function (c) { return c.toUpperCase(); }); }
    var full = [given, surname].filter(Boolean).map(cap).join(' ').replace(/\s+/g, ' ').trim();
    return { surname: cap(surname), given: cap(given), full: full };
  }
  /* yy: 2-digit year; isExpiry hints which century is more likely when ambiguous. */
  function fullYear(yy, isExpiry) {
    // Expiry dates on a document scanned today are always this century (no passport or ID expires
    // in the 1900s) - unlike DOB, there's no century ambiguity to resolve here.
    if (isExpiry) return 2000 + yy;
    var now = new Date().getFullYear() % 100;
    return (yy > now ? 1900 : 2000) + yy; // DOB: assume not yet born in the "future" 2-digit wrap
  }
  function isoDate(yymmdd, isExpiry) {
    if (!/^\d{6}$/.test(yymmdd)) return null;
    var yy = +yymmdd.slice(0, 2), mm = +yymmdd.slice(2, 4), dd = +yymmdd.slice(4, 6);
    if (mm < 1 || mm > 12 || dd < 1 || dd > 31) return null;
    var y = fullYear(yy, isExpiry);
    return y + '-' + ('0' + mm).slice(-2) + '-' + ('0' + dd).slice(-2);
  }

  function cleanLine(l, len) {
    l = String(l || '').toUpperCase().replace(/[^A-Z0-9<]/g, '');
    if (l.length < len) l = l + Array(len - l.length + 1).join('<');
    return l.slice(0, len);
  }

  function parseTD3(rawLines) {
    var l1 = cleanLine(rawLines[0], 44), l2 = cleanLine(rawLines[1], 44);
    var docType = l1.slice(0, 1), issuing = l1.slice(2, 5);
    var nm = names(l1.slice(5));
    var docNumber = l2.slice(0, 9).replace(/</g, '');
    var docNumberCheck = l2.slice(9, 10);
    var nationality = l2.slice(10, 13);
    var dobRaw = l2.slice(13, 19), dobCheck = l2.slice(19, 20);
    var sex = l2.slice(20, 21);
    var expRaw = l2.slice(21, 27), expCheck = l2.slice(27, 28);
    var checks = {
      docNumber: matchesCheck(l2.slice(0, 9), docNumberCheck),
      dob: matchesCheck(dobRaw, dobCheck),
      expiry: matchesCheck(expRaw, expCheck)
    };
    var passed = 0, total = 0;
    Object.keys(checks).forEach(function (k) { total++; if (checks[k]) passed++; });
    return {
      format: 'TD3', docType: docType,
      fullName: nm.full, surname: nm.surname, given: nm.given,
      countryCode: nationality, nationalityCode: nationality, issuingCountryCode: issuing,
      nationality: KX.MRZ.countryName(nationality),
      dob: isoDate(dobRaw, false), expiry: isoDate(expRaw, true), sex: sex === 'M' || sex === 'F' ? sex : null,
      docNumber: docNumber, checks: checks, confidence: total ? passed / total : 0
    };
  }

  function parseTD1(rawLines) {
    var l1 = cleanLine(rawLines[0], 30), l2 = cleanLine(rawLines[1], 30), l3 = cleanLine(rawLines[2], 30);
    var docType = l1.slice(0, 2), issuing = l1.slice(2, 5);
    var docNumber = l1.slice(5, 14).replace(/</g, '');
    var docNumberCheck = l1.slice(14, 15);
    var dobRaw = l2.slice(0, 6), dobCheck = l2.slice(6, 7);
    var sex = l2.slice(7, 8);
    var expRaw = l2.slice(8, 14), expCheck = l2.slice(14, 15);
    var nationality = l2.slice(15, 18);
    var nm = names(l3);
    var checks = {
      docNumber: matchesCheck(l1.slice(5, 14), docNumberCheck),
      dob: matchesCheck(dobRaw, dobCheck),
      expiry: matchesCheck(expRaw, expCheck)
    };
    var passed = 0, total = 0;
    Object.keys(checks).forEach(function (k) { total++; if (checks[k]) passed++; });
    return {
      format: 'TD1', docType: docType,
      fullName: nm.full, surname: nm.surname, given: nm.given,
      countryCode: nationality, nationalityCode: nationality, issuingCountryCode: issuing,
      nationality: KX.MRZ.countryName(nationality),
      dob: isoDate(dobRaw, false), expiry: isoDate(expRaw, true), sex: sex === 'M' || sex === 'F' ? sex : null,
      docNumber: docNumber, checks: checks, confidence: total ? passed / total : 0
    };
  }

  /* Takes raw OCR text (any junk/line breaks), finds the MRZ block itself, and parses it.
     Returns null if nothing MRZ-shaped was found. */
  KX.MRZ.parse = function (text) {
    var lines = String(text || '').split('\n').map(function (l) {
      return l.toUpperCase().replace(/[^A-Z0-9<]/g, '');
    }).filter(function (l) { return l.length >= 20; });
    // TD3: look for a line starting with P< (or any letter + '<') of ~44 chars, followed by a 44-char line
    for (var i = 0; i < lines.length - 1; i++) {
      if (/^[A-Z]</.test(lines[i]) && lines[i].length >= 40 && lines[i + 1].length >= 40) {
        return parseTD3([lines[i], lines[i + 1]]);
      }
    }
    // TD1: three lines around 30 chars each
    for (var j = 0; j < lines.length - 2; j++) {
      if (lines[j].length >= 25 && lines[j].length <= 32 && lines[j + 1].length >= 25 && lines[j + 1].length <= 32 && lines[j + 2].length >= 20) {
        return parseTD1([lines[j], lines[j + 1], lines[j + 2]]);
      }
    }
    return null;
  };
})();
