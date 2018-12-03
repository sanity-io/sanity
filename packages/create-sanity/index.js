#!/usr/bin/env node
const cli = require.resolve('@sanity/cli/bin/sanity')
const child_process = require('child_process')

child_process.fork(cli, ['init'], {stdio: 'inherit'})
