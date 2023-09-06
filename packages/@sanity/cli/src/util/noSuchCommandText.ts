import leven from 'leven'
import chalk from 'chalk'
import {CliCommandDefinition, CliCommandGroupDefinition} from '../types'

const commonMistakes: Record<string, string | undefined> = {get: 'list'}
const levenThreshold = 3
const coreCommands = [
  'build',
  'check',
  'configcheck',
  'cors',
  'dataset',
  'deploy',
  'dev',
  'documents',
  'exec',
  'graphql',
  'typegen',
  'hook',
  'preview',
  'start',
  'undeploy',
  'uninstall',
  'users',
]

const helpText = `
Run the command again within a Sanity project directory, where "sanity"
is installed as a dependency.`

export function getNoSuchCommandText(
  cmdName: string,
  parentGroupName?: string | null,
  groups?: Record<string, (CliCommandDefinition | CliCommandGroupDefinition)[]>,
): string {
  if (parentGroupName && groups && groups[parentGroupName]) {
    return suggestCommand(cmdName, groups[parentGroupName], parentGroupName)
  }

  const isCoreCommand = coreCommands.includes(cmdName)
  if (isCoreCommand) {
    return `Command "${cmdName}" is not available outside of a Sanity project context.${helpText}`
  }

  return suggestCommand(cmdName, groups ? groups.default : [])
}

function suggestCommand(
  cmdName: string,
  group: (CliCommandDefinition | CliCommandGroupDefinition)[],
  parentGroupName: string | null = null,
) {
  // Try to find something similar
  const closest = group
    .map((command) => leven(command.name, cmdName))
    .reduce(
      (current: {index: number; distance: number}, distance: number, index: number) =>
        distance < current.distance ? {index, distance} : current,
      {index: 0, distance: +Infinity},
    )

  // Given we are within our target threshold, suggest the command
  let suggestCmd = ''
  if (closest.distance <= levenThreshold) {
    const cmdCandidate = group[closest.index]
    suggestCmd = cmdCandidate.name
  }

  // Is this a common mistake that we can suggest an alias for?
  const alternative = commonMistakes[cmdName]
  if (!suggestCmd && alternative) {
    suggestCmd = alternative
  }

  const input = chalk.cyan(`"${cmdName}"`)
  const suggest = chalk.green(`"${suggestCmd}"`)
  const help = chalk.cyan('"sanity --help"')

  const didYouMean = suggestCmd ? `Did you mean ${suggest}? ` : ' '
  return parentGroupName
    ? `${input} is not a subcommand of "sanity ${parentGroupName}". ${didYouMean}See ${help}`
    : `${input} is not a sanity command. ${didYouMean}See ${help}`
}
