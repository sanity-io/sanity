import leven from 'leven'
import chalk from 'chalk'

const commonMistakes = {get: 'list'}
const levenThreshold = 3
const coreCommands = [
  'build',
  'check',
  'config',
  'dataset',
  'start',
  'install',
  'uninstall'
]

const helpText = `
Run the command again within a Sanity project directory, where "@sanity/core"
is installed as a dependency.`

export default (cmdName, parentGroupName, groups) => {
  if (parentGroupName && groups[parentGroupName]) {
    return suggestCommand(cmdName, groups[parentGroupName], parentGroupName)
  }

  const isCoreCommand = coreCommands.indexOf(cmdName) >= 0
  if (isCoreCommand) {
    return `"${cmdName}" is not available outside of a Sanity project context.${helpText}`
  }

  return suggestCommand(cmdName, groups.default)
}

function suggestCommand(cmdName, group, parentGroupName = null) {
  // Try to find something similar
  const closest = group
    .map(command => leven(command.name, cmdName))
    .reduce((current, distance, index) => {
      return distance < current.distance
        ? {index, distance}
        : current
    }, {index: null, distance: +Infinity})

  // Given we are within our target threshold, suggest the command
  let suggestCmd = ''
  if (closest.distance <= levenThreshold) {
    const cmdCandidate = group[closest.index]
    suggestCmd = cmdCandidate.name
  }

  // Is this a common mistake that we can suggest an alias for?
  if (!suggestCmd && commonMistakes[cmdName]) {
    suggestCmd = commonMistakes[cmdName]
  }

  const input = chalk.cyan(`"${cmdName}"`)
  const suggest = chalk.green(`"${suggestCmd}"`)
  const help = chalk.cyan('"sanity --help"')

  const didYouMean = suggestCmd ? `Did you mean ${suggest}? ` : ' '
  return parentGroupName
    ? `${input} is not a subcommand of "sanity ${parentGroupName}". ${didYouMean}See ${help}`
    : `${input} is not a sanity command. ${didYouMean}See ${help}`
}
