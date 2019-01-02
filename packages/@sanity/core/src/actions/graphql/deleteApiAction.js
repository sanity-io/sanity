module.exports = async function deleteApiAction(args, context) {
  const {apiClient, output, prompt} = context

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

  const dataset = client.config().dataset
  try {
    await client.request({
      url: `/apis/graphql/${dataset}/default`,
      method: 'DELETE'
    })
  } catch (err) {
    throw err
  }

  output.print('GraphQL API deleted')
}
