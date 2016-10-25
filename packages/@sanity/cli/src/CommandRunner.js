import path from 'path'
import fsp from 'fs-promise'
import defaultCommands from './commands'
import cliPrompter from './prompters/cliPrompter'
import cliOutputter from './outputters/cliOutputter'
import clientWrapper from './util/clientWrapper'
import debug from './debug'

const cmdHasName = cmdName => {
  return cmd => cmd.name === cmdName
}

export default class CommandRunner {
  constructor(handlers = {}, commands = defaultCommands) {
    this.handlers = handlers
    this.commands = commands

    if (!handlers.outputter || !handlers.prompter) {
      throw new Error('`prompter` and `outputter` handlers must be defined')
    }
  }

  runCommand(cmdName, options) {
    const subCommandName = options._[1]
    const baseCommand = this.commands.find(cmdHasName(cmdName))

    if (!baseCommand) {
      return Promise.reject(new Error('Command not found, run "sanity help"'))
    }

    const subCommand = subCommandName && (baseCommand.subCommands || []).find(cmdHasName(subCommandName))
    if (subCommandName && !subCommand) {
      return Promise.reject(new Error(`Subcommand "${subCommandName}" not found, run "sanity help"`))
    }

    const action = subCommand ? subCommand.action : baseCommand.handler
    const output = this.handlers.outputter
    const {prompt} = this.handlers.prompter

    const manifestPath = path.join(options.rootDir, 'sanity.json')
    debug(`Reading "${manifestPath}"`)
    return fsp.readJson(manifestPath)
      .catch(() => null)
      .then(manifest => {
        const apiClient = clientWrapper(manifest, manifestPath)

        debug(`Running command "${(subCommand || baseCommand).name}"`)
        return action({output, prompt, apiClient, options})
      })
  }
}

export function getCliRunner(cmds) {
  return new CommandRunner({
    outputter: cliOutputter,
    prompter: cliPrompter
  }, cmds)
}
