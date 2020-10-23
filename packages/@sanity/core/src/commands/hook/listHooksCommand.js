export default {
  name: 'list',
  group: 'hook',
  signature: '',
  description: 'List hooks for a given project',
  action: async (args, context) => {
    const {apiClient, output} = context
    const client = apiClient()

    let hooks
    try {
      hooks = await client.request({uri: '/hooks'})
    } catch (err) {
      throw new Error(`Hook list retrieval failed:\n${err.message}`)
    }

    hooks.forEach((hook) => {
      output.print(`Name: ${hook.name}`)
      output.print(`Dataset: ${hook.dataset}`)
      output.print(`URL: ${hook.url}`)
      output.print('')
    })
  },
}
