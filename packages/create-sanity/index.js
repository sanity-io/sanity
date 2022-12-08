#!/usr/bin/env node
const cli = require.resolve('@sanity/cli/bin/sanity')
const childProcess = require('child_process')

const args = process.argv.slice(2)
childProcess.spawn('node', [cli, 'init', '', ...args.concat('--from-create')], {stdio: 'inherit'})
