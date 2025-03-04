import {type CliCommandArguments, type CliCommandContext} from '@sanity/cli'

import {debug as debugIt} from '../../debug'
import {deleteUserApplication, getUserApplication} from './helpers'

const debug = debugIt.extend('undeploy')

export default async function undeployStudioAction(
  _: CliCommandArguments<Record<string, unknown>>,
  context: CliCommandContext,
): Promise<void> {
  const {apiClient, chalk, output, prompt, cliConfig} = context

  const client = apiClient({
    requireUser: true,
    requireProject: true,
  }).withConfig({apiVersion: 'v2024-08-01'})

  // Check that the project has a studio hostname
  let spinner = output.spinner('Checking project info').start()

  const userApplication = await getUserApplication({
    client,
    appHost: cliConfig && 'studioHost' in cliConfig ? cliConfig.studioHost : undefined,
  })

  spinner.succeed()

  if (!userApplication) {
    output.print('Your project has not been assigned a studio hostname')
    output.print('or you do not have studioHost set in sanity.cli.js or sanity.cli.ts.')
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

  spinner = output.spinner('Undeploying studio').start()
  try {
    await deleteUserApplication({
      client,
      applicationId: userApplication.id,
      appType: 'studio',
    })
    spinner.succeed()
  } catch (err) {
    spinner.fail()
    debug('Error undeploying studio', err)
    throw err
  }

  output.print(
    `Studio undeploy scheduled. It might take a few minutes before ${url} is unavailable.`,
  )
}
