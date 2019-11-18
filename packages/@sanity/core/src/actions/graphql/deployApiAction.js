const {tryInitializePluginConfigs} = require('../config/reinitializePluginConfigs')
const getSanitySchema = require('./getSanitySchema')
const extractFromSanitySchema = require('./extractFromSanitySchema')
const generateTypeQueries = require('./generateTypeQueries')
const generateTypeFilters = require('./generateTypeFilters')
const SchemaError = require('./SchemaError')

module.exports = async function deployApiActions(args, context) {
  const {apiClient, workDir, output, prompt} = context

  await tryInitializePluginConfigs({workDir, output, env: 'production'})

  const flags = args.extOptions

  const client = apiClient({
    requireUser: true,
    requireProject: true
  })

  const dataset = flags.dataset || client.config().dataset
  const tag = flags.tag || 'default'
  const enablePlayground =
    typeof flags.playground === 'undefined'
      ? await prompt.single({
          type: 'confirm',
          message: `Do you want to enable a GraphQL playground?`,
          default: true
        })
      : flags.playground

  let spinner = output.spinner('Generating GraphQL schema').start()

  let schema
  try {
    const sanitySchema = getSanitySchema(workDir)
    const extracted = extractFromSanitySchema(sanitySchema)
    const filters = generateTypeFilters(extracted.types)
    const queries = generateTypeQueries(extracted.types, filters)
    const types = extracted.types.concat(filters)
    schema = {types, queries, interfaces: extracted.interfaces}
  } catch (err) {
    spinner.fail()

    if (err instanceof SchemaError) {
      err.print(output)
      process.exit(1) // eslint-disable-line no-process-exit
    }

    throw err
  }

  spinner.succeed()
  spinner = output.spinner('Deploying GraphQL API').start()

  try {
    const response = await client.request({
      url: `/apis/graphql/${dataset}/${tag}`,
      method: 'PUT',
      body: {enablePlayground, schema},
      maxRedirects: 0
    })

    spinner.succeed()
    output.print('GraphQL API deployed to:')
    output.print(client.getUrl(response.location.replace(/^\/(v1|v\d{4}-\d{2}-\d{2})\//, '/')))
  } catch (err) {
    spinner.fail()
    throw err
  }
}
