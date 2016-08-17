#!/usr/bin/env node
import yargs from 'yargs'
import {resolveProjectRoot} from '@sanity/resolver'
import chalk from 'chalk'
import {getCliRunner} from './CommandRunner'
import checkForUpdates from './util/checkForUpdates'
import commands from './commands'
import pkg from '../package.json'

const rootDir = resolveProjectRoot({
  basePath: process.cwd(),
  sync: true
}) || process.cwd()

const updateCheck = checkForUpdates({rootDir})
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

  cmdRunner.runCommand(cmdName, Object.assign({rootDir}, argv))
    .then(() => outputVersionCheckResult())
    .catch(err => {
      console.error(chalk.red(err.stack)) // eslint-disable-line no-console
      process.exit(err.code || 1) // eslint-disable-line no-process-exit
    })
}

function outputVersionCheckResult() {
  updateCheck.then(res => {
    if (res.skip || res.atLatest) {
      return
    }

    console.log(`[Sanity] You are using @sanity/cli v${res.current}, latest version is ${res.latest}`) // eslint-disable-line no-console
  })
}
