/**
 * Unit Conversion & Formatting Utility
 * Ported and enhanced from vanilla SmartEngine.estimateUnitConversion
 */

export type UnitType = "יחידות" | "קג" | "גרם" | "ליטר" | "מל" | "מארז" | "units" | "kg" | "grams" | "liter" | "ml" | "carton";

const UNIT_LABELS: Record<string, string> = {
    "יחידות": "יח'",
    "units": "יח'",
    "unit": "יח'",
    "kg": "ק\"ג",
    "קג": "ק\"ג",
    "kilo": "ק\"ג",
    "grams": "גרם",
    "gram": "גרם",
    "גרם": "גרם",
    "liter": "ליטר",
    "liters": "ליטר",
    "l": "ליטר",
    "ליטר": "ליטר",
    "ml": "מ\"ל",
    "mls": "מ\"ל",
    "מל": "מ\"ל",
    "carton": "מארז",
    "מארז": "מארז"
};

/**
 * Knowledge Base for Average Weights (in KG) per Single Unit
 */
const AVG_WEIGHTS: Record<string, number> = {
    'עגבניה': 0.15, 'עגבניות': 0.15,
    'מלפפון': 0.1, 'מלפפונים': 0.1,
    'תפוח': 0.18, 'תפוחים': 0.18,
    'תפוח אדמה': 0.2, 'תפוחי אדמה': 0.2,
    'בצל': 0.15, 'בצלים': 0.15,
    'גזר': 0.1, 'גזרים': 0.1,
    'פלפל': 0.15, 'פלפלים': 0.15,
    'חציל': 0.4, 'חצילים': 0.4,
    'לימון': 0.12, 'לימונים': 0.12,
    'אבטיח': 6.0, 'מלון': 1.5,
    'לחם': 0.75,
    'חלב': 1.0, // 1L ~ 1KG
    'עוף': 1.6,
    'ביצה': 0.06, 'ביצים': 0.06,
    'קורנפלקס': 0.75, 'דגנים': 0.5
};

export function getUnitLabel(unit: string | undefined | null): string {
    if (!unit) return "יח'";
    const lower = unit.toLowerCase();
    return UNIT_LABELS[lower] || unit;
}

/**
 * Estimate conversion between units
 */
export function estimateConversion(name: string, qty: number, fromUnit: string, toUnit: string): number {
    if (fromUnit === toUnit) return qty;

    let unitWeight = 0.2; // Default
    const n = name.toLowerCase();

    for (const k in AVG_WEIGHTS) {
        if (n.includes(k)) {
            unitWeight = AVG_WEIGHTS[k];
            break;
        }
    }

    if (n.includes('עוף') && n.includes('שלם')) unitWeight = 1.6;

    let val = qty;

    // Convert to Base (Units or KG)
    const isWeightFrom = ['kg', 'קג', 'liter', 'ליטר', 'grams', 'גרם', 'ml', 'מל'].includes(fromUnit.toLowerCase());
    const isWeightTo = ['kg', 'קג', 'liter', 'ליטר', 'grams', 'גרם', 'ml', 'מל'].includes(toUnit.toLowerCase());

    // Logic: Units -> Weight
    if (!isWeightFrom && isWeightTo) {
        return parseFloat((val * unitWeight).toFixed(2));
    }

    // Logic: Weight -> Units
    if (isWeightFrom && !isWeightTo) {
        return Math.round(val / unitWeight);
    }

    // Weight -> Weight (e.g. Grams -> KG)
    if (fromUnit === 'grams' || fromUnit === 'גרם') val = val / 1000;
    if (fromUnit === 'ml' || fromUnit === 'מל') val = val / 1000;

    if (toUnit === 'grams' || toUnit === 'גרם') return val * 1000;
    if (toUnit === 'ml' || toUnit === 'מל') return val * 1000;

    return val;
}

/**
 * Decide if a product should default to Weight (KG/L) instead of Units
 */
export function getRecommendedUnit(name: string): string {
    const n = name.toLowerCase();
    if (n.includes('חלב') || n.includes('מים') || n.includes('מיץ') || n.includes('שתייה')) return 'ליטר';
    if (n.includes('עגבניה') || n.includes('מלפפון') || n.includes('פירות') || n.includes('ירקות')) return 'קג';
    return 'יחידות';
}

/**
 * Normalizes and parses unit information
 */
