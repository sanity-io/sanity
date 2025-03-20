import {type CliCommandArguments, type CliCommandContext} from '@sanity/cli'

import {debug as debugIt} from '../../debug'
import {deleteUserApplication, getUserApplication} from '../deploy/helpers'
import {type UndeployStudioActionFlags} from '../deploy/undeployAction'

const debug = debugIt.extend('undeploy')

export default async function undeployAppAction(
  _: CliCommandArguments<UndeployStudioActionFlags>,
  context: CliCommandContext,
): Promise<void> {
  const {apiClient, chalk, output, prompt, cliConfig} = context

  const client = apiClient({
    requireUser: true,
    requireProject: false,
  }).withConfig({apiVersion: 'v2024-08-01'})

  // Check that the project has an application ID
  let spinner = output.spinner('Checking application info').start()

  const appId =
    cliConfig && '__experimental_appConfiguration' in cliConfig
      ? cliConfig.__experimental_appConfiguration?.appId
      : undefined

  if (!appId) {
    spinner.fail()
    output.print(`No application ID provided.`)
    output.print(
      'Please set appId in `__experimental_appConfiguration` in sanity.cli.js or sanity.cli.ts.',
    )
    output.print('Nothing to undeploy.')
    return
  }

  const userApplication = await getUserApplication({
    client,
    appId,
  })

  spinner.succeed()

  if (!userApplication) {
    spinner.fail()
    output.print('Application with the given ID does not exist.')
    output.print('Nothing to undeploy.')
    return
  }

  // Double-check
  output.print('')

  const shouldUndeploy = await prompt.single({
    type: 'confirm',
    default: false,
    message:
      `This will undeploy ${chalk.yellow(userApplication.appHost)} and make it unavailable for your users.
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
    `Application undeploy scheduled. It might take a few minutes before ${chalk.yellow(userApplication.id)} is unavailable.`,
  )
}
