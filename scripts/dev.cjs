#!/usr/bin/env node
// ELECTRON_RUN_AS_NODE must be fully absent (not just empty/0) for Electron to work.
// Delete it here so child processes inherit the clean env.
delete process.env.ELECTRON_RUN_AS_NODE

const { spawnSync } = require('child_process')
const path = require('path')
// Point directly to the electron-vite ESM CLI
const cli = path.resolve(__dirname, '../node_modules/electron-vite/bin/electron-vite.js')

const r = spawnSync(process.execPath, [cli, 'dev'], {
  stdio: 'inherit',
  env: process.env
})
process.exit(r.status ?? 0)