export function parseUnit(name: string, unit: string) {
    const lower = (unit || "").toLowerCase().trim();
    let displayUnit = UNIT_LABELS[lower] || lower || "יח'";

    const n = name.toLowerCase();
    const isLiquid = n.includes('חלב') || n.includes('שתייה') || n.includes('מים') || n.includes('מיץ') || n.includes('תירוש') || n.includes('יין') || n.includes('שמן') || n.includes('שתיה') || n.includes('סירופ') || n.includes('רוטב');

    // Auto-correct liters for liquids if unit is grams and qty is small (indicates wrong unit selection)
    // This is handled more robustly in normalizeProductData, but we keep a simple check here for legacy display.
    if (isLiquid && (lower.includes('gram') || lower.includes('גרם'))) {
        displayUnit = "ליטר";
    }

    return {
        normalizedUnit: unit,
        displayUnit: displayUnit
    };
}

/**
 * Ensures that even if data is inconsistent in the DB, it is displayed correctly
 * e.g. "1.5g Milk" -> { qty: 1.5, unit: "L" }
 */
export function ensureNormalizedDisplay(name: string, qty: number, unit: string) {
    const { quantity, unit: normalizedUnit } = normalizeProductData(name, qty, unit);
    return {
        qty: quantity,
        unit: normalizedUnit,
        label: getUnitLabel(normalizedUnit)
    };
}

/**
 * Advanced normalization for product data (Fixes 1.5g Milk -> 1.5L Milk)
 */
export function normalizeProductData(name: string, qty: number, unit: string) {
    const n = name.toLowerCase();
    const u = unit.toLowerCase();

    const isLiquid = n.includes('חלב') || n.includes('שתייה') || n.includes('מים') || n.includes('מיץ') || n.includes('תירוש') || n.includes('יין') || n.includes('שמן') || n.includes('שתיה') || n.includes('סירופ') || n.includes('רוטב') || n.includes('סבון') || n.includes('שמפו') || n.includes('מרכך') || n.includes('אקונומיקה') || n.includes('נוזל') || n.includes('חומץ') || n.includes('בירה') || n.includes('וודקה') || n.includes('וויסקי') || n.includes('יוגורט') || n.includes('שמנת') || n.includes('ריוויון') || n.includes('קוקה קולה') || n.includes('פאנטה') || n.includes('ספרייט') || n.includes('סודה');

    console.log(`[NORMALIZE] ${name} | Qty: ${qty} | Unit: ${unit} | isLiquid: ${isLiquid}`);

    let normalizedQty = qty;
    let normalizedUnit = unit;

    if (isLiquid) {
        // If it's a liquid and unit is weight-based
        if (u.includes('גרם') || u.includes('gram')) {
            if (qty >= 100) {
                // 1500g -> 1.5L
                normalizedQty = qty / 1000;
                normalizedUnit = "ליטר";
            } else if (qty < 10) {
                // 1.5g -> 1.5L (Common AI mistake if it thinks Liter = Gram)
                // We assume anything < 10 in grams for a liquid is a mistake for Liters
                normalizedUnit = "ליטר";
            } else {
                // e.g. 50g of hot sauce? might be ML
                normalizedUnit = "מל";
            }
        } else if (u.includes('קג') || u.includes('kg')) {
            // 1.5kg Milk -> 1.5L Milk
            normalizedUnit = "ליטר";
        }
    } else {
        // For solids (Tomatoes, Meat, etc.)
        if (u.includes('מל') || u.includes('ml') || u.includes('ליטר') || u.includes('liter')) {
            // 1L Tomato -> 1KG Tomato
            normalizedQty = (qty < 5) ? qty : qty / 1000; // If 1000ml -> 1kg
            normalizedUnit = "קג";
        } else if (u.includes('גרם') || u.includes('gram')) {
            if (qty >= 1000) {
                // 3000g -> 3kg
                normalizedQty = qty / 1000;
                normalizedUnit = "קג";
            }
        }
    }

    return { quantity: normalizedQty, unit: normalizedUnit };
}

/**
 * Formats quantity for display
 */
export function formatQuantity(qty: number, unit: string): string {
    if (qty === 0) return "0";

    // If unit is Liters or KG, and qty is >= 1000, we might be dealing with grams/ml stored as raw numbers
    // But usually our DB stores normalized values. 
    // Let's ensure precision is clean

    if (qty % 1 === 0) return qty.toString();

    // For weights/volumes, 1 decimal is usually enough unless it's very small
    if (qty < 0.1) return qty.toFixed(3);
    return qty.toFixed(1).replace(/\.0$/, "");
}
