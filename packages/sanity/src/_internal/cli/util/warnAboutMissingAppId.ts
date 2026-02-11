import path from 'node:path'

import {type CliOutputter} from '@sanity/cli'
import chalk from 'chalk'
import logSymbols from 'log-symbols'

import {baseUrl} from './baseUrl'

export function warnAboutMissingAppId({
  appType,
  projectId,
  output,
  cliConfigPath,
}: {
  appType: 'studio' | 'app'
  output: CliOutputter
  projectId: string | undefined
  cliConfigPath: string | undefined
}) {
  const manageUrl = `${baseUrl}/manage${projectId ? `/project/${projectId}/studios` : ''}`
  const cliConfigFile = cliConfigPath ? path.basename(cliConfigPath) : 'sanity.cli.js'
  output.print(
    `${logSymbols.warning} No ${chalk.bold('appId')} configured. This ${appType} will auto-update to the ${chalk.green.bold('latest')} channel. To enable fine grained version selection, head over to ${chalk.cyan(manageUrl)} and add the appId to the ${chalk.bold('deployment')} section in ${chalk.bold(cliConfigFile)}.
        `,
  )
}
