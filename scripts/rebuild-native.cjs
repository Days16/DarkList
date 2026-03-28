#!/usr/bin/env node
// Rebuild better-sqlite3 against the Electron runtime.
// Run this once after npm install: node scripts/rebuild-native.js
const { execSync } = require('child_process')
const path = require('path')

const electronVersion = require('../node_modules/electron/package.json').version
const prebuildInstall = path.join(__dirname, '../node_modules/prebuild-install/bin.js')
const bsqlite3 = path.join(__dirname, '../node_modules/better-sqlite3')

console.log(`Rebuilding better-sqlite3 for Electron ${electronVersion}…`)
try {
  execSync(
    `node "${prebuildInstall}" --runtime=electron --target=${electronVersion} --platform=${process.platform} --arch=${process.arch}`,
    { cwd: bsqlite3, stdio: 'inherit' }
  )
  console.log('Done.')
} catch {
  console.error('Prebuilt not found, falling back to node-gyp compile…')
  execSync('node-gyp rebuild --release', { cwd: bsqlite3, stdio: 'inherit' })
}
