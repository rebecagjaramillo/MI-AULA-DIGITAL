const fs = require('fs');
const path = require('path');

const dirsToScan = ['app', 'components'];

function scanDir(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(scanDir(file));
    } else {
      if (file.endsWith('.js') || file.endsWith('.jsx')) {
        results.push(file);
      }
    }
  });
  return results;
}

const files = [];
dirsToScan.forEach(d => {
  if (fs.existsSync(d)) {
    files.push(...scanDir(d));
  }
});

let modifiedCount = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;

  // Replace text-[10px] -> text-2xs
  content = content.replace(/text-\[10px\]/g, 'text-2xs');
  
  // Replace text-[11px] -> text-xs
  content = content.replace(/text-\[11px\]/g, 'text-xs');

  // Replace text-[13px] -> text-sm
  content = content.replace(/text-\[13px\]/g, 'text-sm');

  // duration-300 -> duration-normal
  content = content.replace(/duration-300/g, 'duration-normal');
  
  // duration-150 or 200 -> duration-fast
  content = content.replace(/duration-150/g, 'duration-fast');
  content = content.replace(/duration-200/g, 'duration-fast');

  // rounded-[10px] -> rounded-lg
  content = content.replace(/rounded-\[10px\]/g, 'rounded-lg');

  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
    modifiedCount++;
  }
});

console.log(`Refactor complete. Modified ${modifiedCount} files.`);
