import {promptForDatasetName} from '../../../actions/dataset/datasetNamePrompt'

const toggleDatasetBackup = async (enableBackups: boolean, args: any, context: any) => {
  const {apiClient, output, prompt, chalk} = context
  const [dataset] = args.argsWithoutOptions
  let client = apiClient()

  const projectFeatures = await client.request({uri: '/features'})
  if (!projectFeatures.includes('backups')) {
    const action = enableBackups ? 'enable' : 'disable'
    throw new Error(
      `Could not ${action} backup: backup configuration is not allowed for this project`
    )
  }

  const datasetName = await (dataset || promptForDatasetName(prompt))
  client = client.clone().config({dataset: datasetName})
  try {
    await client.request({
      method: 'PUT',
      uri: `/datasets/${datasetName}/settings/backups`,
      body: {
        enable: enableBackups,
      },
    })
    const action = enableBackups ? 'enabled' : 'disabled'
    output.print(`${chalk.green(`Dataset backup ${action}\n`)}`)
  } catch (error) {
    const action = enableBackups ? 'Enabling' : 'Disabling'
    const msg = error.statusCode ? error.response.body.message : error.message
    output.print(`${chalk.red(`${action} dataset backup failed::\n${msg}`)}\n`)
  }
}

export default toggleDatasetBackup
