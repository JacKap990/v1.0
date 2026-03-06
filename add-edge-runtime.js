const fs = require('fs');
const path = require('path');

function processDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            processDir(fullPath);
        } else if (file === 'page.tsx' || file === 'route.ts') {
            let content = fs.readFileSync(fullPath, 'utf8');
            if (!content.includes("export const runtime = 'edge'") && !content.includes('export const runtime = "edge"')) {
                content = "export const runtime = 'edge';\n" + content;
                fs.writeFileSync(fullPath, content, 'utf8');
                console.log(`Updated: ${fullPath}`);
            }
        }
    }
}

processDir(path.join(__dirname, 'src', 'app'));
