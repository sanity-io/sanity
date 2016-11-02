import path from 'path'
import groupBy from 'lodash/groupBy'
import sortBy from 'lodash/sortBy'
import defaultCommands from './commands'
import cliPrompter from './prompters/cliPrompter'
import cliOutputter from './outputters/cliOutputter'
import clientWrapper from './util/clientWrapper'
import {loadJson} from './util/safeJson'
import generateCommandsDocumentation from './util/generateCommandsDocumentation'
import noSuchCommandText from './util/noSuchCommandText'
import debug from './debug'

const cmdHasName = cmdName => {
  return cmd => cmd.name === cmdName
}

const cmdByGroup = cmd => cmd.group || 'default'

export default class CommandRunner {
  constructor(handlers = {}, commands = defaultCommands) {
    this.handlers = handlers
    this.commands = sortBy(commands, 'name')
    this.commandGroups = groupBy(this.commands, cmdByGroup)

    if (!handlers.outputter || !handlers.prompter) {
      throw new Error('`prompter` and `outputter` handlers must be defined')
    }
  }

  async runCommand(commandOrGroup, args, options) {
    if (!commandOrGroup) {
      this.handlers.outputter.print(generateCommandsDocumentation(this.commandGroups))
      return Promise.resolve()
    }

    const command = (
      this.commandGroups[commandOrGroup]
      || this.commandGroups.default.find(cmdHasName(commandOrGroup))
    )

    if (!command) {
      throw new Error(noSuchCommandText(commandOrGroup))
    }

    const output = this.handlers.outputter
    const {prompt} = this.handlers.prompter

    const manifestPath = path.join(options.workDir, 'sanity.json')
    debug(`Reading "${manifestPath}"`)

    const manifest = await loadJson(manifestPath)
    const apiClient = clientWrapper(manifest, manifestPath)

    const context = {
      output,
      prompt,
      apiClient,
      ...options,
      commandRunner: this
    }

    debug(`Running command "${command.name}"`)
    return command.action(args, context)
  }
}

export function getCliRunner(...args) {
  return new CommandRunner({
    outputter: cliOutputter,
    prompter: cliPrompter
  }, ...args)
}
