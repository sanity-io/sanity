import {find} from 'lodash'
import semver from 'semver'
import chalk from 'chalk'
import type {CliCommandDefinition, CliCommandGroupDefinition, SanityCore} from '../types'
import {dynamicRequire} from './dynamicRequire'
import {getUpgradeCommand} from './getUpgradeCommand'
import {isCommandGroup} from './isCommandGroup'

export interface MergeOptions {
  cwd: string
  workDir: string
  cliVersion: string
}

export function mergeCommands(
  baseCommands: (CliCommandDefinition | CliCommandGroupDefinition)[],
  corePath: string | undefined,
  options: MergeOptions
): (CliCommandDefinition | CliCommandGroupDefinition)[] {
  if (!corePath) {
    return baseCommands
  }

  const {cwd, workDir, cliVersion} = options
  const core = dynamicRequire<SanityCore>(corePath)
  const coercedCliVersion = semver.coerce(cliVersion) || ''

  if (
    core.requiredCliVersionRange &&
    !semver.satisfies(coercedCliVersion, core.requiredCliVersionRange)
  ) {
    const upgradeCmd = chalk.yellow(getUpgradeCommand({cwd, workDir}))
    /* eslint-disable no-console, no-process-exit */
    console.error(
      `The version of @sanity/core installed in this project requires @sanity/cli @ ${chalk.green(
        core.requiredCliVersionRange
      )}. Currently installed version is ${chalk.red(
        cliVersion
      )}.\n\nPlease upgrade by running:\n\n  ${upgradeCmd}\n\n`
    )
    process.exit(1)
    /* eslint-enable no-console, no-process-exit */
  }

  const merged = baseCommands.concat(core.commands).map(addDefaultGroup)

  // Remove duplicate commands when within the same group,
  // the last defined commands with the given name wins
  return merged.reverse().reduce((cmds, cmd) => {
    const group = isCommandGroup(cmd) ? undefined : cmd.group
    if (!find(cmds, {name: cmd.name, group})) {
      cmds.push(cmd)
    }
    return cmds
  }, [] as (CliCommandDefinition | CliCommandGroupDefinition)[])
}

function addDefaultGroup(
  cmd: CliCommandDefinition | CliCommandGroupDefinition
): CliCommandDefinition | CliCommandGroupDefinition {
  if (!isCommandGroup(cmd) && !cmd.group) {
    cmd.group = 'default'
  }

  return cmd
}
