#!/usr/bin/env node
var cli = require.resolve('@sanity/cli/bin/sanity')
var child_process = require('child_process')
child_process.fork(cli, ['init'], {
  stdio: 'inherit'
})
