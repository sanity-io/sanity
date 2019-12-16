module.exports = async function deleteApiAction(args, context) {
  const {apiClient, output, prompt} = context
  const flags = args.extOptions

  const client = apiClient({
    requireUser: true,
    requireProject: true
  })

  if (
    !(await prompt.single({
      type: 'confirm',
      message: `Are you absolutely sure you want to delete the current GraphQL API?`,
      default: false
    }))
  ) {
    return
  }

  const dataset = flags.dataset || client.config().dataset
  const tag = flags.tag || 'default'
  try {
    await client.request({
      url: `/apis/graphql/${dataset}/${tag}`,
      method: 'DELETE'
    })
  } catch (err) {
    throw err
  }

  output.print('GraphQL API deleted')
}
