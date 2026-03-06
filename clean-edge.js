const fs = require('fs');
const path = require('path');

function processDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            processDir(fullPath);
        } else if (file === 'route.ts' || file === 'page.tsx') {
            let content = fs.readFileSync(fullPath, 'utf8');
            if (content.includes("export const runtime = 'edge';")) {
                content = content.replace(/^export const runtime = 'edge';\s*/gm, '');
                fs.writeFileSync(fullPath, content, 'utf8');
                console.log(`Cleaned: ${fullPath}`);
            }
        }
    }
}

processDir(path.join(__dirname, 'src', 'app'));
