import debug from '../../debug'
import promptForDatasetName from './promptForDatasetName'

// eslint-disable-next-line no-process-env
const isCI = process.env.CI
const allowedAclModes = ['public', 'private']
const datasetInfoMessage = `
Your content will be stored in a dataset that can be public or private, depending on
whether you want to query your content with or without authentication.
The default dataset configuration has a public dataset named "production".`.trim()

export default async function getOrCreateDataset(options) {
  const {dataset, client, unattended, prompt, output} = options

  if (dataset && isCI) {
    return {datasetName: dataset}
  }

  const existingDatasets = await client.datasets.list()
  const useDefaultConfig = Boolean(options.useDefaultConfig)
  const showDefaultConfigPrompt = !(dataset || options.aclMode || unattended)
  const aclMode = useDefaultConfig || unattended ? 'public' : options.aclMode

  if (aclMode && !allowedAclModes.includes(aclMode)) {
    throw new Error(`Visibility mode "${aclMode}" not allowed`)
  }

  // If user has specified dataset through CLI flag
  if (dataset) {
    return useSpecifiedDataset({dataset, existingDatasets, output, client, aclMode, prompt})
  }

  // If nothing is specified and this is the first dataset in the project
  if (existingDatasets.length === 0) {
    return promptForNewDataset({
      aclMode,
      showDefaultConfigPrompt,
      useDefaultConfig,
      prompt,
      output,
      client,
      existingDatasets
    })
  }

  // When there are choices to select from
  return promptFromAvailableDatasets({
    dataset,
    existingDatasets,
    output,
    client,
    aclMode,
    prompt,
    showDefaultConfigPrompt
  })
}

async function promptForAclMode(prompt, output) {
  const mode = await prompt.single({
    type: 'list',
    message: 'Choose dataset visibility – this can be changed later',
    choices: [
      {
        value: 'public',
        name: 'Public (world readable)'
      },
      {
        value: 'private',
        name: 'Private (authenticated requests only)'
      }
    ]
  })

  if (mode === 'private') {
    output.print(
      'Please note that while documents are private, assets (files and images) are still public\n'
    )
  }

  return mode
}

async function useSpecifiedDataset({aclMode, client, dataset, existingDatasets, output, prompt}) {
  debug('User has specified dataset through a flag (%s)', dataset)
  const existing = existingDatasets.find(ds => ds.name === dataset)

  if (!existing) {
    debug('Specified dataset not found, creating it')
    const wantedAclMode = aclMode || (await promptForAclMode(prompt, output))
    const spinner = output.spinner('Creating dataset').start()
    await client.datasets.create(dataset, {aclMode: wantedAclMode})
    spinner.succeed()
  }

  return {datasetName: dataset}
}

async function promptForNewDataset({
  aclMode,
  showDefaultConfigPrompt,
  useDefaultConfig,
  prompt,
  output,
  client,
  existingDatasets = []
}) {
  debug('No datasets found for project, prompting for name')

  let useDefaultDatasetConfig = useDefaultConfig
  if (showDefaultConfigPrompt) {
    output.print(datasetInfoMessage)
    useDefaultDatasetConfig = await prompt.single({
      type: 'confirm',
      message: 'Use the default dataset configuration?',
      default: true
    })
  }

  const name = useDefaultDatasetConfig
    ? 'production'
    : await promptForDatasetName(
        prompt,
        {message: 'Dataset name:'},
        existingDatasets.map(ds => ds.name)
      )

  const wantedAclMode = useDefaultDatasetConfig
    ? 'public'
    : aclMode || (await promptForAclMode(prompt, output))

  const spinner = output.spinner('Creating dataset').start()
  await client.datasets.create(name, {aclMode: wantedAclMode})
  spinner.succeed()
  return {datasetName: name}
}

async function promptFromAvailableDatasets({
  aclMode,
  showDefaultConfigPrompt,
  useDefaultConfig,
  prompt,
  output,
  client,
  existingDatasets = []
}) {
  debug(`User has ${existingDatasets.length} dataset(s) already, showing list of choices`)
  const datasetChoices = existingDatasets.map(existing => ({value: existing.name}))

  const selected = await prompt.single({
    message: 'Select dataset to use',
    type: 'list',
    choices: [
      {value: '__new__', name: 'Create new dataset'},
      new prompt.Separator(),
      ...datasetChoices
    ]
  })

  if (selected === '__new__') {
    return promptForNewDataset({
      aclMode,
      showDefaultConfigPrompt,
      useDefaultConfig,
      prompt,
      output,
      client,
      existingDatasets
    })
  }

  debug(`Returning selected dataset (${selected})`)
  return {datasetName: selected}
}
