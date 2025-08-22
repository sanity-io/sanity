import {type CliConfig} from '@sanity/cli'
import chalk from 'chalk'

interface AutoUpdateSources {
  flags: {['auto-updates']?: boolean}
  cliConfig?: CliConfig
  output?: {warn: (message: string) => void}
}

/**
 * Compares parameters from various sources to determine whether or not to auto-update
 * @param sources - The sources of the auto-update parameter, including CLI flags and the CLI config
 * @returns boolean
 * @internal
 */
export function shouldAutoUpdate({flags, cliConfig, output}: AutoUpdateSources): boolean {
  // cli flags (for example, '--no-auto-updates') should take precedence
  if ('auto-updates' in flags) {
    if (output) {
      const flagUsed = flags['auto-updates'] ? '--auto-updates' : '--no-auto-updates'
      output.warn(
        chalk.yellow(
          `The ${flagUsed} flag is deprecated for \`deploy\` and \`build\` commands. Set the \`autoUpdates\` option in \`sanity.cli.ts\` or \`sanity.cli.js\` instead.`,
        ),
      )
    }
    return Boolean(flags['auto-updates'])
  }

  const hasOldCliConfigFlag = cliConfig && 'autoUpdates' in cliConfig
  const hasNewCliConfigFlag =
    cliConfig &&
    'deployment' in cliConfig &&
    cliConfig.deployment &&
    'autoUpdates' in cliConfig.deployment

  if (hasOldCliConfigFlag && hasNewCliConfigFlag) {
    throw new Error(
      'Found both `autoUpdates` (deprecated) and `deployment.autoUpdates` in sanity.cli.js. Please remove the deprecated top level `autoUpdates` config.',
    )
  }
  if (hasOldCliConfigFlag) {
    output?.warn(
      chalk.yellow(
        `The \`autoUpdates\` config has moved to \`deployment.autoUpdates\`.
Please update \`sanity.cli.ts\` or \`sanity.cli.js\` and make the following change:
${chalk.red(`-  autoUpdates: ${cliConfig.autoUpdates},`)}
${chalk.green(`+  deployment: {autoUpdates: ${cliConfig.autoUpdates}}}`)}
`,
      ),
    )
  }
  return Boolean(hasOldCliConfigFlag ? cliConfig.autoUpdates : cliConfig?.deployment?.autoUpdates)
}
