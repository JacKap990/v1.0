const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const total = await prisma.recipe.count();
    const userRecipes = await prisma.recipe.findMany({
        where: { NOT: { userId: null } }
    });

    console.log(`Total recipes: ${total}`);
    console.log(`User-created recipes: ${userRecipes.length}`);
    userRecipes.forEach(r => {
        console.log(`- [${r.id}] ${r.name} (User: ${r.userId})`);
    });
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
