module.exports = async function deleteApiAction(args, context) {
  const {apiClient, output, prompt} = context
  const flags = args.extOptions

  const client = apiClient({
    requireUser: true,
    requireProject: true,
  })

  const dataset = flags.dataset || client.config().dataset
  const tag = flags.tag || 'default'

  const confirmMessage =
    tag === 'default'
      ? `Are you absolutely sure you want to delete the current GraphQL API connected to the "${dataset}" dataset?`
      : `Are you absolutely sure you want to delete the GraphQL API connected to the "${dataset}" dataset, tagged "${tag}"?`

  if (
    !(await prompt.single({
      type: 'confirm',
      message: confirmMessage,
      default: false,
    }))
  ) {
    return
  }

  try {
    await client.request({
      url: `/apis/graphql/${dataset}/${tag}`,
      method: 'DELETE',
    })
  } catch (err) {
    throw err
  }

  output.print('GraphQL API deleted')
}
