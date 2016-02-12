#!/usr/bin/env node
import yargs from 'yargs'
import {getCliRunner} from '../src/CommandRunner'
import commands from '../src/commands'
import pkg from '../package.json'

const program = yargs
  .version(pkg.version)
  .demand(1)
  .help('h').alias('h', 'help')

commands.forEach(cmd => program.command(cmd.signature, cmd.description))

const argv = program.argv

export function run() {
  const cmdName = argv._[0]
  const runner = getCliRunner()

  runner.runCommand(cmdName, argv)
}

export const parse = input => program.parse(input)
