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
      hooks = await client.clone().config({apiVersion: '2021-10-04'}).request({uri: '/hooks'})
    } catch (err) {
      throw new Error(`Hook list retrieval failed:\n${err.message}`)
    }

    hooks.forEach((hook) => {
      output.print(`Name: ${hook.name}`)
      output.print(`Dataset: ${hook.dataset}`)
      output.print(`URL: ${hook.url}`)

      if (hook.type === 'document') {
        output.print(`HTTP method: ${hook.httpMethod}`)

        if (hook.description) {
          output.print(`Description: ${hook.description}`)
        }
      }

      output.print('')
    })
  },
}
