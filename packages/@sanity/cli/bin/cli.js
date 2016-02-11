#!/usr/bin/env node
import program from 'commander'
import pkg from '../package.json'

program
  .version(pkg.version)

export default program
