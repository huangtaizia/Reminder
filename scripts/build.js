const fs = require('node:fs');
const path = require('node:path');
const https = require('node:https');
const { spawnSync } = require('node:child_process');
const { pipeline } = require('node:stream');
const { promisify } = require('node:util');

const pipelineAsync = promisify(pipeline);
const root = path.resolve(__dirname, '..');
const cacheDir = path.join(root, '.cache');

function binPath(name) {
  const ext = process.platform === 'win32' ? '.cmd' : '';
  return path.join(root, 'node_modules', '.bin', `${name}${ext}`);
}

function run(command, args, options = {}) {
  console.log(`> ${command} ${args.join(' ')}`);
  const useShell = options.shell !== undefined ? options.shell : (process.platform === 'win32');
  let result;
  if (useShell) {
    const quote = (s) => (/[ \"'\\]/.test(s) ? `"${s.replace(/"/g, '\\"')}"` : s);
    const cmdStr = `${quote(command)} ${args.map(quote).join(' ')}`;
    result = spawnSync(cmdStr, {
      stdio: 'inherit',
      cwd: root,
      env: Object.assign({}, process.env, options.env || {}),
      shell: true,
    });
  } else {
    result = spawnSync(command, args, {
      stdio: 'inherit',
      cwd: root,
      env: Object.assign({}, process.env, options.env || {}),
      shell: false,
    });
  }
  if (result && result.error) {
    throw result.error;
  }
  if (result && result.status !== 0) {
    throw new Error(`${command} exited with code ${result.status}`);
  }
}

async function download(url, destination) {
  const target = fs.createWriteStream(destination);
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        res.destroy();
        return download(res.headers.location, destination).then(resolve, reject);
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`Download failed: ${url} -> ${res.statusCode}`));
      }
      pipeline(res, target, (err) => {
        if (err) reject(err);
        else resolve();
      });
    }).on('error', reject);
  });
}

async function main() {
  const rmPaths = [
    'dist-electron',
    'dist',
    'release/win-unpacked',
    '.cache/electron-builder-portable',
    '.cache/nsis-binaries',
    '.cache/nsis-resources',
  ];

  for (const relativePath of rmPaths) {
    fs.rmSync(path.join(root, relativePath), { recursive: true, force: true });
  }

  fs.mkdirSync(path.join(cacheDir, 'nsis-binaries'), { recursive: true });
  fs.mkdirSync(path.join(cacheDir, 'nsis-resources'), { recursive: true });

  run(binPath('tsc'), ['-p', 'tsconfig.electron.json']);
  run(binPath('vite'), ['build']);

  await download(
    'https://cdn.npmmirror.com/binaries/electron-builder-binaries/nsis-3.0.4.1/nsis-3.0.4.1.7z',
    path.join(cacheDir, 'nsis-binaries.7z'),
  );

  await download(
    'https://cdn.npmmirror.com/binaries/electron-builder-binaries/nsis-resources-3.4.1/nsis-resources-3.4.1.7z',
    path.join(cacheDir, 'nsis-resources.7z'),
  );

  run(path.join(root, 'node_modules', '7zip-bin', 'win', 'x64', '7za.exe'), [
    'x',
    '-y',
    path.join(cacheDir, 'nsis-binaries.7z'),
    `-o${path.join(cacheDir, 'nsis-binaries')}`,
  ]);

  run(path.join(root, 'node_modules', '7zip-bin', 'win', 'x64', '7za.exe'), [
    'x',
    '-y',
    path.join(cacheDir, 'nsis-resources.7z'),
    `-o${path.join(cacheDir, 'nsis-resources')}`,
  ]);

  run(binPath('electron-builder'), ['--win', 'portable'], {
    env: {
      ELECTRON_BUILDER_CACHE: path.join(cacheDir, 'electron-builder-portable'),
      ELECTRON_BUILDER_NSIS_DIR: path.join(cacheDir, 'nsis-binaries'),
      ELECTRON_BUILDER_NSIS_RESOURCES_DIR: path.join(cacheDir, 'nsis-resources'),
    },
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
