#!/usr/bin/env node

/**
 * Static-export build for the Capacitor shell.
 *
 * Two problems this script solves:
 * 1. Next.js hard-rejects `output: 'export'` while any route declares
 *    force-dynamic — and every server route (app/api/*, app/auth/callback) is
 *    web-only anyway (the native shell calls the hosted Vercel API). They are
 *    excluded from the staged copy.
 * 2. This repo lives on an exFAT external drive where macOS materializes
 *    xattrs as AppleDouble ._* files DURING the build, which crashes Next's
 *    export copy step (EEXIST on ._(main)). So the build runs from a staging
 *    copy on the internal APFS disk (node_modules symlinked, not copied) and
 *    only the finished out/ comes back.
 *
 * Usage: node scripts/cap-build.js       (or: npm run cap:build)
 * Env injected into the build:
 *   CAPACITOR_BUILD=1               → output:'export' + trailingSlash
 *   NEXT_PUBLIC_CAPACITOR_BUILD=1   → client code selects native paths
 *   NEXT_PUBLIC_API_BASE            → absolute base for /api calls
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const STAGE = '/private/tmp/tome-cap-stage';
const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'https://the-tome.vercel.app';

const RSYNC_EXCLUDES = [
  'node_modules',
  '.git',
  '.next',
  'out',
  'ios',
  'android',
  '.cap-excluded',
  '._*',
  '.DS_Store',
  // Server-only routes — web-only, must be absent for output:'export'.
  'app/api',
  'app/auth/callback',
];

function run(cmd, opts = {}) {
  execSync(cmd, { stdio: 'inherit', ...opts });
}

fs.mkdirSync(STAGE, { recursive: true });

console.log(`cap-build: staging source to ${STAGE} (APFS)…`);
const excludeFlags = RSYNC_EXCLUDES.map((e) => `--exclude '${e}'`).join(' ');
run(`rsync -a --delete ${excludeFlags} '${ROOT}/' '${STAGE}/'`);

// node_modules stays on the external drive; a symlink resolves fine from APFS.
const stagedModules = path.join(STAGE, 'node_modules');
try {
  const current = fs.lstatSync(stagedModules, { throwIfNoEntry: false });
  if (current && !current.isSymbolicLink()) fs.rmSync(stagedModules, { recursive: true });
  if (!current || !current.isSymbolicLink()) {
    fs.symlinkSync(path.join(ROOT, 'node_modules'), stagedModules);
  }
} catch (err) {
  console.error('cap-build: node_modules symlink failed:', err.message);
  process.exit(1);
}

console.log('cap-build: building static export…');
try {
  run('npx next build', {
    cwd: STAGE,
    env: {
      ...process.env,
      COPYFILE_DISABLE: '1',
      CAPACITOR_BUILD: '1',
      NEXT_PUBLIC_CAPACITOR_BUILD: '1',
      NEXT_PUBLIC_API_BASE: API_BASE,
    },
  });
} catch {
  process.exit(1);
}

console.log('cap-build: copying out/ back…');
fs.rmSync(path.join(ROOT, 'out'), { recursive: true, force: true });
run(`rsync -a --exclude '._*' '${STAGE}/out/' '${ROOT}/out/'`);
// Belt and suspenders: sweep any AppleDouble files the destination drive made.
run(`find '${path.join(ROOT, 'out')}' -name '._*' -type f -delete`);

console.log(`\ncap-build: static export ready in out/ (API base: ${API_BASE})`);
