#!/usr/bin/env node
const path = require('path')
const childProcess = require('child_process')
const resolvePkg = require('resolve-pkg')

const args = process.argv.slice(2)
const cliDir = resolvePkg('@sanity/cli', {cwd: __dirname})
const cli = path.join(cliDir, 'bin', 'sanity')
childProcess.spawn('node', [cli, 'init', '', ...args.concat('--from-create')], {stdio: 'inherit'})
