#!/usr/bin/env node
import 'babel-polyfill'
import chalk from 'chalk'
import mergeCommands from './util/mergeCommands'
import {getCliRunner} from './CommandRunner'
import baseCommands from './commands'
import pkg from '../package.json'

module.exports = function runCli(args, options) {
  const core = args.coreOptions
  const commands = mergeCommands(baseCommands, options.corePath)

  if (core.v || core.version) {
    console.log(`${pkg.name} version ${pkg.version}`) // eslint-disable-line no-console
    process.exit() // eslint-disable-line no-process-exit
  }

  // Translate `sanity -h <command>` to `sanity help <command>`
  if (core.h || core.help) {
    if (args.groupOrCommand) {
      args.argsWithoutOptions.unshift(args.groupOrCommand)
    }

    args.groupOrCommand = 'help'
  }

  Promise.resolve(getCliRunner(commands))
    .then(cliRunner => cliRunner.runCommand(args.groupOrCommand, args, options))
    .catch(err => {
      const debug = core.d || core.debug
      const error = (debug && err.details) || err
      console.error(chalk.red(debug ? error.stack : error.message)) // eslint-disable-line no-console
      process.exit(error.code || 1) // eslint-disable-line no-process-exit
    })
}
