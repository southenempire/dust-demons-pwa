
const fs = require('fs');
const path = 'src/app/page.js';
const content = fs.readFileSync(path, 'utf8');
const index = content.indexOf("showModal('DANGER', 'BURN FAILED',");
if (index === -1) {
    console.log('Not found');
} else {
    console.log(JSON.stringify(content.substring(index, index + 200)));
}
