import promptForDatasetName from '../../actions/dataset/datasetNamePrompt'

export default {
  name: 'create',
  group: 'dataset',
  signature: '[NAME]',
  description: 'Create a new dataset within your project',
  action: async (args, context) => {
    const {apiClient, output, prompt} = context
    const [dataset] = args.argsWithoutOptions
    const client = apiClient()
    const datasetName = await (dataset || promptForDatasetName(prompt))

    try {
      await client.datasets.create(datasetName)
      output.print('Dataset created successfully')
    } catch (err) {
      throw new Error(`Dataset creation failed:\n${err.message}`)
    }
  }
}

