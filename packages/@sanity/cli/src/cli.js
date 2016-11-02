#!/usr/bin/env node
import 'babel-polyfill'
import chalk from 'chalk'
import parseArguments from './util/parseArguments'
import mergeCommands from './util/mergeCommands'
import {getCliRunner} from './CommandRunner'
import baseCommands from './commands'

module.exports = function runCli(options) {
  const args = parseArguments()
  const core = args.coreOptions
  const commands = mergeCommands(baseCommands, options.corePath)

  // Translate `sanity -h <command>` to `sanity help <command>`
  if (core.h || core.help) {
    const helpFor = core.h || core.help
    if (args.groupOrCommand || typeof helpFor === 'string') {
      args.argsWithoutOptions.unshift(helpFor, args.groupOrCommand)
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
