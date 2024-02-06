import {type CliCommandContext} from '@sanity/cli'

interface EnsureCwdIsProjectRootApi {
  cwdIsProjectRoot: boolean
  printCwdProjectRootWarning: () => void
}

export function ensureCwdIsProjectRoot({
  cliConfig,
  output,
  chalk,
}: CliCommandContext): EnsureCwdIsProjectRootApi {
  return {
    cwdIsProjectRoot: typeof cliConfig !== 'undefined',
    printCwdProjectRootWarning() {
      output.warn(
        chalk.yellow(
          [
            'No CLI configuration file (sanity.cli.ts/sanity.cli.js) found.',
            'This command must be run from the root of a Studio project.',
          ].join('\n'),
        ),
      )
    },
  }
}
