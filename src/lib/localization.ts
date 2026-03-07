/**
 * Category translation map (English key -> Hebrew display)
 */
export const CATEGORY_MAP: Record<string, string> = {
    'Dairy': 'מוצרי חלב',
    'dairy': 'מוצרי חלב',
    'Vegetables': 'ירקות',
    'vegetables': 'ירקות',
    'Fruits': 'פירות',
    'fruits': 'פירות',
    'Meat': 'בשר ודגים',
    'meat': 'בשר ודגים',
    'Bakery': 'מאפים ולחם',
    'bakery': 'מאפים ולחם',
    'Pantry': 'מזווה',
    'pantry': 'מזווה',
    'Frozen': 'קפואים',
    'frozen': 'קפואים',
    'Beverages': 'משקאות',
    'beverages': 'משקאות',
    'Snacks': 'חטיפים ומתוקים',
    'snacks': 'חטיפים ומתוקים',
    'Cleaning': 'ניקוי וטיפוח',
    'cleaning': 'ניקוי וטיפוח',
    'General': 'כללי',
    'general': 'כללי',
    'Other': 'אחר',
    'other': 'אחר',
    'Eggs': 'ביצים',
    'eggs': 'ביצים',
    'Canned': 'שימורים',
    'canned': 'שימורים',
    'Spices': 'תבלינים',
    'spices': 'תבלינים',
    'Pasta': 'פסטה ופתיתים',
    'pasta': 'פסטה ופתיתים',
    'Grains': 'דגנים וקטניות',
    'grains': 'דגנים וקטניות',
    'Condiments': 'רטבים וממרחים',
    'condiments': 'רטבים וממרחים',
    'Toiletries': 'טיפוח ופארם',
    'toiletries': 'טיפוח ופארם',
    'Baby': 'מוצרי תינוקות',
    'baby': 'מוצרי תינוקות',
    'Pet': 'מוצרים לחיות',
    'pet': 'מוצרים לחיות',
    'Household': 'בית וגן',
    'household': 'בית וגן',
};

/**
 * Get Hebrew display name for a category
 */
export function getCategoryLabel(cat: string | null | undefined): string {
    if (!cat) return CATEGORY_MAP['General'];
    const query = cat.trim();
    const lowerQuery = query.toLowerCase();

    // 1. Try exact value match (already Hebrew/English mapped value)
    const valueMatch = Object.values(CATEGORY_MAP).find(v => v === query);
    if (valueMatch) return valueMatch;

    // 2. Try case-insensitive key match
    const entryByKey = Object.entries(CATEGORY_MAP).find(([key]) => key.toLowerCase() === lowerQuery);
    if (entryByKey) return entryByKey[1];

    // 3. Try case-insensitive value match
    const entryByVal = Object.entries(CATEGORY_MAP).find(([_, val]) => val.toLowerCase() === lowerQuery);
    if (entryByVal) return entryByVal[1];

    // 4. Default to raw value (or General if empty)
    return query || CATEGORY_MAP['General'];
}

/**
 * Get English key for a Hebrew category name (useful for DB storage)
 */
export function getCategoryKey(hebrewLabel: string): string {
    const entry = Object.entries(CATEGORY_MAP).find(([key, val]) => val === hebrewLabel);
    return entry ? entry[0] : 'General';
}
