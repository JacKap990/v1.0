/**
 * Smart Logic Engine (Next.js Port)
 * Handles "AI" features: Expiry prediction, Auto-restock, Recipe suggestions.
 */

/**
 * Predict Expiry based on product name heuristics.
 * Ported from legacy smartEngine.js
 */
export function calculateSmartExpiry(productName: string, baseProductName?: string | null): Date {
    const nameToMatch = (baseProductName || productName).toLowerCase();
    const today = new Date();

    let daysToAdd = 14; // Default two weeks

    if (nameToMatch.includes('חלב') || nameToMatch.includes('milk')) {
        daysToAdd = 7;
    } else if (nameToMatch.includes('קוטג') || nameToMatch.includes('cottage')) {
        daysToAdd = 5;
    } else if (nameToMatch.includes('לחם') || nameToMatch.includes('bread') || nameToMatch.includes('פיתות') || nameToMatch.includes('לחמניות')) {
        daysToAdd = 5;
    } else if (nameToMatch.includes('בשר') || nameToMatch.includes('meat') || nameToMatch.includes('עוף') || nameToMatch.includes('דג')) {
        daysToAdd = 4;
    } else if (nameToMatch.includes('גבינה') || nameToMatch.includes('cheese') || nameToMatch.includes('שמנת') || nameToMatch.includes('יוגורט')) {
        daysToAdd = 10;
    } else if (nameToMatch.includes('ביצים') || nameToMatch.includes('ביצה')) {
        daysToAdd = 21;
    } else if (nameToMatch.includes('עגבניות') || nameToMatch.includes('מלפפונים') || nameToMatch.includes('פלפל') || nameToMatch.includes('חסה')) {
        daysToAdd = 6;
    } else if (nameToMatch.includes('אורז') || nameToMatch.includes('rice') || nameToMatch.includes('פסטה') || nameToMatch.includes('פתיתים')) {
        daysToAdd = 180;
    } else if (nameToMatch.includes('קפה') || nameToMatch.includes('coffee') || nameToMatch.includes('תה')) {
        daysToAdd = 90;
    } else if (nameToMatch.includes('שימורים') || nameToMatch.includes('טונה') || nameToMatch.includes('תירס')) {
        daysToAdd = 365;
    } else if (nameToMatch.includes('קפוא') || nameToMatch.includes('גלידה')) {
        daysToAdd = 180;
    } else if (nameToMatch.includes('רטבים') || nameToMatch.includes('סויה') || nameToMatch.includes('קטשופ') || nameToMatch.includes('מיונז') || nameToMatch.includes('חרדל') || nameToMatch.includes('טריאקי') || nameToMatch.includes('צ\'ילי')) {
        daysToAdd = 180;
    } else if (nameToMatch.includes('טחינה') || nameToMatch.includes('tahini')) {
        daysToAdd = 180;
    } else if (nameToMatch.includes('סלטים') || nameToMatch.includes('חומוס') || nameToMatch.includes('חצילים') || nameToMatch.includes('כרוב') || nameToMatch.includes('סחוג') || nameToMatch.includes('מטבוחה')) {
        daysToAdd = 21;
    } else if (nameToMatch.includes('טיפוח') || nameToMatch.includes('שמפו') || nameToMatch.includes('סבון') || nameToMatch.includes('משחת שיניים') || nameToMatch.includes('דאודורנט') || nameToMatch.includes('מרכך') || nameToMatch.includes('נוזל כלים')) {
        daysToAdd = 700;
    } else if (nameToMatch.includes('שתייה קלה') || nameToMatch.includes('קולה') || nameToMatch.includes('מיץ') || nameToMatch.includes('מים')) {
        daysToAdd = 180;
    }

    const target = new Date(today);
    target.setDate(today.getDate() + daysToAdd);

    return target;
}

/**
 * Robust Hebrew Stemmer for ingredient matching
 */
