import {type CliCommandArguments, type CliCommandContext} from '@sanity/cli'

import {debug as debugIt} from '../../debug'
import {deleteUserApplication, getUserApplication} from '../deploy/helpers'

const debug = debugIt.extend('undeploy')

export default async function undeployCoreAppAction(
  _: CliCommandArguments<Record<string, unknown>>,
  context: CliCommandContext,
): Promise<void> {
  const {apiClient, chalk, output, prompt, cliConfig} = context

  const client = apiClient({
    requireUser: true,
    requireProject: false,
  }).withConfig({apiVersion: 'v2024-08-01'})

  // Check that the project has a Core application ID
  let spinner = output.spinner('Checking application info').start()

  const userApplication = await getUserApplication({
    client,
    appId:
      cliConfig && '__experimental_coreAppConfiguration' in cliConfig
        ? cliConfig.__experimental_coreAppConfiguration?.appId
        : undefined,
  })

  spinner.succeed()

  if (!userApplication) {
    output.print('Your project has not been assigned a Core application ID')
    output.print(
      'or you do not have __experimental_coreAppConfiguration set in sanity.cli.js or sanity.cli.ts.',
    )
    output.print('Nothing to undeploy.')
    return
  }

  // Double-check
  output.print('')

  const url = `https://${chalk.yellow(userApplication.appHost)}.sanity.studio`
  const shouldUndeploy = await prompt.single({
    type: 'confirm',
    default: false,
    message: `This will undeploy ${url} and make it unavailable for your users.
  The hostname will be available for anyone to claim.
  Are you ${chalk.red('sure')} you want to undeploy?`.trim(),
  })

  if (!shouldUndeploy) {
    return
  }

  spinner = output.spinner('Undeploying application').start()
  try {
    await deleteUserApplication({
      client,
      applicationId: userApplication.id,
      appType: 'coreApp',
    })
    spinner.succeed()
  } catch (err) {
    spinner.fail()
    debug('Error undeploying application', err)
    throw err
  }

  output.print(
    `Application undeploy scheduled. It might take a few minutes before ${url} is unavailable.`,
  )
}
