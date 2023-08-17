import type {CliCommandDefinition, CliOutputter, CliPrompter} from '@sanity/cli'
import {debug} from '../../debug'
import {promptForDatasetName} from '../../actions/dataset/datasetNamePrompt'
import {validateDatasetName} from '../../actions/dataset/validateDatasetName'

const helpText = `
Options
  --visibility <mode> Set visibility for this dataset (public/private)

Examples
  sanity dataset create
  sanity dataset create <name>
  sanity dataset create <name> --visibility private
`

const allowedModes = ['private', 'public', 'custom']

interface CreateFlags {
  visibility?: 'private' | 'public' | 'custom'
}

const createDatasetCommand: CliCommandDefinition<CreateFlags> = {
  name: 'create',
  group: 'dataset',
  signature: '[NAME]',
  helpText,
  description: 'Create a new dataset within your project',
  action: async (args, context) => {
    const {apiClient, output, prompt} = context
    const flags = args.extOptions
    const [dataset] = args.argsWithoutOptions
    const client = apiClient()

    const nameError = dataset && validateDatasetName(dataset)
    if (nameError) {
      throw new Error(nameError)
    }

    const [datasets, projectFeatures] = await Promise.all([
      client.datasets.list().then((sets) => sets.map((ds) => ds.name)),
      client.request({uri: '/features'}),
    ])

    if (flags.visibility && !allowedModes.includes(flags.visibility)) {
      throw new Error(`Visibility mode "${flags.visibility}" not allowed`)
    }

    const datasetName = await (dataset || promptForDatasetName(prompt))
    if (datasets.includes(datasetName)) {
      throw new Error(`Dataset "${datasetName}" already exists`)
    }

    const canCreatePrivate = projectFeatures.includes('privateDataset')
    debug('%s create private datasets', canCreatePrivate ? 'Can' : 'Cannot')

    const defaultAclMode = canCreatePrivate ? flags.visibility : 'public'
    const aclMode = await (defaultAclMode || promptForDatasetVisibility(prompt, output))

    try {
      await client.datasets.create(datasetName, {aclMode})
      output.print('Dataset created successfully')
    } catch (err) {
      throw new Error(`Dataset creation failed:\n${err.message}`)
    }
  },
}

async function promptForDatasetVisibility(prompt: CliPrompter, output: CliOutputter) {
  const mode = await prompt.single<'public' | 'private'>({
    type: 'list',
    message: 'Dataset visibility',
    choices: [
      {
        value: 'public',
        name: 'Public (world readable)',
      },
      {
        value: 'private',
        name: 'Private (Authenticated user or token needed)',
      },
    ],
  })

  if (mode === 'private') {
    output.print(
      'Please note that while documents are private, assets (files and images) are still public\n',
    )
  }

  return mode
}

export default createDatasetCommand
