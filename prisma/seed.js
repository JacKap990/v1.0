const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function main() {
    console.log('Starting legacy data migration...');

    // 1. Migrate Products
    const productsPath = path.join(__dirname, '../../main app NEW/frontend/src/js/products.js');
    if (fs.existsSync(productsPath)) {
        console.log('Reading products.js...');
        let productsStr = fs.readFileSync(productsPath, 'utf8');

        // Extract the JSON part from `const SmartProductsDB = [...]`
        const jsonMatch = productsStr.match(/const\s+SmartProductsDB\s*=\s*(\[[\s\S]*\]);/);
        if (jsonMatch && jsonMatch[1]) {
            try {
                // The file might have JS comments, so we need a safer eval or loose JSON parse.
                // Using a safe eval wrapper since it's an array of JS objects.
                const generateProducts = new Function(`return ${jsonMatch[1]}`);
                const products = generateProducts();

                console.log(`Found ${products.length} products to migrate.`);

                // Clear existing
                await prisma.globalProduct.deleteMany({});

                // Batch insert to avoid query limits
                const batchSize = 1000;
                let inserted = 0;
                for (let i = 0; i < products.length; i += batchSize) {
                    const batch = products.slice(i, i + batchSize).map(p => ({
                        id: String(p.id) || String(Date.now() + i),
                        name: p.name || 'Unknown',
                        category: p.category || 'other',
                        image: p.image || null,
                        remoteImage: p.remoteImage || null,
                        unit: p.unit || 'units',
                        packWeight: p.packWeight ? parseFloat(p.packWeight) : null,
                        packUnit: p.packUnit || null,
                        manufacturer: p.manufacturer || null,
                        brand: p.brand || null,
                        kosher: p.kosher || null,
                        link: p.link || null,
                        emoji: p.emoji || null
                    }));

                    await prisma.globalProduct.createMany({
                        data: batch
                    });
                    inserted += batch.length;
                    console.log(`Inserted ${inserted}/${products.length} products...`);
                }

                console.log('✅ Products migration complete.');
            } catch (e) {
                console.error('Error parsing or inserting products:', e);
            }
        } else {
            console.log('Could not find SmartProductsDB array in products.js');
        }
    } else {
        console.log('products.js not found at', productsPath);
    }

    // 2. Migrate Recipes
    const recipesPath = path.join(__dirname, '../../main app NEW/frontend/src/js/recipes.js');
    if (fs.existsSync(recipesPath)) {
        console.log('Reading recipes.js...');
        let recipesStr = fs.readFileSync(recipesPath, 'utf8');

        const jsonMatch = recipesStr.match(/window\.SmartRecipesDB\s*=\s*(\[[\s\S]*\]);/);
        if (jsonMatch && jsonMatch[1]) {
            try {
                const generateRecipes = new Function(`return ${jsonMatch[1]}`);
                const recipes = generateRecipes();

                console.log(`Found ${recipes.length} recipes to migrate.`);

                await prisma.recipe.deleteMany({});

                const recipeData = recipes.map(r => ({
                    id: String(r.id),
                    name: String(r.name),
                    emoji: r.emoji || null,
                    image: r.image || null,
                    time: r.time || null,
                    difficulty: r.difficulty || null,
                    tags: r.tags ? JSON.stringify(r.tags) : null,
                    ingredients: r.ingredients ? JSON.stringify(r.ingredients) : null,
                    instructions: r.instructions ? JSON.stringify(r.instructions) : null
                }));

                await prisma.recipe.createMany({
                    data: recipeData
                });

                console.log('✅ Recipes migration complete.');
            } catch (e) {
                console.error('Error parsing or inserting recipes:', e);
            }
        } else {
            console.log('Could not find SmartRecipesDB array in recipes.js');
        }
    } else {
        console.log('recipes.js not found at', recipesPath);
    }
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })
