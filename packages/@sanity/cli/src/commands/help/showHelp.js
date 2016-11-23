import debug from '../../debug'
import noSuchCommandText from '../../util/noSuchCommandText'
import {
  generateCommandsDocumentation,
  generateCommandDocumentation
} from '../../util/generateCommandsDocumentation'

export default (args, context) => {
  const [commandName, subCommandName] = args.argsWithoutOptions
  const {commandGroups} = context.commandRunner

  if (!commandName) {
    debug('No command given to "help", showing generate Sanity CLI help')
    context.output.print(generateCommandsDocumentation(commandGroups))
    return
  }

  const defaultCommand = commandGroups.default.find(cmd => cmd.name === commandName)
  if (defaultCommand && !defaultCommand.isGroupRoot) {
    debug(`Found command in default group with name "${commandName}"`)
    context.output.print(generateCommandDocumentation(defaultCommand))
    return
  }

  const group = commandGroups[commandName]
  if (!subCommandName && !group) {
    debug(`No subcommand given, and we couldn't find a group with name "${group}"`)
    throw new Error(noSuchCommandText(commandName, null, commandGroups))
  }

  if (!subCommandName && group) {
    debug(`No subcommand given, but found group with name "${commandName}"`)
    context.output.print(generateCommandsDocumentation(commandGroups, commandName))
    return
  }

  if (subCommandName && !group) {
    debug(`Subcommand given, but couldn't find group with name "${commandName}"`)
    throw new Error(noSuchCommandText(subCommandName, commandName, commandGroups))
  }

  const subCommand = context.commandRunner.resolveSubcommand(group, subCommandName, commandName)
  if (!subCommand) {
    debug(`Subcommand given, but not found in group "${commandName}"`)
    throw new Error(noSuchCommandText(subCommandName, commandName, commandGroups))
  }

  context.output.print(generateCommandDocumentation(
    subCommand.command,
    commandName,
    subCommandName
  ))
}
