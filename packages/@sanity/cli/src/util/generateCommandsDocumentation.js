import {padEnd} from 'lodash'
import noSuchCommandText from './noSuchCommandText'

/**
 * Generate documentation for all commands within a given group
 */
export function generateCommandsDocumentation(commandGroups, group = 'default') {
  const commandGroup = commandGroups[group]

  if (!commandGroup) {
    throw new Error(noSuchCommandText(group))
  }

  // Find the maximum length of a command name, so we can pad the descriptions
  const cmdLength = commandGroup.reduce((max, cmd) => Math.max(cmd.name.length, max), 0)
  const prefix = group === 'default' ? '' : ` ${group}`

  const rows = [
    `usage: sanity${prefix} [-v|--version] [-d|--debug] [-h|--help] <command> [<args>]`,
    '',
    'Commands:',
  ].concat(commandGroup.map(cmd =>
    `   ${padEnd(cmd.name, cmdLength + 1)} ${cmd.description}`
  )).concat([
    '',
    `See 'sanity help${prefix} <command>' for specific information on a subcommand.`
  ])

  return rows.join('\n')
}

/**
 * Generate documentation for a single command within the given group
 */
export function generateCommandDocumentation(command, group, subCommand) {
  if (!command) {
    throw new Error(subCommand
      ? `"${subCommand}" is not a subcommand of "${group}". See 'sanity help ${group}'`
      : noSuchCommandText(group)
    )
  }

  const cmdParts = [group || command.name, subCommand].filter(Boolean).join(' ')
  return [
    `usage: sanity ${cmdParts} ${command.signature}`,
    '',
    `   ${command.description}`,
    '',
    (command.helpText || '').trim()
  ].join('\n')
}
