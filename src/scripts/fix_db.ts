import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log("Starting DB normalization...");
    const items = await prisma.inventoryItem.findMany();
    let updatedCount = 0;

    for (const item of items) {
        const nameLower = item.name.toLowerCase();
        const unitLower = (item.unit || "").toLowerCase();

        // Check if it's a liquid but saved as "grams" or "kg"
        const isLiquidName = nameLower.includes('חלב') || nameLower.includes('מים') || nameLower.includes('מיץ') || nameLower.includes('קולה') || nameLower.includes('שתייה');
        const isWeightUnit = unitLower.includes('gram') || unitLower.includes('גרם') || unitLower.includes('kg') || unitLower.includes('קג');

        if (isLiquidName && isWeightUnit) {
            let newUnit = "ליטר";
            let newQuantity = item.quantity;

            // If it was saved as 1500 grams, convert to 1.5 Liters. 
            // If it was saved as 1.5 grams, it's just a wrong unit label -> convert to 1.5 Liters.
            if (unitLower.includes('gram') || unitLower.includes('גרם')) {
                if (item.quantity > 50) {
                    newQuantity = item.quantity / 1000;
                }
            }

            await prisma.inventoryItem.update({
                where: { id: item.id },
                data: { unit: newUnit, quantity: newQuantity }
            });

            console.log(`Normalized: ${item.name} -> ${newQuantity} ${newUnit}`);
            updatedCount++;
        }
    }

    console.log(`DB Normalization complete. ${updatedCount} items updated.`);
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
