import chalk from 'chalk'
import {sortBy, cloneDeep} from 'lodash'
import type {
  CliCommandArguments,
  CliCommandContext,
  CliCommandDefinition,
  CliConfig,
  CliCommandGroupDefinition,
  CliOutputter,
  CliPrompter,
  CommandRunnerOptions,
  ResolvedCliCommand,
  SanityJson,
} from './types'
import {prompt as cliPrompter} from './prompters/cliPrompter'
import cliOutputter from './outputters/cliOutputter'
import {getClientWrapper} from './util/clientWrapper'
import {getNoSuchCommandText} from './util/noSuchCommandText'
import {CliConfigResult} from './util/getCliConfig'
import {isCommandGroup} from './util/isCommandGroup'
import {baseCommands} from './commands'
import {debug} from './debug'
import {
  generateCommandsDocumentation,
  generateCommandDocumentation,
} from './util/generateCommandsDocumentation'
import {cliPackageManager, getYarnStub} from './packageManager'

interface Handlers {
  outputter: CliOutputter
  prompter: CliPrompter
}

type CommandOrGroup = CliCommandDefinition | CliCommandGroupDefinition

export class CommandRunner {
  public handlers: Handlers
  public commands: CommandOrGroup[]
  public commandGroups: Record<string, (CliCommandDefinition | CliCommandGroupDefinition)[]>

  constructor(handlers: Handlers, commands: CommandOrGroup[] = baseCommands) {
    this.handlers = handlers
    this.commands = sortBy(commands, 'name')
    this.commandGroups = {}
    for (const cmd of this.commands) {
      const group = ('group' in cmd && cmd.group) || 'default'
      this.commandGroups[group] = this.commandGroups[group] || []
      this.commandGroups[group].push(cmd)
    }

    if (!handlers.outputter || !handlers.prompter) {
      throw new Error('`prompter` and `outputter` handlers must be defined')
    }
  }

  async runCommand(
    commandOrGroup: string,
    args: CliCommandArguments,
    options: CommandRunnerOptions,
  ): Promise<unknown> {
    if (!commandOrGroup) {
      this.handlers.outputter.print(generateCommandsDocumentation(this.commandGroups))
      return Promise.resolve()
    }

    // We might modify arguments for easier parsing in subcommand
    const cmdArgs = cloneDeep(args)
    const subCommandName = args.argsWithoutOptions[0]

    const commandInfo = this.resolveCommand(commandOrGroup, subCommandName)
    if (!commandInfo) {
      throw new Error(getNoSuchCommandText(commandOrGroup, subCommandName, this.commandGroups))
    }

    const command = commandInfo.command

    if (!isCommandGroup(command) && command.group && command.group !== 'default') {
      cmdArgs.argsWithoutOptions = args.argsWithoutOptions.slice(1)
    }

    const output = this.handlers.outputter
    const prompt = this.handlers.prompter

    const {apiClient, cliConfig, ...commandOptions} = options

    const context: CliCommandContext = {
      output,
      prompt,
      apiClient,
      chalk,
      cliPackageManager,
      ...commandOptions,
      commandRunner: this,
      yarn: getYarnStub({output, workDir: commandOptions.workDir}),
      ...getVersionedContextParams(cliConfig),
    }

    if (isCommandGroup(command)) {
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

  resolveCommand(commandOrGroup: string, subCommandName?: string): ResolvedCliCommand | null {
    // First, see if there is a group with the given name, if a subcommand is provided
    if (this.commandGroups[commandOrGroup] && subCommandName) {
      debug(`Found group for name "${commandOrGroup}", resolving subcommand`)

      const subCommand = this.resolveSubcommand(
        this.commandGroups[commandOrGroup],
        subCommandName,
        commandOrGroup,
      )

      debug(
        subCommand
          ? `Subcommand resolved to "${subCommand.commandName}"`
          : `Subcommand with name "${subCommandName}" not found`,
      )

      return subCommand
    }

    // No group? See if there's a command within the default group
    debug(`No group found with name "${commandOrGroup}", looking for command`)
    const command = this.commandGroups.default.find((cmd) => cmd.name === commandOrGroup)
    if (command) {
      debug(`Found command in default group with name "${commandOrGroup}"`)
      return {
        command: command,
        commandName: command.name,
        parentName: 'default',
        isGroup: false,
        isCommand: true,
      }
    }

    debug(`No default command with name "${commandOrGroup}" found, giving up`)
    return null
  }

  resolveSubcommand(
    group: (CliCommandDefinition | CliCommandGroupDefinition)[],
    subCommandName: string,
    parentGroupName: string,
  ): ResolvedCliCommand | null {
    if (!subCommandName) {
      return null
    }

    const subCommand = group.find((cmd) => cmd.name === subCommandName)
    if (!subCommand) {
      throw new Error(getNoSuchCommandText(subCommandName, parentGroupName, this.commandGroups))
    }

    return {
      command: subCommand,
      commandName: subCommandName,
      parentName: parentGroupName,
      isGroup: false,
      isCommand: true,
    }
  }

  resolveHelpForGroup(): ResolvedCliCommand {
    const command = this.commandGroups.default.find((cmd) => cmd.name === 'help')
    if (!command) {
      throw new Error('Failed to find default `help` command')
    }

    return {
      command,
      commandName: 'help',
      isGroup: false,
      isCommand: true,
    }
  }
}

export function getCliRunner(commands: CommandOrGroup[]): CommandRunner {
  return new CommandRunner(
    {
      outputter: cliOutputter,
      prompter: cliPrompter,
    },
    commands,
  )
}

function getVersionedContextParams(
  cliConfig: CliConfigResult | null,
):
  | {sanityMajorVersion: 2; cliConfig?: SanityJson; cliConfigPath?: string}
  | {sanityMajorVersion: 3; cliConfig?: CliConfig; cliConfigPath?: string} {
  return cliConfig?.version === 2
    ? {
        sanityMajorVersion: 2,
        cliConfig: cliConfig?.config || undefined,
        cliConfigPath: cliConfig?.path || undefined,
      }
    : {
        sanityMajorVersion: 3,
        cliConfig: cliConfig?.config || undefined,
        cliConfigPath: cliConfig?.path || undefined,
      }
}
