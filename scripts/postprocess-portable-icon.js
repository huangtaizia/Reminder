const fs = require('node:fs');
const path = require('node:path');
const rceditModule = require('rcedit');
const rcedit =
  typeof rceditModule === 'function'
    ? rceditModule
    : (rceditModule.rcedit || rceditModule.default);

async function main() {
  const root = process.cwd();
  const pkgPath = path.join(root, 'package.json');
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));

  const version = pkg.version;
  const productName = pkg.build?.productName || pkg.name || 'Reminder';
  const exePath = path.join(root, 'release', `${productName}-${version}.exe`);
  const iconPath = path.join(root, 'build', 'icons', 'win', 'icon.ico');

  if (!fs.existsSync(exePath)) {
    throw new Error(`Portable executable not found: ${exePath}`);
  }
  if (!fs.existsSync(iconPath)) {
    throw new Error(`Icon file not found: ${iconPath}`);
  }

  const options = {
    icon: iconPath,
    'version-string': {
      ProductName: productName,
      FileDescription: productName,
      OriginalFilename: path.basename(exePath),
    },
  };

  const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
  const maxAttempts = 8;
  let lastError;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      await rcedit(exePath, options);
      lastError = undefined;
      break;
    } catch (err) {
      lastError = err;
      // electron-builder/antivirus can hold a transient lock on exe.
      await sleep(700 * attempt);
    }
  }
  if (lastError) {
    throw lastError;
  }

  console.log(`[postprocess] Updated executable resources: ${exePath}`);
}

main().catch(err => {
  console.error('[postprocess] Failed to update executable icon:', err?.message || err);
  process.exit(1);
});
