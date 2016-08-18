import path from 'path'
import fsp from 'fs-promise'
import defaultCommands from './commands'
import cliPrompter from './prompters/cliPrompter'
import cliOutputter from './outputters/cliOutputter'
import clientWrapper from './util/clientWrapper'
import debug from './debug'

export default class CommandRunner {
  constructor(handlers = {}, commands = defaultCommands) {
    this.handlers = handlers
    this.commands = commands

    if (!handlers.outputter || !handlers.prompter) {
      throw new Error('`prompter` and `outputter` handlers must be defined')
    }
  }

  runCommand(cmdName, options) {
    const command = this.commands.find(cmd => cmd.name === cmdName)
    if (!command) {
      return Promise.reject(new Error(`Command "${cmdName}" not defined`))
    }

    const {print, error, spinner} = this.handlers.outputter
    const {prompt} = this.handlers.prompter

    const manifestPath = path.join(options.rootDir, 'sanity.json')
    debug(`Reading "${manifestPath}"`)
    return fsp.readJson()
      .catch(() => null)
      .then(manifest => {
        const apiClient = clientWrapper(manifest, manifestPath)

        debug(`Running command "${cmdName}"`)
        return command.action({print, error, spinner, prompt, apiClient, options})
      })
  }
}

export function getCliRunner(cmds) {
  return new CommandRunner({
    outputter: cliOutputter,
    prompter: cliPrompter
  }, cmds)
}
