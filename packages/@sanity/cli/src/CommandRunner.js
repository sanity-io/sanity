import path from 'path'
import chalk from 'chalk'
import yarn from './actions/yarn/yarnWithProgress'
import {groupBy, sortBy, cloneDeep} from 'lodash'
import {loadJson} from '@sanity/util/lib/safeJson'
import {reduceConfig} from '@sanity/util'
import cliPrompter from './prompters/cliPrompter'
import cliOutputter from './outputters/cliOutputter'
import clientWrapper from './util/clientWrapper'
import noSuchCommandText from './util/noSuchCommandText'
import defaultCommands from './commands'
import debug from './debug'
import {
  generateCommandsDocumentation,
  generateCommandDocumentation
} from './util/generateCommandsDocumentation'

/* eslint-disable no-process-env */
const sanityEnv = process.env.SANITY_ENV
const environment = sanityEnv ? sanityEnv : process.env.NODE_ENV
/* eslint-enable no-process-env */

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

    // We might modify arguments for easier parsing in subcommand
    const cmdArgs = cloneDeep(args)
    const subCommandName = args.argsWithoutOptions[0]

    const commandInfo = this.resolveCommand(commandOrGroup, subCommandName)
    if (!commandInfo) {
      throw new Error(noSuchCommandText(commandOrGroup, subCommandName, this.commandGroups))
    }

    const command = commandInfo.command

    if (command.group && command.group !== 'default') {
      cmdArgs.argsWithoutOptions = args.argsWithoutOptions.slice(1)
    }

    const output = this.handlers.outputter
    const {prompt} = this.handlers.prompter

    const manifestPath = path.join(options.workDir, 'sanity.json')
    debug(`Reading "${manifestPath}"`)

    const baseManifest = await loadJson(manifestPath)
    const manifest = reduceConfig(baseManifest || {}, environment)
    const apiClient = clientWrapper(manifest, manifestPath)

    const context = {
      output,
      prompt,
      apiClient,
      yarn,
      chalk,
      ...options,
      commandRunner: this
    }

    if (command.isGroupRoot) {
      return context.output.print(generateCommandsDocumentation(this.commandGroups, command.name))
    }

    if (typeof command.action !== 'function') {
      const cmdName = command.name || commandOrGroup || '<unknown>'
      debug(`Command "${cmdName}" doesnt have a valid "action"-property, showing help`)
      const groupName = command.group && command.group !== 'default' ? command.group : null
      return context.output.print(generateCommandDocumentation(command, groupName, subCommandName))
    }

    debug(`Running command "${command.name}"`)
    return command.action(cmdArgs, context)
  }

  resolveCommand(commandOrGroup, subCommandName) {
    // First, see if there is a group with the given name
    if (this.commandGroups[commandOrGroup] && subCommandName) {
      debug(`Found group for name "${commandOrGroup}", resolving subcommand`)

      const subCommand = this.resolveSubcommand(
        this.commandGroups[commandOrGroup],
        subCommandName,
        commandOrGroup
      )

      debug(
        subCommand
          ? `Subcommand resolved to "${subCommand.commandName}"`
          : `Subcommand with name "${subCommandName}" not found`
      )

      return subCommand
    }

    // No group? See if there's a command within the default group
    debug(`No group found with name "${commandOrGroup}", looking for command`)
    const command = this.commandGroups.default.find(cmdHasName(commandOrGroup))
    if (command) {
      debug(`Found command in default group with name "${commandOrGroup}"`)
      return {
        command: command,
        commandName: command.name,
        parentName: 'default',
        isGroup: command.isGroupRoot || false,
        isCommand: true
      }
    }

    debug(`No default command with name "${commandOrGroup}" found, giving up`)
    return null
  }

  resolveSubcommand(group, subCommandName, parentGroupName) {
    if (!subCommandName) {
      return null
    }

    const subCommand = group.find(cmdHasName(subCommandName))
    if (!subCommand) {
      throw new Error(noSuchCommandText(subCommandName, parentGroupName, this.commandGroups))
    }

    return {
      command: subCommand,
      commandName: subCommandName,
      parentName: parentGroupName,
      isGroup: false,
      isCommand: true
    }
  }

  resolveHelpForGroup(groupName) {
    return {
      command: this.commandGroups.default.find(cmdHasName('help')),
      commandName: 'help',
      isGroup: false,
      isCommand: true
    }
  }
}

export function getCliRunner(...args) {
  return new CommandRunner(
    {
      outputter: cliOutputter,
      prompter: cliPrompter
    },
    ...args
  )
}
