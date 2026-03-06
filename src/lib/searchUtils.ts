/**
 * Hebrew to English keyboard layout mapping
 */
const HE_TO_EN: Record<string, string> = {
    'ק': 'e', 'ר': 'r', 'א': 't', 'ט': 'y', 'ו': 'u', 'ן': 'i', 'ם': 'o', 'פ': 'p',
    'ש': 'a', 'ד': 's', 'ג': 'd', 'כ': 'f', 'ע': 'g', 'י': 'h', 'ח': 'j', 'ל': 'k', 'ך': 'l', 'ף': ';',
    'ז': 'z', 'ס': 'x', 'ב': 'c', 'ה': 'v', 'נ': 'b', 'מ': 'n', 'צ': 'm', 'ת': ',', 'ץ': '.', '.': '/',
};

/**
 * English to Hebrew keyboard layout mapping (when user forgot to switch)
 */
const EN_TO_HE: Record<string, string> = {
    'q': '/', 'w': '\'', 'e': 'ק', 'r': 'ר', 't': 'א', 'y': 'ט', 'u': 'ו', 'i': 'ן', 'o': 'ם', 'p': 'פ',
    'a': 'ש', 's': 'ד', 'd': 'ג', 'f': 'כ', 'g': 'ע', 'h': 'י', 'j': 'ח', 'k': 'ל', 'l': 'ך', ';': 'ף',
    'z': 'ז', 'x': 'ס', 'c': 'ב', 'v': 'ה', 'b': 'נ', 'n': 'מ', 'm': 'צ', ',': 'ת', '.': 'ץ', '/': '.',
};

/**
 * Common translation map for smart search (Hebrew -> English and vice-versa)
 */
/**
 * Common translation map for smart search (Hebrew -> English and vice-versa)
 */
const TRANSLATIONS: Record<string, string[]> = {
    'חלב': ['milk', 'milk', 'jkc'],
    'שניצל': ['schnizel', 'shnitzel', 'schnitzel', 'abhmk'],
    'עגבניה': ['tomato', 'tomatoe', 'uacuhe'],
    'מלפפון': ['cucumber', 'vkgpui'],
    'לחם': ['bread', 'kho'],
    'גבינה': ['cheese', 'ubhmv'],
    'מים': ['water', 'nhl'],
    'ביצים': ['eggs', 'chhun'],
    'סוכר': ['sugar', 'sucar', 'sucr', 'סוכר'],
    'מלח': ['salt', 'nhl'],
    'שמן': ['oil', 'anu'],
    'אורז': ['rice', 'aurz'],
    'פסטה': ['pasta', 'pstav'],
    'פסק זמן': ['pesek zman', 'pesek', 'zman', 'pkv fnu'],
};

/**
 * Translates a string from one keyboard layout to another
 */
function translateLayout(str: string, map: Record<string, string>): string {
    return str.split('').map(char => map[char.toLowerCase()] || char).join('');
}

/**
 * Smart search utility: returns a relevance score (0 means no match)
 */
export function smartSearchScore(searchTerm: string, itemName: string): number {
    if (!searchTerm) return 1;

    const loweredSearch = searchTerm.toLowerCase().trim();
    const loweredItem = itemName.toLowerCase().trim();

    // 1. Exact match - Absolute highest
    if (loweredItem === loweredSearch) return 1000;

    // 2. Exact match in word sequence (e.g. "פסק זמן" in "חטיף פסק זמן קלאסי")
    if (loweredItem.includes(loweredSearch)) {
        // Higher score if it starts the string
        if (loweredItem.startsWith(loweredSearch)) return 800;
        // High score if it's a standalone word
        const words = loweredItem.split(/\s+/);
        if (words.includes(loweredSearch)) return 700;
        return 500;
    }

    // 3. Keyboard layout correction (EN typed instead of HE)
    const fixedLayout = translateLayout(loweredSearch, EN_TO_HE);
    if (loweredItem === fixedLayout) return 900;
    if (loweredItem.startsWith(fixedLayout)) return 750;
    if (loweredItem.includes(fixedLayout)) return 450;

    // 4. Translation match (e.g. searching "milk" matches "חלב")
    for (const [he, enList] of Object.entries(TRANSLATIONS)) {
        if (loweredItem.includes(he)) {
            // If the search term is explicitly in our translation list for this item
            if (enList.some(en => en === loweredSearch)) return 850;
            if (enList.some(en => en.includes(loweredSearch))) return 400;
        }
    }

    // 5. Layout correction of translations? (e.g. user typed layout-swapped english of a translation)
    // Handled by adding layout-swapped versions to TRANSLATIONS map for critical items like 'jkc' and 'abhmk'

    return 0;
}

/**
 * Backward compatibility: returns true if score > 0
 */
export function smartSearch(searchTerm: string, itemName: string): boolean {
    return smartSearchScore(searchTerm, itemName) > 0;
}
