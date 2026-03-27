#!/usr/bin/env node

/**
 * NW.js desktop packaging script.
 * Replaces grunt-nw-builder tasks.
 *
 * Usage:
 *   node scripts/desktop.js                          # Build for Windows + Linux
 *   node scripts/desktop.js --platform=macos         # Build for macOS
 *   node scripts/desktop.js --platform=macos-old     # Build for macOS (legacy nwjs 0.12.3)
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DESKTOP_DIR = path.resolve(ROOT, 'dest/desktop');

// Parse --platform argument
const args = process.argv.slice(2);
const platformArg = args.find(a => a.startsWith('--platform='));
const platform = platformArg ? platformArg.split('=')[1] : 'windows-linux';

// Source directories: prod build + package.json (same as Grunt config)
const srcDir = path.resolve(ROOT, 'dest/prod') + '/**/* ' + path.resolve(ROOT, 'package.json');

// Each entry is an array of { platform, arch } targets to build sequentially.
// nw-builder v4 accepts only a single platform/arch per call.
const configs = {
  'windows-linux': {
    version: '0.19.4',
    flavor: 'normal',
    targets: [
      { platform: 'win', arch: 'ia32' },
      { platform: 'win', arch: 'x64' },
      { platform: 'linux', arch: 'ia32' },
      { platform: 'linux', arch: 'x64' },
    ],
    outDir: DESKTOP_DIR,
  },
  macos: {
    version: '0.19.4',
    flavor: 'normal',
    targets: [{ platform: 'osx', arch: 'x64' }],
    outDir: DESKTOP_DIR,
  },
  'macos-old': {
    version: '0.12.3',
    flavor: 'normal',
    targets: [{ platform: 'osx', arch: 'x64' }],
    outDir: path.resolve(DESKTOP_DIR, 'old'),
  },
};

async function main() {
  const config = configs[platform];
  if (!config) {
    console.error(`Unknown platform: ${platform}. Valid: windows-linux, macos, macos-old`);
    process.exit(1);
  }

  // Clean desktop output
  if (fs.existsSync(DESKTOP_DIR)) {
    fs.rmSync(DESKTOP_DIR, { recursive: true });
  }
  fs.mkdirSync(config.outDir, { recursive: true });

  // nw-builder v4 is ESM-only
  const { default: nwbuild } = await import('nw-builder');

  console.log(`Building desktop app for ${platform}...`);
  console.log(`  nw.js version: ${config.version}`);
  console.log(`  Output: ${config.outDir}`);

  for (const target of config.targets) {
    console.log(`\n  Building ${target.platform}-${target.arch}...`);
    await nwbuild({
      mode: 'build',
      version: config.version,
      flavor: config.flavor,
      platform: target.platform,
      arch: target.arch,
      srcDir: srcDir,
      outDir: config.outDir,
      downloadUrl: 'https://dl.nwjs.io/',
      manifestUrl: 'https://nwjs.io/versions.json',
      glob: true,
      logLevel: 'info',
    });
  }

  console.log('\nDesktop build complete.');
}

main().catch(err => {
  console.error('Desktop build failed:', err);
  process.exit(1);
});
