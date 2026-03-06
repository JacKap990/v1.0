export function estimatePercentage(updatedAt: Date | string, quantity: number, consumptionRate: number = 7, minQuantity: number = 1): number {
    if (quantity <= 0) return 0;

    const lastUpdate = new Date(updatedAt);
    const now = new Date();

    // Difference in days since last update
    const daysSinceUpdate = Math.max(0, (now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24));

    // Simple linear decay: (Remaining Days / Total Consumption Cycle) * 100
    const effectiveConsumptionRate = consumptionRate || 7;
    const remainingDays = Math.max(0, effectiveConsumptionRate - daysSinceUpdate);
    let percentageByTime = (remainingDays / effectiveConsumptionRate) * 100;

    // Advanced: Consider quantity relative to minQuantity
    // If we have less than minQuantity, we are effectively 'low' (e.g. 20% max)
    const effectiveMin = minQuantity || 1;
    if (quantity <= effectiveMin) {
        percentageByTime = Math.min(percentageByTime, 20);
    } else if (quantity <= effectiveMin * 2) {
        percentageByTime = Math.min(percentageByTime, 50);
    }

    // Final percentage is floor of the time-based calculation, but at least 0
    return Math.max(0, Math.floor(percentageByTime));
}

/**
 * Returns a color class based on the percentage
 */
export function getStatusColor(percent: number): string {
    if (percent <= 20) return "rose";
    if (percent <= 50) return "amber";
    return "emerald";
}

/**
 * Returns a localized status text based on the percentage
 */
export function getStatusText(percent: number, language: string = "he"): string {
    if (language === "en") {
        if (percent <= 20) return "Almost empty";
        if (percent <= 50) return "Half full";
        return "Full";
    }
    // Default Hebrew
    if (percent <= 20) return "כמעט נגמר";
    if (percent <= 50) return "חצי מלא";
    return "מלא";
}

/**
 * Predicts the depletion date based on consumption rate
 */
export function getDepletionDate(updatedAt: Date | string, consumptionRate: number = 7): Date {
    const lastUpdate = new Date(updatedAt);
    const date = new Date(lastUpdate);
    date.setDate(lastUpdate.getDate() + (consumptionRate || 7));
    return date;
}

/**
 * Checks if an item is considered "Running Low" (below 15% or within 2 days of depletion)
 */
export function isRunningLow(updatedAt: Date | string, quantity: number, consumptionRate: number = 7): boolean {
    const percent = estimatePercentage(updatedAt, quantity, consumptionRate);
    if (percent < 15) return true;

    const depletionDate = getDepletionDate(updatedAt, consumptionRate);
    const now = new Date();
    const daysUntilDepletion = (depletionDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);

    return daysUntilDepletion <= 2;
}
