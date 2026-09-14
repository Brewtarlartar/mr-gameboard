#!/usr/bin/env node

/**
 * Debug-APK build for the Android shell.
 *
 * Gradle cannot build from this repo in place: the exFAT external drive
 * materializes AppleDouble ._* files inside android/app/build during the
 * build and `:app:parseDebugLocalResources` fails on them (same root cause
 * as scripts/cap-build.js). So android/ plus the Capacitor packages its
 * settings.gradle references (../node_modules/@capacitor/*) are rsynced to
 * a staging dir on the internal APFS disk and Gradle runs there.
 *
 * Also picks a Gradle-compatible JDK: Gradle 8.14 rejects the Java 25 bundled
 * with Android Studio ("Unsupported class file major version 69"), so prefer
 * Homebrew's openjdk@21 (`brew install openjdk@21`), else honour JAVA_HOME.
 *
 * Usage: npm run cap:sync && node scripts/android-build.js
 *        (or: npm run cap:android:apk — runs the sync for you)
 * Result: prints the APK path; install with
 *        adb install -r <apk>
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const STAGE = '/private/tmp/tome-android-stage';
const HOMEBREW_JDK21 = '/opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home';

function run(cmd, opts = {}) {
  execSync(cmd, { stdio: 'inherit', ...opts });
}

const javaHome = fs.existsSync(HOMEBREW_JDK21) ? HOMEBREW_JDK21 : process.env.JAVA_HOME;
if (!javaHome) {
  console.error('android-build: no JDK found — run `brew install openjdk@21` or set JAVA_HOME');
  process.exit(1);
}

const androidHome =
  process.env.ANDROID_HOME || path.join(process.env.HOME || '', 'Library/Android/sdk');

console.log(`android-build: staging to ${STAGE} (APFS)…`);
fs.mkdirSync(path.join(STAGE, 'node_modules/@capacitor'), { recursive: true });
run(
  `rsync -a --delete --exclude '._*' --exclude '.DS_Store' --exclude 'build/' --exclude '.gradle/' ` +
    `'${path.join(ROOT, 'android')}/' '${path.join(STAGE, 'android')}/'`
);
run(
  `rsync -a --delete --exclude '._*' ` +
    `'${path.join(ROOT, 'node_modules/@capacitor')}/' '${path.join(STAGE, 'node_modules/@capacitor')}/'`
);

console.log(`android-build: gradlew assembleDebug (JAVA_HOME=${javaHome})…`);
try {
  run('./gradlew assembleDebug --no-daemon -q', {
    cwd: path.join(STAGE, 'android'),
    env: { ...process.env, JAVA_HOME: javaHome, ANDROID_HOME: androidHome },
  });
} catch {
  process.exit(1);
}

const apk = path.join(STAGE, 'android/app/build/outputs/apk/debug/app-debug.apk');
const mb = (fs.statSync(apk).size / 1048576).toFixed(1);
console.log(`\nandroid-build: APK ready (${mb} MB)\n  ${apk}\n  install: adb install -r "${apk}"`);
