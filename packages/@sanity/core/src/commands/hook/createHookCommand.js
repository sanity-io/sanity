export default {
  name: 'create',
  group: 'hook',
  signature: '[NAME] [DATASET] [URL]',
  description: 'Create a new hook for the given dataset',
  action: async (args, context) => {
    const {apiClient, output} = context
    const [hookName, datasetName, hookUrl] = args.argsWithoutOptions
    const client = apiClient()

    const name = await (hookName || promptForHookName(context))
    const dataset = await (datasetName || promptForDataset(context))
    const url = await (hookUrl || promptForHookUrl(context))

    const body = {name, dataset, url}
    try {
      await client.request({method: 'POST', uri: '/hooks', body, json: true})
      output.print('Hook created successfully')
    } catch (err) {
      throw new Error(`Hook creation failed:\n${err.message}`)
    }
  },
}

function promptForHookName(context) {
  const {prompt} = context
  return prompt.single({
    type: 'input',
    message: 'Hook name:',
    validate: (name) =>
      name && name.length > 0 && name.length < 250
        ? true
        : 'Hook names must be between 0 and 250 characters',
  })
}

function promptForHookUrl(context) {
  const {prompt} = context
  return prompt.single({
    type: 'input',
    message: 'Hook URL:',
    validate: (url) =>
      url && /^https?:\/\//.test(url) ? true : 'Hook URL must have an http/https prefix',
  })
}

async function promptForDataset(context) {
  const {prompt, apiClient} = context
  const client = apiClient()
  const datasets = await client.datasets.list()
  const choices = datasets.map((dataset) => ({value: dataset.name, name: dataset.name}))
  choices.push({value: '*', name: '* (all datasets)'})

  return prompt.single({
    message: 'Select dataset hook should apply to',
    type: 'list',
    choices,
  })
}
