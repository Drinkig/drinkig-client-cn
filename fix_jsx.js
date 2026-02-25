const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

function walk(dir, fileList = []) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const filePath = path.join(dir, file);
        if (fs.statSync(filePath).isDirectory()) {
            if (file !== 'node_modules') walk(filePath, fileList);
        } else if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
            fileList.push(filePath);
        }
    }
    return fileList;
}

const files = walk(srcDir);
let fixedCount = 0;

files.forEach(filePath => {
    let content = fs.readFileSync(filePath, 'utf8');

    // match things like ` color=colors.primary` or ` backgroundColor=colors.background`
    const regex = /([\s\n])([a-zA-Z0-9_]+)=colors\.([a-zA-Z0-9_]+)/g;

    if (regex.test(content)) {
        const newContent = content.replace(regex, '$1$2={colors.$3}');
        fs.writeFileSync(filePath, newContent, 'utf8');
        fixedCount++;
        console.log(`Fixed JSX braces in: ${filePath}`);
    }
});
console.log(`Fixed ${fixedCount} files.`);
