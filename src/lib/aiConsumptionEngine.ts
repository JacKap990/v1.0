/**
 * AI Consumption Engine
 * Predicts stock depletion and suggests additions to shopping lists.
 */

import { differenceInDays } from "date-fns";

export interface ItemContext {
    id: string;
    name: string;
    quantity: number;
    unit: string;
    updatedAt: Date | string;
    consumptionRate?: number; // Days per unit (e.g. 7 days for 1L milk)
    minQuantity?: number;
}

/**
 * Predicts remaining days for an item
 */
export function predictDaysRemaining(item: ItemContext): number {
    const rate = item.consumptionRate || 7; // Default 7 days per unit
    const qty = item.quantity;
    const lastUpdate = new Date(item.updatedAt);
    const daySinceUpdate = differenceInDays(new Date(), lastUpdate);

    // Simple linear model: Total Potential Days - Days Already Passed
    const totalPotentialDays = qty * rate;
    const remaining = Math.max(0, totalPotentialDays - daySinceUpdate);

    return Math.round(remaining);
}

/**
 * Determines urgency score (0-100)
 */
export function getUrgencyScore(item: ItemContext): number {
    const daysLeft = predictDaysRemaining(item);
    const minQty = item.minQuantity || 1;

    if (daysLeft <= 0) return 100; // Out of stock
    if (daysLeft <= 2) return 90;  // Critical
    if (item.quantity < minQty) return 80; // Below min

    // Normalized score: lower days = higher score
    return Math.max(0, 70 - (daysLeft * 5));
}

/**
 * Recommends adding to shopping list
 */
export function shouldSuggest(item: ItemContext): boolean {
    const score = getUrgencyScore(item);
    return score >= 75;
}
