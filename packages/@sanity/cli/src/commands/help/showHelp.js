import find from 'lodash/find'
import {
  generateCommandsDocumentation,
  generateCommandDocumentation
} from '../../util/generateCommandsDocumentation'

export default (args, context) => {
  const [command, subCommand] = args.argsWithoutOptions
  const commandGroups = context.commandRunner.commandGroups

  // Attempt to find a subcommand, if one is provided
  const targetGroup = subCommand ? commandGroups[command] : commandGroups.default
  const actualCommand = (command || subCommand)
    && find(targetGroup || [], {name: subCommand || command})

  context.output.print(command
    // Single command/subcommand
    ? generateCommandDocumentation(actualCommand, command, subCommand)
    // Whole group of commands
    : generateCommandsDocumentation(commandGroups, command)
  )
}