export function normalizeHebrew(term: string): string {
    if (!term) return '';
    let s = term.trim();
    if (s.length < 3) return s;

    s = s.replace(/יי/g, 'י');
    s = s.replace(/וו/g, 'ו');

    s = s.replace(/ך/g, 'כ')
        .replace(/ם/g, 'מ')
        .replace(/ן/g, 'נ')
        .replace(/ף/g, 'פ')
        .replace(/ץ/g, 'צ');

    if (s.endsWith('ים') || s.endsWith('ימ')) {
        s = s.slice(0, -2);
    } else if (s.endsWith('ות')) {
        s = s.slice(0, -2);
    } else if (s.endsWith('ה')) {
        s = s.slice(0, -1);
    }

    return s;
}

export const ingredientTaxonomy: Record<string, string[]> = {
    'עשבי תיבול': ['פטרוזיליה', 'כוסברה', 'שמיר', 'בזיליקום', 'נענע', 'אורגנו', 'תימין', 'רוזמרין', 'עירית', 'סלרי', 'עלי דפנה', 'מרווה'],
    'גבינה קשה': ['פרמזן', 'גבינה צהובה', 'צ\'דר', 'מוצרלה', 'עמק', 'גלבוע', 'גבינת עיזים קשה'],
    'גבינה לבנה': ['גבינה לבנה', 'קוטג\'', 'סקי', 'סימפוניה', 'ריקוטה', 'שמנת', 'גבינת שמנת'],
    'שמן לטיגון': ['שמן קנולה', 'שמן חמניות', 'שמן סויה', 'שמן תירס', 'שמן צמחי'],
    'שמן': ['שמן זית', 'שמן קנולה', 'שמן חמניות', 'שמן סויה', 'שמן תירס', 'שמן קוקוס', 'שמן שומשום'],
    'בשר טחון': ['בשר בקר טחון', 'עוף טחון', 'הודו טחון', 'בשר טחון צמחי'],
    'עוף': ['חזה עוף', 'כרעיים', 'שוקיים', 'כנפיים', 'פרגיות', 'עוף שלם'],
    'פחמימה': ['אורז', 'פסטה', 'פתיתים', 'קוסקוס', 'תפוחי אדמה', 'קינואה', 'בורגול', 'כוסמת'],
    'ירקות שורש': ['גזר', 'תפוח אדמה', 'בטטה', 'סלק', 'לפת', 'קולורבי', 'שורש פטרוזיליה', 'שורש סלרי'],
    'אגוזים': ['אגוזי מלך', 'שקדים', 'בוטנים', 'קשיו', 'פקאן', 'צנוברים', 'אגוזי לוז'],
    'לחם': ['לחם אחיד', 'לחם מלא', 'חלה', 'פיתות', 'לחמניות', 'בגט', 'לחם כוסמין'],
    'תחליפי חלב (פרווה/טבעוני)': ['חלב סויה', 'חלב שיבולת שועל', 'חלב שקדים', 'חלב אורז', 'חלב קוקוס', 'שמנת סויה'],
    'תחליפי בשר (פרווה/טבעוני)': ['טופו', 'סייטן', 'פתיתי סויה', 'שבבי סויה', 'המבורגר טבעוני', 'נקניקיות צמחיות'],
    'תחליפי גבינה (פרווה/טבעוני)': ['גבינת סויה', 'גבינת קשיו', 'טופו במרקם קשה', 'צהובה טבעונית'],
    'תחליפי ביצה (טבעוני)': ['רסק תפוחי עץ', 'פשתן טחון', 'רסק בננה', 'טחינה', 'אקוופאבה']
};

/**
 * Smart Check if Inventory Item matches Requirement
 * Uses Taxonomy + Fuzzy matching
 */
export function isIngredientMatch(reqName: string, invName: string): boolean {
    const nReq = normalizeHebrew(reqName);
    const nInv = normalizeHebrew(invName);

    // Direct Match / Stem Match
    if (nInv.includes(nReq) || nReq.includes(nInv)) return true;

    // Taxonomy Match
    if (ingredientTaxonomy[reqName]) {
        return ingredientTaxonomy[reqName].some(child => {
            const nChild = normalizeHebrew(child);
            return nInv.includes(nChild) || nChild.includes(nInv);
        });
    }

    return false;
}
