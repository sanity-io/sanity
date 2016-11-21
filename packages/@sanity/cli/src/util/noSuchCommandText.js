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

export default (cmd, parent, groups) => {
  if (parent) {
    return suggestCommand(cmd, groups[parent], parent)
  }

  const isCoreCommand = coreCommands.indexOf(cmd) >= 0
  if (isCoreCommand) {
    return `"${cmd}" is not available outside of a Sanity project context.${helpText}`
  }

  return suggestCommand(cmd, groups.default)
}

function suggestCommand(cmd, group, parent = null) {
  // Try to find something similar
  const closest = group
    .map(command => leven(command.name, cmd))
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
  if (!suggestCmd && commonMistakes[cmd]) {
    suggestCmd = commonMistakes[cmd]
  }

  const input = chalk.yellow(`"${cmd}"`)
  const suggest = chalk.green(`"${suggestCmd}"`)
  const help = chalk.yellow('"sanity --help"')

  const didYouMean = suggestCmd ? `Did you mean ${suggest}? ` : ' '
  return parent
    ? `${input} is not a subcommand of "sanity ${parent}". ${didYouMean}See ${help}`
    : `${input} is not a sanity command. ${didYouMean}See ${help}`
}
