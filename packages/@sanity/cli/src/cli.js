#!/usr/bin/env node
import yargs from 'yargs'
import {getCliRunner} from './CommandRunner'
import getProjectDefaults from './util/getProjectDefaults'
import commands from './commands'
import pkg from '../package.json'

const program = yargs
  .version(pkg.version)
  .demand(1)
  .help('h').alias('h', 'help')

commands.forEach(cmd => program.command(cmd.signature, cmd.description))

export function run(args) {
  const argv = program.parse(args)
  const cmdName = argv._[0]
  const cmdRunner = getCliRunner()

  getProjectDefaults(process.cwd()).then(defaults => {
    cmdRunner.runCommand(
      cmdName,
      Object.assign({defaults, cwd: process.cwd()}, argv)
    )
  }).catch(err => {
    console.error(err.stack) // eslint-disable-line no-console
  })
}
