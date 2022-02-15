import type {CliCommandDefinition} from '../../types'
import {debug} from '../../debug'
import {getNoSuchCommandText} from '../../util/noSuchCommandText'
import {isCommandGroup} from '../../util/isCommandGroup'
import {
  generateCommandsDocumentation,
  generateCommandDocumentation,
} from '../../util/generateCommandsDocumentation'

const showHelpAction: CliCommandDefinition['action'] = async (args, context) => {
  const [commandName, subCommandName] = args.argsWithoutOptions
  const {commandGroups} = context.commandRunner

  if (!commandName) {
    debug('No command given to "help", showing generate Sanity CLI help')
    context.output.print(generateCommandsDocumentation(commandGroups))
    return
  }

  const defaultCommand = commandGroups.default.find((cmd) => cmd.name === commandName)
  if (defaultCommand && !isCommandGroup(defaultCommand)) {
    debug(`Found command in default group with name "${commandName}"`)
    context.output.print(generateCommandDocumentation(defaultCommand))
    return
  }

  const group = commandGroups[commandName]
  if (!subCommandName && !group) {
    debug(`No subcommand given, and we couldn't find a group with name "${group}"`)
    throw new Error(getNoSuchCommandText(commandName, null, commandGroups))
  }

  if (!subCommandName && group) {
    debug(`No subcommand given, but found group with name "${commandName}"`)
    context.output.print(generateCommandsDocumentation(commandGroups, commandName))
    return
  }

  if (subCommandName && !group) {
    debug(`Subcommand given, but couldn't find group with name "${commandName}"`)
    throw new Error(getNoSuchCommandText(subCommandName, commandName, commandGroups))
  }

  const subCommand = context.commandRunner.resolveSubcommand(group, subCommandName, commandName)
  if (!subCommand) {
    debug(`Subcommand given, but not found in group "${commandName}"`)
    throw new Error(getNoSuchCommandText(subCommandName, commandName, commandGroups))
  }

  debug('Subcommand "%s" for group "%s" found, showing help', subCommandName, commandName)
  if (!isCommandGroup(subCommand.command)) {
    context.output.print(
      generateCommandDocumentation(subCommand.command, commandName, subCommandName)
    )
  }
}

export default showHelpAction
