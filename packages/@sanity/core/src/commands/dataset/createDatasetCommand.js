import promptForDatasetName from '../../actions/dataset/datasetNamePrompt'

const helpText = `
Options
--acl-mode <mode> Set ACL mode for this dataset (public/private)

Examples
sanity dataset create
sanity dataset create <name>
sanity dataset create <name> --acl-mode private
`

const allowedModes = ['private', 'public']

export default {
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

    const [datasets, projectFeatures] = await Promise.all([
      client.datasets.list().then(sets => sets.map(ds => ds.name)),
      client.request({uri: '/features'})
    ])

    if (flags['acl-mode'] && allowedModes.includes(flags['acl-mode'])) {
      throw new Error(`ACL mode "${flags['acl-mode']}" not allowed`)
    }

    const datasetName = await (dataset || promptForDatasetName(prompt))
    if (datasets.includes(datasetName)) {
      throw new Error(`Dataset "${datasetName}" already exists`)
    }

    const canCreatePrivate = projectFeatures.includes('privateDataset')
    const defaultAclMode = canCreatePrivate ? flags['acl-mode'] : 'public'
    const aclMode = await (defaultAclMode || promptForAclMode(prompt))

    try {
      await client.datasets.create(datasetName, {aclMode})
      output.print('Dataset created successfully')
    } catch (err) {
      throw new Error(`Dataset creation failed:\n${err.message}`)
    }
  }
}

async function promptForAclMode(prompt, options = {}) {
  const mode = await prompt.single({
    type: 'list',
    message: 'Dataset ACL mode',
    choices: [
      {
        value: 'public',
        name: 'Public (all documents visible)'
      },
      {
        value: 'private',
        name: 'Private (requires token to read documents)'
      }
    ]
  })

  if (mode !== 'private') {
    return mode
  }

  const confirmed = await prompt.single({
    type: 'confirm',
    message: 'Note: Assets (images, files) will still be public (accessible by URL). Continue?',
    default: true
  })

  return confirmed ? mode : promptForAclMode(prompt, options)
}
