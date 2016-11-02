import path from 'path'
import groupBy from 'lodash/groupBy'
import sortBy from 'lodash/sortBy'
import {loadJson} from '@sanity/util/lib/safeJson'
import lazyRequire from '@sanity/util/lib/lazyRequire'
import defaultCommands from './commands'
import cliPrompter from './prompters/cliPrompter'
import cliOutputter from './outputters/cliOutputter'
import clientWrapper from './util/clientWrapper'
import {generateCommandsDocumentation} from './util/generateCommandsDocumentation'
import noSuchCommandText from './util/noSuchCommandText'
import debug from './debug'

const yarn = lazyRequire(require.resolve('./actions/yarn/yarnWithProgress'))

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

    const subCommand = args.argsWithoutOptions[0]
    const group = this.commandGroups[commandOrGroup] || this.commandGroups.default
    const command = group.find(cmdHasName(subCommand)) || group.find(cmdHasName(commandOrGroup))
    const isDefaultGroup = group === this.commandGroups.default

    // The group exists and is not "default", but the subcommand doesn't exist
    if (!command && subCommand && !isDefaultGroup) {
      throw new Error(noSuchCommandText(subCommand, commandOrGroup))
    }

    // Group of commands
    if (!isDefaultGroup && !subCommand) {
      this.handlers.outputter.print(
        generateCommandsDocumentation(
          this.commandGroups,
          commandOrGroup
        )
      )
      return Promise.resolve()
    }

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
      yarn,
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
