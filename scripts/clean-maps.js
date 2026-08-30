const fs = require('fs');
const path = require('path');

function removeMapFiles(dir) {
  if (!fs.existsSync(dir)) return;
  fs.readdirSync(dir, { withFileTypes: true }).forEach(entry => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      removeMapFiles(fullPath);
    } else if (entry.name.endsWith('.map')) {
      fs.unlinkSync(fullPath);
      console.log(`Removed: ${fullPath}`);
    }
  });
}

removeMapFiles(path.join(__dirname, '..', '.next'));
console.log('All .map files removed.');
