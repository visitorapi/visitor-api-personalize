// Best-effort ISO-3166-1 alpha-2 country code -> continent code table.
// Continent codes follow the common GeoNames convention:
// AF=Africa, AN=Antarctica, AS=Asia, EU=Europe, NA=North America,
// OC=Oceania, SA=South America.
//
// Covers sovereign states plus common dependent territories. Not
// exhaustive for every obscure territory -- fix forward as gaps are
// found rather than treating this as authoritative.

const COUNTRIES_BY_CONTINENT = {
  AF: [
    "DZ", "AO", "BJ", "BW", "BF", "BI", "CV", "CM", "CF", "TD", "KM", "CG",
    "CD", "CI", "DJ", "EG", "GQ", "ER", "SZ", "ET", "GA", "GM", "GH", "GN",
    "GW", "KE", "LS", "LR", "LY", "MG", "MW", "ML", "MR", "MU", "YT", "MA",
    "MZ", "NA", "NE", "NG", "RE", "RW", "SH", "ST", "SN", "SC", "SL", "SO",
    "ZA", "SS", "SD", "TZ", "TG", "TN", "UG", "EH", "ZM", "ZW",
  ],
  AN: ["AQ", "BV", "TF", "GS", "HM"],
  AS: [
    "AF", "AM", "AZ", "BH", "BD", "BT", "BN", "KH", "CN", "CY", "GE", "HK",
    "IN", "ID", "IR", "IQ", "IL", "JP", "JO", "KZ", "KP", "KR", "KW", "KG",
    "LA", "LB", "MO", "MY", "MV", "MN", "MM", "NP", "OM", "PK", "PS", "PH",
    "QA", "SA", "SG", "LK", "SY", "TW", "TJ", "TH", "TL", "TR", "TM", "AE",
    "UZ", "VN", "YE",
  ],
  EU: [
    "AL", "AD", "AT", "BY", "BE", "BA", "BG", "HR", "CZ", "DK", "EE", "FO",
    "FI", "FR", "DE", "GI", "GR", "GG", "VA", "HU", "IS", "IE", "IM", "IT",
    "JE", "XK", "LV", "LI", "LT", "LU", "MT", "MD", "MC", "ME", "NL", "MK",
    "NO", "PL", "PT", "RO", "RU", "SM", "RS", "SK", "SI", "ES", "SJ", "SE",
    "CH", "UA", "GB", "AX",
  ],
  NA: [
    "AI", "AG", "AW", "BS", "BB", "BZ", "BM", "VG", "CA", "KY", "CR", "CU",
    "CW", "DM", "DO", "SV", "GL", "GD", "GP", "GT", "HT", "HN", "JM", "MQ",
    "MX", "MS", "NI", "PA", "PR", "BL", "KN", "LC", "MF", "PM", "VC", "SX",
    "TT", "TC", "US", "VI",
  ],
  OC: [
    "AS", "AU", "CK", "FJ", "PF", "GU", "KI", "MH", "FM", "NR", "NC", "NZ",
    "NU", "NF", "MP", "PW", "PG", "PN", "WS", "SB", "TK", "TO", "TV", "VU",
    "WF",
  ],
  SA: ["AR", "BO", "BR", "CL", "CO", "EC", "FK", "GF", "GY", "PY", "PE", "SR", "UY", "VE"],
};

const CONTINENT_BY_COUNTRY = {};
for (const [continent, countries] of Object.entries(COUNTRIES_BY_CONTINENT)) {
  for (const country of countries) {
    CONTINENT_BY_COUNTRY[country] = continent;
  }
}

module.exports = { CONTINENT_BY_COUNTRY };
