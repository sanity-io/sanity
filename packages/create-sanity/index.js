#!/usr/bin/env node
const cli = require.resolve('@sanity/cli/bin/sanity')
const childProcess = require('child_process')

childProcess.fork(cli, ['init'], {stdio: 'inherit'})
