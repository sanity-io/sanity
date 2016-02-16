#!/usr/bin/env node
import yargs from 'yargs'
import {getCliRunner} from './CommandRunner'
import getProjectDefaults from './util/getProjectDefaults'
import checkForUpdates from './util/checkForUpdates'
import commands from './commands'
import pkg from '../package.json'

const updateCheck = checkForUpdates()
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

  getProjectDefaults(process.cwd())
    .then(defaults => cmdRunner.runCommand(
      cmdName,
      Object.assign({defaults, cwd: process.cwd()}, argv)
    ))
    .then(() => outputVersionCheckResult())
    .catch(err => console.error(err.stack)) // eslint-disable-line no-console
}

function outputVersionCheckResult() {
  updateCheck.then(res => {
    if (res.skip || res.atLatest) {
      return
    }

    console.log(`[Sanity] You are using @sanity/cli v${res.current}, latest version is ${res.latest}`) // eslint-disable-line no-console
  })
}
