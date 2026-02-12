const fs = require('fs');
const path = 'node_modules/@solana/spl-account-compression/package.json';

try {
    if (fs.existsSync(path)) {
        const pkg = JSON.parse(fs.readFileSync(path, 'utf8'));

        // Check if we need to patch
        if (pkg.main === './dist/cjs/index.js' && !fs.existsSync('node_modules/@solana/spl-account-compression/dist/cjs/index.js')) {
            console.log('Patching @solana/spl-account-compression paths...');

            pkg.main = './dist/cjs/src/index.js';
            pkg.module = './dist/cjs/src/index.js';

            if (pkg.exports && pkg.exports['.']) {
                pkg.exports['.'].require = './dist/cjs/src/index.js';
                pkg.exports['.'].import = './dist/cjs/src/index.js';
            }

            fs.writeFileSync(path, JSON.stringify(pkg, null, 2));
            console.log('✅ Patched @solana/spl-account-compression successfully.');
        } else {
            console.log('No patch needed for @solana/spl-account-compression.');
        }
    } else {
        console.log('⚠️ @solana/spl-account-compression not found, skipping patch.');
    }
} catch (e) {
    console.error('Failed to patch @solana/spl-account-compression:', e);
}
