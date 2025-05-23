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

  if (cliConfig && 'autoUpdates' in cliConfig) {
    return Boolean(cliConfig.autoUpdates)
  }

  return false
}
