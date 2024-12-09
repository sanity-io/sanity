#!/usr/bin/env node
const childProcess = require('node:child_process')
const path = require('node:path')
const resolvePkg = require('resolve-pkg')

const args = process.argv.slice(2)
const cliDir = resolvePkg('@sanity/cli', {cwd: __dirname})
const cli = path.join(cliDir, 'bin', 'sanity')
childProcess.spawn('node', [cli, 'init', '', ...args.concat('--from-create')], {stdio: 'inherit'})
