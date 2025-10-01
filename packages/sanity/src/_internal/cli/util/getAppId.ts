import {type CliConfig} from '@sanity/cli'
import chalk from 'chalk'

interface Options {
  cliConfig?: CliConfig
  output?: {warn: (message: string) => void}
}

/**
 * Gets appId from sanity.cli.config.ts/js
 * @param options - Options
 * @returns boolean
 * @internal
 */
export function getAppId({cliConfig, output}: Options): string | undefined {
  const hasOldCliConfigFlag =
    cliConfig && 'app' in cliConfig && cliConfig.app && 'id' in cliConfig.app

  const hasNewCliConfigFlag =
    cliConfig &&
    'deployment' in cliConfig &&
    cliConfig.deployment &&
    'appId' in cliConfig.deployment

  if (hasOldCliConfigFlag && hasNewCliConfigFlag) {
    throw new Error(
      'Found both `app.id` (deprecated) and `deployment.appId` in sanity.cli.js. Please remove the deprecated `app.id`.',
    )
  }
  const appId = hasOldCliConfigFlag ? cliConfig.app?.id : cliConfig?.deployment?.appId

  if (hasOldCliConfigFlag) {
    output?.warn(
      chalk.yellow(
        `The \`app.id\` config has moved to \`deployment.appId\`.
Please update \`sanity.cli.ts\` or \`sanity.cli.js\` and move:
${chalk.red(`app: {id: "${appId}", ... }`)}
to
${chalk.green(`deployment: {appId: "${appId}", ... }`)})
`,
      ),
    )
  }
  return appId
}
