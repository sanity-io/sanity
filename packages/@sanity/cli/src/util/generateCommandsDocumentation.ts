import {padEnd} from 'lodash'
import {CliCommandDefinition, CliCommandGroupDefinition} from '../types'
import {getNoSuchCommandText} from './noSuchCommandText'

/**
 * Generate documentation for all commands within a given group
 */
export function generateCommandsDocumentation(
  commandGroups: Record<string, (CliCommandDefinition | CliCommandGroupDefinition)[]>,
  group = 'default',
): string {
  const commandGroup = commandGroups[group]
  const commands = commandGroup && commandGroup.filter((cmd) => !cmd.hideFromHelp)

  if (!commands || commands.length === 0) {
    throw new Error(getNoSuchCommandText(group))
  }

  // Find the maximum length of a command name, so we can pad the descriptions
  const cmdLength = commands.reduce((max, cmd) => Math.max(cmd.name.length, max), 0)
  const prefix = group === 'default' ? '' : ` ${group}`

  const rows = [
    `usage: sanity${prefix} [--default] [-v|--version] [-d|--debug] [-h|--help] <command> [<args>]`,
    '',
    'Commands:',
  ]
    .concat(commands.map((cmd) => `   ${padEnd(cmd.name, cmdLength + 1)} ${cmd.description}`))
    .concat(['', `See 'sanity help${prefix} <command>' for specific information on a subcommand.`])

  return rows.join('\n')
}

/**
 * Generate documentation for a single command within the given group
 */
export function generateCommandDocumentation(
  command: CliCommandDefinition,
  group?: string | null,
  subCommand?: string,
): string {
  if (!command) {
    throw new Error(
      subCommand
        ? `"${subCommand}" is not a subcommand of "${group}". See 'sanity help ${group}'`
        : getNoSuchCommandText(group || command),
    )
  }

  const cmdParts = [group || command.name, subCommand].filter(Boolean).join(' ')
  return [
    `usage: sanity ${cmdParts} ${command.signature}`,
    '',
    `   ${command.description}`,
    '',
    (command.helpText || '').trim(),
  ].join('\n')
}
