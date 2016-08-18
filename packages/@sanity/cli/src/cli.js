#!/usr/bin/env node
import yargs from 'yargs'
import chalk from 'chalk'
import updateNotifier from 'update-notifier'
import {resolveProjectRoot} from '@sanity/resolver'
import {getCliRunner} from './CommandRunner'
import commands from './commands'
import pkg from '../package.json'

updateNotifier({pkg}).notify()

const program = yargs
  .version(pkg.version)
  .demand(1)
  .help('h').alias('h', 'help')

commands.forEach(cmd => program.command(cmd.signature, cmd.description))

export function run(args) {
  const argv = program.parse(args)
  const cmdName = argv._[0]
  const cmdRunner = getCliRunner()

  if (cmdName === 'help') {
    return program.showHelp()
  }

  return resolveProjectRoot({basePath: process.cwd()})
    .then(dir => Object.assign({rootDir: dir || process.cwd()}, argv))
    .then(options => cmdRunner.runCommand(cmdName, options))
    .catch(err => {
      console.error(chalk.red(err.stack)) // eslint-disable-line no-console
      process.exit(err.code || 1) // eslint-disable-line no-process-exit
    })
}
