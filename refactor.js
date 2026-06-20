const fs = require('fs');
const path = require('path');

const baseDir = path.join(__dirname, 'app/api');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(filePath));
    } else {
      if (file === 'route.js' && !filePath.includes('[...nextauth]')) {
        results.push(filePath);
      }
    }
  });
  return results;
}

const files = walk(baseDir);

const injectSession = `
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    const TEACHER_ID = session.user.email
`;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');

  // If imports are missing, add them
  if (!content.includes('getServerSession')) {
    const importsStr = `\nimport { getServerSession } from "next-auth/next"\nimport { authOptions } from "@/app/api/auth/[...nextauth]/route"\n`;
    content = content.replace(/(import .*?\n)(?!import)/s, '$1' + importsStr);
  }
  
  // Remove global TEACHER_ID
  content = content.replace(/const TEACHER_ID = ['"]default-teacher['"]/g, '');

  // Inject session
  // We look for 'export async function GET(request... { try {'
  // Actually, let's just find `try {` after `export async function` and inject right after.
  
  const methods = ['GET', 'POST', 'PUT', 'DELETE'];
  methods.forEach(method => {
    const regex = new RegExp(`(export async function ${method}\\([^)]*\\)\\s*\\{\\s*(?:try\\s*\\{\\s*)?)(?!.*const session = await getServerSession)`, 'g');
    
    // We need to carefully inject it. Some already have it.
    // Let's manually check each method
    const splitStr = `export async function ${method}`;
    if (content.includes(splitStr)) {
      let parts = content.split(splitStr);
      for (let i = 1; i < parts.length; i++) {
        // Find the first opening brace `{` and `try {`
        let blockStartIndex = parts[i].indexOf('{');
        let tryIndex = parts[i].indexOf('try {');
        let tryIndex2 = parts[i].indexOf('try{');
        
        // If it already has session, skip
        let firstLines = parts[i].substring(0, 100);
        if (firstLines.includes('getServerSession')) continue;
        
        let injectPos = blockStartIndex + 1;
        if (tryIndex !== -1 && tryIndex < blockStartIndex + 50) injectPos = tryIndex + 5;
        if (tryIndex2 !== -1 && tryIndex2 < blockStartIndex + 50) injectPos = tryIndex2 + 4;
        
        parts[i] = parts[i].slice(0, injectPos) + injectSession + parts[i].slice(injectPos);
      }
      content = parts.join(splitStr);
    }
  });

  fs.writeFileSync(file, content, 'utf8');
  console.log('Processed', file);
});
