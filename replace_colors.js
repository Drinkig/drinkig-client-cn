const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

const colorMap = {
    '#1a1a1a': 'colors.background',
    '#2a2a2a': 'colors.surface1',
    '#252525': 'colors.surface1',
    '#333333': 'colors.border',
    '#333': 'colors.border',
    '#888888': 'colors.textSecondary',
    '#888': 'colors.textSecondary',
    '#8e44ad': 'colors.primary',
    '#7e13b1': 'colors.primaryDark',
    '#ffffff': 'colors.white',
    '#fff': 'colors.white',
    '#000000': 'colors.black',
    '#000': 'colors.black',
    '#e74c3c': 'colors.error'
};

const regexPattern = new RegExp(`(['"])(${Object.keys(colorMap).join('|')})\\1`, 'gi');

function walk(dir, fileList = []) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const filePath = path.join(dir, file);
        if (fs.statSync(filePath).isDirectory()) {
            if (file !== 'node_modules') walk(filePath, fileList);
        } else if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
            if (!filePath.includes('colors.ts')) {
                fileList.push(filePath);
            }
        }
    }
    return fileList;
}

const files = walk(srcDir);

let updatedCount = 0;

files.forEach(filePath => {
    let content = fs.readFileSync(filePath, 'utf8');
    let hasChanges = false;

    const newContent = content.replace(regexPattern, (match, quote, colorArg) => {
        const color = colorArg.toLowerCase();
        if (colorMap[color]) {
            hasChanges = true;
            return colorMap[color];
        }
        return match;
    });

    if (hasChanges) {
        let finalContent = newContent;

        // Check if we need to add import
        if (!finalContent.includes('import { colors }') && !finalContent.includes('import {colors}')) {
            // Calculate relative path
            let relPath = path.relative(path.dirname(filePath), path.join(srcDir, 'constants', 'colors'));
            if (!relPath.startsWith('.')) relPath = './' + relPath;
            relPath = relPath.replace(/\\/g, '/');

            const lines = finalContent.split('\n');
            let lastImportIdx = -1;
            for (let i = 0; i < lines.length; i++) {
                if (lines[i].trim().startsWith('import ')) {
                    lastImportIdx = i;
                }
            }

            const importStatement = `import { colors } from '${relPath}';`;
            if (lastImportIdx !== -1) {
                lines.splice(lastImportIdx + 1, 0, importStatement);
            } else {
                lines.unshift(importStatement);
            }
            finalContent = lines.join('\n');
        }

        fs.writeFileSync(filePath, finalContent, 'utf8');
        updatedCount++;
        console.log(`Updated: ${filePath}`);
    }
});

console.log(`\nSuccessfully updated ${updatedCount} files.`);
