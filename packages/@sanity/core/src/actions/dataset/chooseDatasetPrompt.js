import debug from '../../debug'
import promptForDatasetName from './datasetNamePrompt'

module.exports = async (context, message = 'Select dataset to use') => {
  const {apiClient, prompt} = context
  const client = apiClient()

  const datasets = await client.datasets.list()
  const hasProduction = datasets.find(dataset => dataset.name === 'production')
  const datasetChoices = datasets.map(dataset => ({value: dataset.name}))
  const selected = await prompt.single({
    message,
    type: 'list',
    choices: [{value: 'new', name: 'Create new dataset'}, new prompt.Separator(), ...datasetChoices]
  })

  if (selected === 'new') {
    debug('User wants to create a new dataset, prompting for name')
    const newDatasetName = await promptForDatasetName(prompt, {
      message: 'Name your dataset:',
      default: hasProduction ? undefined : 'production'
    })
    await client.datasets.create(newDatasetName)
    return newDatasetName
  }

  return selected
}
