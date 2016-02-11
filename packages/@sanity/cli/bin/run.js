#!/usr/bin/env node
require('babel-register')
require('./cli.js').default.parse(process.argv)
