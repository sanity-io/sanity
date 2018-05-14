import {find} from 'lodash'
import semver from 'semver'
import chalk from 'chalk'
import {version} from '../../package.json'
import dynamicRequire from './dynamicRequire'
import getUpgradeCommand from './getUpgradeCommand'

export default (baseCommands, corePath, options = {}) => {
  if (!corePath) {
    return baseCommands
  }

  const {cwd, workDir} = options
  const core = dynamicRequire(corePath)

  if (
    core.requiredCliVersionRange &&
    !semver.satisfies(semver.coerce(version), core.requiredCliVersionRange)
  ) {
    const upgradeCmd = chalk.yellow(getUpgradeCommand({cwd, workDir}))
    /* eslint-disable no-console, no-process-exit */
    console.error(
      `The version of @sanity/core installed in this project requires @sanity/cli @ ${chalk.green(
        core.requiredCliVersionRange
      )}. Currently installed version is ${chalk.red(
        version
      )}.\n\nPlease upgrade by running:\n\n  ${upgradeCmd}\n\n`
    )
    process.exit(1)
    /* eslint-enable no-console, no-process-exit */
  }

  const merged = baseCommands.concat(core.commands).map(addDefaultGroup)

  // Remove duplicate commands when within the same group,
  // the last defined commands with the given name wins
  return merged.reverse().reduce((cmds, cmd) => {
    if (!find(cmds, {name: cmd.name, group: cmd.group})) {
      cmds.push(cmd)
    }
    return cmds
  }, [])
}

function addDefaultGroup(cmd) {
  if (!cmd.group) {
    cmd.group = 'default'
  }

  return cmd
}
