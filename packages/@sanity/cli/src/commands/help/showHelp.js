import find from 'lodash/find'
import {
  generateCommandsDocumentation,
  generateCommandDocumentation
} from '../../util/generateCommandsDocumentation'

export default (args, context) => {
  const [command, subCommand] = args.argsWithoutOptions
  const commandGroups = context.commandRunner.commandGroups

  // Do we have a top-level command with this name?
  const defaultCommand = commandGroups.default[command]

  // How about a subcommand within a group?
  const group = command && commandGroups[command]
  const groupCommand = subCommand && group && find(group, {name: subCommand})

  // Or just the top level of a group?
  const isGroup = group && !groupCommand

  context.output.print(!command || isGroup
    // Whole group of commands
    ? generateCommandsDocumentation(commandGroups, command)
    // Single command/subcommand
    : generateCommandDocumentation(defaultCommand || groupCommand, command, subCommand)
  )
}
