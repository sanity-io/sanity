import path from 'node:path'
import {type CliCommandContext} from '@sanity/cli'
import {isModernCliConfig} from './isModernCliConfig'

interface EnsureCwdIsProjectRootApi {
  cwdIsProjectRoot: boolean
  printCwdProjectRootWarning: () => void
}

export function ensureCwdIsProjectRoot(context: CliCommandContext): EnsureCwdIsProjectRootApi {
  const {cliConfig, output, chalk, workDir} = context

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

      if (isModernCliConfig(context) && context.projectRootPath) {
        output.print()
        output.print(
          chalk.grey(`We found a Studio project at ${chalk.cyan(context.projectRootPath)}.`),
        )
        output.print(
          chalk.grey(
            `Run ${chalk.cyan(
              `cd ${path.relative(workDir, context.projectRootPath)}`,
            )} to move there, and then try this command again.`,
          ),
        )
      }
    },
  }
}
