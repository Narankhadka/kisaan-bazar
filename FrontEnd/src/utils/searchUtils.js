// Romanized Nepali / English → Nepali Unicode crop names
export const TRANSLITERATION = {
  // Potato / आलु
  'aalu': 'आलु', 'alu': 'आलु', 'potato': 'आलु',
  // Tomato / टमाटर
  'tamatar': 'टमाटर', 'tomato': 'टमाटर',
  // Onion / प्याज
  'pyaj': 'प्याज', 'pyaz': 'प्याज', 'onion': 'प्याज',
  // Cauliflower / काउली
  'kauli': 'काउली', 'cauliflower': 'काउली', 'gobi': 'काउली',
  // Broccoli / ब्रोकाउली
  'brokali': 'ब्रोकाउली', 'broccoli': 'ब्रोकाउली',
  // Bitter gourd / करेला
  'karela': 'करेला', 'bitter gourd': 'करेला', 'bitter': 'करेला',
  // Bottle gourd / लौका
  'lauka': 'लौका', 'bottle gourd': 'लौका',
  // Cucumber / काक्रो
  'kakro': 'काक्रो', 'cucumber': 'काक्रो',
  // Cabbage / बन्दा
  'banda': 'बन्दा', 'cabbage': 'बन्दा',
  // Carrot / गाजर
  'gajar': 'गाजर', 'carrot': 'गाजर',
  // Radish / मूला
  'mula': 'मूला', 'radish': 'मूला',
  // Beans / बोडी
  'bodi': 'बोडी', 'beans': 'बोडी',
  // Peas / केराउ
  'kerau': 'केराउ', 'peas': 'केराउ',
  // Mushroom / च्याउ
  'chyau': 'च्याउ', 'ch yau': 'च्याउ', 'mushroom': 'च्याउ',
  // Chilli / खुर्सानी
  'khursani': 'खुर्सानी', 'chilli': 'खुर्सानी', 'chili': 'खुर्सानी',
  // Ginger / अदुवा
  'adhuwa': 'अदुवा', 'adua': 'अदुवा', 'ginger': 'अदुवा',
  // Garlic / लसुन
  'lasun': 'लसुन', 'garlic': 'लसुन',
  // Spring onion / हरियो प्याज
  'hariyo pyaj': 'हरियो प्याज', 'spring onion': 'हरियो प्याज',
  // French beans / सिमी
  'simi': 'सिमी', 'french beans': 'सिमी',
  // Eggplant / भन्टा
  'bhanta': 'भन्टा', 'eggplant': 'भन्टा', 'brinjal': 'भन्टा',
  // Mustard leaves / रायो
  'rayo': 'रायो', 'mustard': 'रायो',
  // Spinach / पालुंगो
  'palungo': 'पालुंगो', 'spinach': 'पालुंगो',
  // Banana / केरा
  'kera': 'केरा', 'banana': 'केरा',
  // Apple / स्याउ
  'syau': 'स्याउ', 'apple': 'स्याउ',
  // Orange / सुन्तला
  'suntala': 'सुन्तला', 'orange': 'सुन्तला',
  // Papaya / मेवा
  'mewa': 'मेवा', 'papaya': 'मेवा',
  // Mango / आँप
  'aanp': 'आँप', 'aamp': 'आँप', 'mango': 'आँप',
  // Kiwi / किवी
  'kiwi': 'किवी',
  // Grape / अंगुर
  'angur': 'अंगुर', 'grape': 'अंगुर', 'grapes': 'अंगुर',
};

/**
 * Returns true if a price entry matches the search query.
 * Checks: Nepali name, English name, and transliteration keys.
 */
export function matchesCrop(price, query) {
  if (!query || !query.trim()) return true;
  const q = query.trim().toLowerCase();

  const nepaliName  = (price.crop?.name_nepali  || '').toLowerCase();
  const englishName = (price.crop?.name_english || '').toLowerCase();

  // Direct match on Nepali or English
  if (nepaliName.includes(q) || englishName.includes(q)) return true;

  // Transliteration: any key that starts with (or equals) the query
  // maps to a Nepali word that matches this crop
  for (const [eng, nep] of Object.entries(TRANSLITERATION)) {
    if (eng.startsWith(q) || eng === q) {
      if (nepaliName.includes(nep.toLowerCase())) return true;
    }
  }

  return false;
}

/**
 * If the query exactly matches a romanized key (e.g. "potato", "aalu"),
 * return its Nepali equivalent ("आलु"). Otherwise return the original query
 * so Nepali text passes straight through to the API.
 */
export function translateToNepali(query) {
  if (!query) return '';
  const q = query.trim().toLowerCase();
  return TRANSLITERATION[q] || query.trim();
}

/** Converts an Arabic-numeral number to Nepali Devanagari numerals. */
export function toNepaliNum(n) {
  const digits = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'];
  return String(n).replace(/\d/g, d => digits[+d]);
}

/** Strip HTML tags from user-supplied text to prevent XSS injection. */
export function stripHtml(str) {
  return String(str).replace(/<[^>]*>/g, '');
}
