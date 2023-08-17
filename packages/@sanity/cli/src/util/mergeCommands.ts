import {find} from 'lodash'
import semver from 'semver'
import chalk from 'chalk'
import type {
  CliCommandDefinition,
  CliCommandGroupDefinition,
  SanityCore,
  SanityModuleInternal,
} from '../types'
import {getCliUpgradeCommand} from '../packageManager'
import {dynamicRequire} from './dynamicRequire'
import {isCommandGroup} from './isCommandGroup'

export interface MergeOptions {
  cwd: string
  workDir: string
  cliVersion: string
}

export async function mergeCommands(
  baseCommands: (CliCommandDefinition | CliCommandGroupDefinition)[],
  corePath: string | undefined,
  options: MergeOptions,
): Promise<(CliCommandDefinition | CliCommandGroupDefinition)[]> {
  if (!corePath) {
    return baseCommands
  }

  const {cwd, workDir, cliVersion} = options
  const coreImport = dynamicRequire<SanityCore | SanityModuleInternal>(corePath)
  const coercedCliVersion = semver.coerce(cliVersion) || ''
  const moduleName = /@sanity[/\\]core/.test(corePath) ? '@sanity/core' : 'sanity'
  const core = 'cliProjectCommands' in coreImport ? coreImport.cliProjectCommands : coreImport

  // @todo the resolving of `sanity`/`@sanity/core` here might find global installs,
  // which can lead to incorrect versioning being reported. We should only run this
  // check if we are within a project dir, and even then only if it is not global
  /*
  if (
    core.requiredCliVersionRange &&
    !semver.satisfies(coercedCliVersion, core.requiredCliVersionRange)
  ) {
    const upgradeCmd = chalk.yellow(await getCliUpgradeCommand({cwd, workDir}))
    console.error(
      `The version of the \`${moduleName}\` installed in this project requires @sanity/cli @ ${chalk.green(
        core.requiredCliVersionRange
      )}. Currently installed version is ${chalk.red(
        cliVersion
      )}.\n\nPlease upgrade by running:\n\n  ${upgradeCmd}\n\n`
    )
    process.exit(1)
  }
  */

  const merged = baseCommands.concat(core.commands).map(addDefaultGroup)

  // Remove duplicate commands when within the same group,
  // the last defined commands with the given name wins
  return merged.reverse().reduce(
    (cmds, cmd) => {
      const group = isCommandGroup(cmd) ? undefined : cmd.group
      if (!find(cmds, {name: cmd.name, group})) {
        cmds.push(cmd)
      }
      return cmds
    },
    [] as (CliCommandDefinition | CliCommandGroupDefinition)[],
  )
}

function addDefaultGroup(
  cmd: CliCommandDefinition | CliCommandGroupDefinition,
): CliCommandDefinition | CliCommandGroupDefinition {
  if (!isCommandGroup(cmd) && !cmd.group) {
    cmd.group = 'default'
  }

  return cmd
}
