const {tryInitializePluginConfigs} = require('../config/reinitializePluginConfigs')
const getSanitySchema = require('./getSanitySchema')
const extractFromSanitySchema = require('./extractFromSanitySchema')
const generateTypeQueries = require('./generateTypeQueries')
const generateTypeFilters = require('./generateTypeFilters')
const generateTypeSortings = require('./generateTypeSortings')
const SchemaError = require('./SchemaError')

module.exports = async function deployApiActions(args, context) {
  const {apiClient, workDir, output, prompt} = context

  await tryInitializePluginConfigs({workDir, output, env: 'production'})

  const flags = args.extOptions
  const {force, playground} = flags

  const client = apiClient({
    requireUser: true,
    requireProject: true
  })

  const dataset = flags.dataset || client.config().dataset
  const tag = flags.tag || 'default'
  const enablePlayground =
    typeof playground === 'undefined'
      ? await prompt.single({
          type: 'confirm',
          message: 'Do you want to enable a GraphQL playground?',
          default: true
        })
      : playground

  let spinner = output.spinner('Generating GraphQL schema').start()

  let schema
  try {
    const sanitySchema = getSanitySchema(workDir)
    const extracted = extractFromSanitySchema(sanitySchema)
    const filters = generateTypeFilters(extracted.types)
    const sortings = generateTypeSortings(extracted.types)
    const queries = generateTypeQueries(extracted.types, filters, sortings)
    const types = extracted.types.concat(filters).concat(sortings)
    schema = {types, queries, interfaces: extracted.interfaces, generation: 'v2'}
  } catch (err) {
    spinner.fail()

    if (err instanceof SchemaError) {
      err.print(output)
      process.exit(1) // eslint-disable-line no-process-exit
    }

    throw err
  }

  spinner.succeed()

  spinner = output.spinner('Validating GraphQL API').start()
  let valid
  try {
    valid = await client.request({
      url: `/apis/graphql/${dataset}/${tag}/validate`,
      method: 'POST',
      body: {enablePlayground, schema},
      maxRedirects: 0
    })
  } catch (err) {
    spinner.fail()
    throw err
  }

  if (!(await confirmValidationResult(valid, {spinner, output, prompt, force}))) {
    return
  }

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

async function confirmValidationResult(valid, {spinner, output, prompt, force}) {
  const {validationError, breakingChanges, dangerousChanges} = valid
  if (validationError) {
    spinner.fail()
    throw new Error(`GraphQL schema is not valid:\n\n${validationError}`)
  }

  const hasProblematicChanges = breakingChanges.length > 0 || dangerousChanges.length > 0
  if (force && hasProblematicChanges) {
    spinner.text = 'Validating GraphQL API: Dangerous changes. Forced with `--force`.'
    spinner.warn()
    return true
  } else if (force || !hasProblematicChanges) {
    spinner.succeed()
    return true
  }

  spinner.warn()

  if (dangerousChanges.length > 0) {
    output.print('\nFound potentially dangerous changes from previous schema:')
    dangerousChanges.forEach(change => output.print(` - ${change.description}`))
  }

  if (breakingChanges.length > 0) {
    output.print('\nFound BREAKING changes from previous schema:')
    breakingChanges.forEach(change => output.print(` - ${change.description}`))
  }

  output.print('')

  const shouldDeploy = await prompt.single({
    type: 'confirm',
    message: 'Do you want to deploy a new API despite the dangerous changes?',
    default: false
  })

  return shouldDeploy
}
