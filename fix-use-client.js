const fs = require('fs');
const path = require('path');

function processDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            processDir(fullPath);
        } else if (file === 'page.tsx') {
            let content = fs.readFileSync(fullPath, 'utf8');
            if (content.match(/['"]use client['"]/)) {
                // Remove existing "use client" and surrounding whitespace/newlines
                content = content.replace(/^[\s\r\n]*/, '');
                content = content.replace(/['"]use client['"];?[\s\r\n]*/g, '');

                // Ensure "use client"; is at the very top
                content = '"use client";\n\n' + content;
                fs.writeFileSync(fullPath, content, 'utf8');
                console.log(`Fixed: ${fullPath}`);
            }
        }
    }
}

processDir(path.join(__dirname, 'src', 'app'));
