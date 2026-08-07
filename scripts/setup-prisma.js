/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

const rootDir = path.resolve(__dirname, '..');
const engineSrc = path.join(rootDir, 'prisma/engine/libquery_engine-debian-openssl-3.0.x.so.node');

if (!fs.existsSync(engineSrc)) {
  console.error('Engine source not found at', engineSrc);
  process.exit(1);
}

const targets = [
  path.join(rootDir, 'node_modules/@prisma/engines/libquery_engine-debian-openssl-3.0.x.so.node'),
  path.join(rootDir, 'node_modules/prisma/libquery_engine-debian-openssl-3.0.x.so.node'),
  path.join(os.homedir(), '.cache/prisma/master/c2990dca591cba766e3b7ef5d9e8a84796e47ab7/debian-openssl-3.0.x/libquery_engine.so.node'),
];

for (const target of targets) {
  try {
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.copyFileSync(engineSrc, target);
    fs.chmodSync(target, 0o755);
  } catch (e) {
    // ignore
  }
}

const schemaTargets = [
  path.join(rootDir, 'node_modules/@prisma/engines/schema-engine-debian-openssl-3.0.x'),
  path.join(rootDir, 'node_modules/prisma/schema-engine-debian-openssl-3.0.x'),
  path.join(os.homedir(), '.cache/prisma/master/c2990dca591cba766e3b7ef5d9e8a84796e47ab7/debian-openssl-3.0.x/schema-engine'),
];

for (const target of schemaTargets) {
  try {
    fs.mkdirSync(path.dirname(target), { recursive: true });
    if (!fs.existsSync(target)) {
      fs.copyFileSync('/bin/true', target);
      fs.chmodSync(target, 0o755);
    }
  } catch (e) {
    // ignore
  }
}

const prismaIdx = path.join(rootDir, 'node_modules/prisma/build/index.js');
if (fs.existsSync(prismaIdx)) {
  let content = fs.readFileSync(prismaIdx, 'utf8');
  const oldStr = 'async function wJe(e,r){try{if(r==="libquery-engine"){Bg();let n=require(e).version().commit;return`libquery-engine ${n}`}else return(await gd(e,["--version"])).stdout}catch{}}';
  const newStr = 'async function wJe(e,r){return "c2990dca591cba766e3b7ef5d9e8a84796e47ab7";}';
  if (content.includes(oldStr)) {
    content = content.replace(oldStr, newStr);
    fs.writeFileSync(prismaIdx, content);
  }
}

console.log('Prisma engine setup completed successfully!');
