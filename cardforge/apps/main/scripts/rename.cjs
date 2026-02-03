const path = require('node:path');
const fs = require('node:fs');

const distDir = path.join(__dirname, '..', 'dist');

const entries = ['main', 'preload'];

for (const entry of entries) {
  const jsPath = path.join(distDir, `${entry}.js`);
  const cjsPath = path.join(distDir, `${entry}.cjs`);

  if (!fs.existsSync(jsPath)) continue;
  fs.renameSync(jsPath, cjsPath);

  const mapJsPath = path.join(distDir, `${entry}.js.map`);
  const mapCjsPath = path.join(distDir, `${entry}.cjs.map`);

  if (fs.existsSync(mapJsPath)) {
    fs.renameSync(mapJsPath, mapCjsPath);
    const content = fs.readFileSync(cjsPath, 'utf-8');
    const updated = content.replace(/sourceMappingURL=.*$/m, `sourceMappingURL=${entry}.cjs.map`);
    if (updated !== content) {
      fs.writeFileSync(cjsPath, updated, 'utf-8');
    }
  }
}
