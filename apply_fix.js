
const fs = require('fs');
const path = 'src/app/page.js';
let content = fs.readFileSync(path, 'utf8');

const targetStr = "showModal('DANGER', 'BURN FAILED',\n          errorLog.length > 0 ? errorLog.join('\\\\n') : 'No valid targets found (Frozen or Closed).');";
// Note: debug output showed \\n. In JS string literal for file, \\n is backslash+n. 
// When reading file into `content`, it contains `\` `n`.
// In my `targetStr` code literal: `\\\\n` becomes `\\n` (backslash+n).
// Wait, debug output (JSON.stringify) showed `"\\\\n"`. 
// JSON string of `\` is `\\`.
// So the file content has `\` `n`.
// So `targetStr` should have `\\\\n`? No, `\\n`.
// Let's try matching a substring to be safe.

const part1 = "showModal('DANGER', 'BURN FAILED',";
const part2 = "errorLog.length > 0 ? errorLog.join(";
// I'll use regex for the middle part to be safe.

// Better approach: use the debug output string directly but be careful with escaping.
// Debug output: "showModal('DANGER', 'BURN FAILED',\n          errorLog.length > 0 ? errorLog.join('\\n') : 'No valid targets found (Frozen or Closed).');\n"

// I'll try exact replace first.
const exactTarget = "showModal('DANGER', 'BURN FAILED',\n          errorLog.length > 0 ? errorLog.join('\\n') : 'No valid targets found (Frozen or Closed).');";
// If this fails, I'll print why.

const replacement = `if (failedIds.length > 0 && errorLog.length === 0) {
          showModal('SUCCESS', 'CLEANUP COMPLETE', 'Removed ghost assets (already closed).');
      } else {
          showModal('DANGER', 'BURN FAILED',
             errorLog.length > 0 ? errorLog.join('\\n') : 'No valid targets found.');
      }`;

if (content.includes(exactTarget)) {
    content = content.replace(exactTarget, replacement);
    fs.writeFileSync(path, content);
    console.log('Replaced showModal');
} else {
    console.log('Target not found. Searching...');
    // Fallback: Use split/join by surrounding context
    const parts = content.split("showModal('DANGER', 'BURN FAILED',");
    if (parts.length > 1) {
        // We found the start.
        // Assume the rest follows.
        const after = parts[1];
        // The line ends with `);`.
        const endIdx = after.indexOf(");");
        if (endIdx !== -1) {
            const oldBlock = "showModal('DANGER', 'BURN FAILED'," + after.substring(0, endIdx + 2);
            console.log('Found clumsy block:', oldBlock);
            content = content.replace(oldBlock, replacement);
            fs.writeFileSync(path, content);
            console.log('Replaced via fallback');
        }
    }
}
