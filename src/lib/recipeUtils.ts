// Recipe scaling and transformation utilities (client-safe)

// Ingredient substitution maps for dietary transformations
const VEGAN_SUBS: Record<string, string> = {
    "חלב": "חלב שקדים",
    "חמאה": "שמן קוקוס",
    "ביצים": "תחליף ביצים טבעוני",
    "ביצה": "תחליף ביצה טבעוני",
    "שמנת": "שמנת קוקוס",
    "גבינה": "גבינה טבעונית",
    "בשר": "טופו",
    "עוף": "טופו",
    "דבש": "סילאן",
    "יוגורט": "יוגורט סויה",
};

const KOSHER_SUBS: Record<string, string> = {
    "חזיר": "בקר",
    "שרימפס": "דג",
};

export function transformRecipeIngredients(
    ingredients: { name: string; amount: number; unit: string }[],
    mode: "vegan" | "vegetarian" | "kosher"
): { name: string; amount: number; unit: string }[] {
    const subs = mode === "vegan" ? VEGAN_SUBS : mode === "kosher" ? KOSHER_SUBS : {};

    return ingredients.map(ing => {
        const lowerName = ing.name.toLowerCase();
        for (const [key, value] of Object.entries(subs)) {
            if (lowerName.includes(key)) {
                return { ...ing, name: value };
            }
        }
        return ing;
    });
}

// Math engine for serving adjustments
export function scaleIngredients(
    ingredients: { name: string; amount: number; unit: string }[],
    originalServings: number,
    targetServings: number
): { name: string; amount: number; unit: string }[] {
    if (originalServings <= 0) return ingredients;
    const ratio = targetServings / originalServings;
    return ingredients.map(ing => ({
        ...ing,
        amount: Math.round(ing.amount * ratio * 100) / 100
    }));
}

// Anchor-based scaling: scale everything relative to a specific ingredient
export function scaleByAnchor(
    ingredients: { name: string; amount: number; unit: string }[],
    anchorIndex: number,
    newAnchorAmount: number
): { name: string; amount: number; unit: string }[] {
    const anchor = ingredients[anchorIndex];
    if (!anchor || anchor.amount <= 0) return ingredients;
    const ratio = newAnchorAmount / anchor.amount;
    return ingredients.map(ing => ({
        ...ing,
        amount: Math.round(ing.amount * ratio * 100) / 100
    }));
}
