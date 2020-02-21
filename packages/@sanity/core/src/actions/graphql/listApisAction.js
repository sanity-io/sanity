module.exports = async function listApisAction(args, context) {
  const {apiClient, output} = context

  const client = apiClient({
    requireUser: true,
    requireProject: true
  })

  let endpoints
  try {
    endpoints = await client.request({
      url: `/apis/graphql`,
      method: 'GET'
    })
  } catch (err) {
    if (err.statusCode === 404) {
      endpoints = []
    } else {
      throw err
    }
  }

  if (endpoints && endpoints.length > 0) {
    output.print('Here are the GraphQL endpoints deployed for this project:')
    endpoints.forEach((endpoint, index) => {
      output.print(`* [${index + 1}] `)
      output.print(`  ** Dataset:     ${endpoint.dataset}`)
      output.print(`  ** Tag:         ${endpoint.tag}`)
      output.print(`  ** Generation:  ${endpoint.generation}`)
      output.print(`  ** Playground:  ${endpoint.playgroundEnabled}\n`)
    })
  }

  output.print("This project doesn't have any GraphQL endpoints deployed.")
}
