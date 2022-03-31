/* eslint-disable no-process-env, no-process-exit, max-statements */
const {get} = require('lodash')
const yargs = require('yargs/yargs')
const {hideBin} = require('yargs/helpers')
const oneline = require('oneline')
const debug = require('../../debug').default
const getUrlHeaders = require('../../util/getUrlHeaders')
const {tryInitializePluginConfigs} = require('../config/reinitializePluginConfigs')
const getSanitySchema = require('./getSanitySchema')
const extractFromSanitySchema = require('./extractFromSanitySchema')
const SchemaError = require('./SchemaError')

const gen1 = require('./gen1')
const gen2 = require('./gen2')
const gen3 = require('./gen3')

const latestGeneration = 'gen3'
const generations = {
  gen1,
  gen2,
  gen3,
}

const isInteractive = process.stdout.isTTY && process.env.TERM !== 'dumb' && !('CI' in process.env)

const ignoredWarnings = ['OPTIONAL_INPUT_FIELD_ADDED']
const ignoredBreaking = []

// eslint-disable-next-line complexity
module.exports = async function deployApiActions(args, context) {
  // Reparsing CLI flags for better control of binary flags
  const flags = parseCliFlags(args)

  const {apiClient, workDir, output, prompt, chalk} = context

  await tryInitializePluginConfigs({workDir, output, env: 'production'})

  let spinner
  const {force, tag, playground, nonNullDocumentFields, dryRun} = flags

  const client = apiClient({
    requireUser: true,
    requireProject: true,
  })

  const dataset = flags.dataset || client.config().dataset
  let generation = flags.generation
  if (generation && !generations.hasOwnProperty(generation)) {
    throw new Error(`Unknown API generation "${generation}"`)
  }

  context.output.print(`Dataset: ${dataset}`)
  context.output.print(`Tag: ${tag}\n`)

  spinner = output.spinner('Checking for deployed API').start()
  const {currentGeneration, playgroundEnabled = true} = await getCurrentSchemaProps({
    client,
    dataset,
    tag,
  })
  spinner.succeed()

  generation = await resolveApiGeneration({currentGeneration, flags, output, prompt, chalk})
  if (!generation) {
    // User cancelled
    return
  }

  let enablePlayground = playground

  // if dry run, the playground prompt won't be launched
  if (!dryRun) {
    if (typeof playground === 'undefined' && !isInteractive) {
      enablePlayground = playgroundEnabled
    } else if (typeof playground === 'undefined') {
      enablePlayground = await prompt.single({
        type: 'confirm',
        message: 'Do you want to enable a GraphQL playground?',
        default: playgroundEnabled,
      })
    }
  }

  spinner = output.spinner('Generating GraphQL schema').start()

  let schema
  try {
    const generateSchema = generations[generation]
    const sanitySchema = getSanitySchema(workDir)
    const extracted = extractFromSanitySchema(sanitySchema, {
      nonNullDocumentFields,
    })

    schema = generateSchema(extracted)
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
      maxRedirects: 0,
    })
  } catch (err) {
    const validationError = get(err, 'response.body.validationError')
    spinner.fail()
    throw validationError ? new Error(validationError) : err
  }

  if (!(await confirmValidationResult(valid, {spinner, output, prompt, force, dryRun}))) {
    return
  }

  if (dryRun) {
    output.print('GraphQL API is valid and has no breaking changes')
    process.exit(0)
  }

  spinner = output.spinner('Deploying GraphQL API').start()

  try {
    const response = await client.request({
      url: `/apis/graphql/${dataset}/${tag}`,
      method: 'PUT',
      body: {enablePlayground, schema},
      maxRedirects: 0,
    })

    spinner.succeed()
    output.print('GraphQL API deployed to:')
    output.print(client.getUrl(response.location.replace(/^\/(v1|v\d{4}-\d{2}-\d{2})\//, '/')))

    // Because of side effects when loading the schema, we can end up in situations where
    // the API has been successfully deployed, but some timer or other handle is keeping
    // the process from naturally exiting.
    process.exit(0)
  } catch (err) {
    spinner.fail()
    throw err
  }
}

function getCurrentSchemaProps({client, dataset, tag}) {
  return getUrlHeaders(client.getUrl(`/apis/graphql/${dataset}/${tag}`), {
    Authorization: `Bearer ${client.config().token}`,
  })
    .then((res) => ({
      currentGeneration: res['x-sanity-graphql-generation'],
      playgroundEnabled: res['x-sanity-graphql-playground'] === 'true',
    }))
    .catch((err) => {
      if (err.statusCode === 404) {
        return {}
      }

      throw err
    })
}

function parseCliFlags(args) {
  return yargs(hideBin(args.argv || process.argv).slice(2))
    .option('dataset', {type: 'string'})
    .option('tag', {type: 'string', default: 'default'})
    .option('generation', {type: 'string'})
    .option('non-null-document-fields', {type: 'boolean', default: false})
    .option('playground', {type: 'boolean'})
    .option('dry-run', {type: 'boolean', default: false})
    .option('force', {type: 'boolean'}).argv
}

async function confirmValidationResult(valid, {spinner, output, prompt, force, dryRun}) {
  const {validationError, breakingChanges: breaking, dangerousChanges: dangerous} = valid
  if (validationError) {
    spinner.fail()
    throw new Error(`GraphQL schema is not valid:\n\n${validationError}`)
  }

  const breakingChanges = breaking.filter((change) => !ignoredBreaking.includes(change.type))
  const dangerousChanges = dangerous.filter((change) => !ignoredWarnings.includes(change.type))

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
    dangerousChanges.forEach((change) => output.print(` - ${change.description}`))
  }

  if (breakingChanges.length > 0) {
    output.print('\nFound BREAKING changes from previous schema:')
    breakingChanges.forEach((change) => output.print(` - ${change.description}`))
  }

  output.print('')

  if (!isInteractive && !dryRun) {
    throw new Error(
      'Dangerous changes found - falling back. Re-run the command with the `--force` flag to force deployment.'
    )
  }

  if (dryRun) {
    process.exit(1)
  }

  const shouldDeploy = await prompt.single({
    type: 'confirm',
    message: 'Do you want to deploy a new API despite the dangerous changes?',
    default: false,
  })

  return shouldDeploy
}

async function resolveApiGeneration({currentGeneration, flags, output, prompt, chalk}) {
  // a) If no API is currently deployed:
  //    use the specificed one, or use whichever generation is the latest
  // b) If an API generation is specified explicitly:
  //    use the given one, but _prompt_ if it differs from the current one
  // c) If no API generation is specified explicitly:
  //    use whichever is already deployed, but warn if differs from latest
  if (!currentGeneration) {
    const generation = flags.generation || latestGeneration
    debug(
      'There is no current generation deployed, using %s (%s)',
      generation,
      flags.generation ? 'specified' : 'default'
    )
    return generation
  }

  if (flags.generation && flags.generation !== currentGeneration) {
    if (!flags.force && !isInteractive) {
      throw new Error(oneline`
        Specified generation (${flags.generation}) differs from the one currently deployed (${currentGeneration}).
        Re-run the command with \`--force\` to force deployment.
      `)
    }

    output.warn(
      `Specified generation (${flags.generation}) differs from the one currently deployed (${currentGeneration}).`
    )

    const confirmDeploy =
      flags.force ||
      (await prompt.single({
        type: 'confirm',
        message: 'Are you sure you want to deploy?',
        default: false,
      }))

    return confirmDeploy ? flags.generation : null
  }

  const generation = flags.generation || currentGeneration
  if (generation !== latestGeneration) {
    output.warn(
      chalk.cyan(
        `A new generation of the GraphQL API is available, use \`--generation ${latestGeneration}\` to use it`
      )
    )
  }

  if (flags.generation) {
    debug('Using specified (%s) generation', flags.generation)
    return flags.generation
  }

  debug('Using the currently deployed version (%s)', currentGeneration)
  return currentGeneration
}
