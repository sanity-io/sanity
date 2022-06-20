/* eslint-disable no-process-env, no-process-exit, max-statements */
import {get} from 'lodash'
import yargs from 'yargs/yargs'
import type {SanityClient} from '@sanity/client'
import type {CliCommandContext, CliOutputter, CliPrompter} from '@sanity/cli'
import {hideBin} from 'yargs/helpers'
import oneline from 'oneline'

import {debug} from '../../debug'
import {getUrlHeaders} from '../../util/getUrlHeaders'
import {extractFromSanitySchema} from './extractFromSanitySchema'
import {SchemaError} from './SchemaError'
import {getGraphQLAPIs} from './getGraphQLAPIs'
import {DeployResponse, GeneratedApiSpecification, ValidationResponse} from './types'

import gen1 from './gen1'
import gen2 from './gen2'
import gen3 from './gen3'

const latestGeneration = 'gen3'
const generations = {
  gen1,
  gen2,
  gen3,
}

const apiIdRegex = /^[a-z0-9_-]+$/
const isInteractive = process.stdout.isTTY && process.env.TERM !== 'dumb' && !('CI' in process.env)

const ignoredWarnings: string[] = ['OPTIONAL_INPUT_FIELD_ADDED']
const ignoredBreaking: string[] = []

interface DeployTask {
  dataset: string
  projectId: string
  tag: string
  enablePlayground: boolean
  schema: GeneratedApiSpecification
}

// eslint-disable-next-line complexity
export default async function deployGraphQLApiAction(
  args: {argv?: string[]},
  context: CliCommandContext
): Promise<void> {
  // Reparsing CLI flags for better control of binary flags
  const flags = await parseCliFlags(args)
  const {force, dryRun, api: onlyApis} = flags

  const {apiClient, output, prompt} = context

  let spinner

  const client = apiClient({
    requireUser: true,
    requireProject: true,
  })

  const apiDefs = await getGraphQLAPIs(context)
  const deployTasks: DeployTask[] = []

  const apiNames = new Set<string>()
  const apiIds = new Set<string>()
  for (const apiDef of apiDefs) {
    const apiName = [apiDef.dataset, apiDef.tag || 'default'].join('/')
    if (apiNames.has(apiName)) {
      throw new Error(`Multiple GraphQL APIs with the same dataset and tag found (${apiName})`)
    }

    if (apiDef.id) {
      if (typeof apiDef.id !== 'string' || !apiIdRegex.test(apiDef.id)) {
        throw new Error(
          `Invalid GraphQL API id "${apiDef.id}" - only a-z, 0-9, underscore and dashes are allowed`
        )
      }

      if (apiIds.has(apiDef.id)) {
        throw new Error(`Multiple GraphQL APIs with the same ID found (${apiDef.id})`)
      }

      apiIds.add(apiDef.id)
    }

    apiNames.add(apiName)
  }

  for (const apiId of onlyApis || []) {
    if (!apiDefs.some((apiDef) => apiDef.id === apiId)) {
      throw new Error(`GraphQL API with id "${apiId}" not found`)
    }
  }

  if (onlyApis) {
    output.warn(`Deploying only specified APIs: ${onlyApis.join(', ')}`)
  }

  let index = -1
  for (const apiDef of apiDefs) {
    if (onlyApis && (!apiDef.id || !onlyApis.includes(apiDef.id))) {
      continue
    }

    index++

    const {projectId, dataset, playground, tag = 'default', nonNullDocumentFields, schema} = apiDef
    const apiName = [dataset, tag].join('/')
    spinner = output.spinner(`Generating GraphQL API: ${apiName}`).start()

    let generation: string | undefined = apiDef.generation
    if (!dataset) {
      throw new Error(`No dataset specified for API at index ${index}`)
    }

    const projectClient = client.clone().config({projectId})
    const {currentGeneration, playgroundEnabled} = await getCurrentSchemaProps(
      projectClient,
      dataset,
      tag
    )
    generation = await resolveApiGeneration({
      currentGeneration,
      specifiedGeneration: generation,
      index,
      force,
      output,
      prompt,
    })

    if (!generation) {
      // User cancelled
      spinner.fail()
      continue
    }

    if (!isRecognizedApiGeneration(generation)) {
      throw new Error(`Unknown API generation "${generation}" for API at index ${index}`)
    }

    const enablePlayground = await shouldEnablePlayground({
      dryRun,
      spinner,
      playgroundConfiguration: playground,
      playgroundCurrentlyEnabled: playgroundEnabled,
      prompt,
    })

    let apiSpec: GeneratedApiSpecification
    try {
      const generateSchema = generations[generation]
      const extracted = extractFromSanitySchema(schema, {
        nonNullDocumentFields,
      })

      apiSpec = generateSchema(extracted)
    } catch (err) {
      spinner.fail()

      if (err instanceof SchemaError) {
        err.print(output)
        process.exit(1) // eslint-disable-line no-process-exit
      }

      throw err
    }

    let valid: ValidationResponse | undefined
    try {
      valid = await projectClient.request<ValidationResponse>({
        url: `/apis/graphql/${dataset}/${tag}/validate`,
        method: 'POST',
        body: {enablePlayground, schema: apiSpec},
        maxRedirects: 0,
      })
    } catch (err) {
      const validationError = get(err, 'response.body.validationError')
      spinner.fail()
      throw validationError ? new Error(validationError) : err
    }

    // when the result is not valid and there are breaking changes afoot!
    if (!isResultValid(valid, {spinner, force})) {
      // not valid and a dry run? then it can exit with a error
      if (dryRun) {
        spinner.fail()
        renderBreakingChanges(valid, output)
        process.exit(1)
      }

      if (!isInteractive) {
        spinner.fail()
        renderBreakingChanges(valid, output)
        throw new Error(
          'Dangerous changes found - falling back. Re-run the command with the `--force` flag to force deployment.'
        )
      }

      spinner.stop()
      renderBreakingChanges(valid, output)
      const shouldDeploy = await prompt.single({
        type: 'confirm',
        message: 'Do you want to deploy a new API despite the dangerous changes?',
        default: false,
      })

      if (!shouldDeploy) {
        spinner.fail()
        continue
      }

      spinner.succeed()
    } else if (dryRun) {
      spinner.succeed()
      output.print('GraphQL API is valid and has no breaking changes')
      process.exit(0)
    }

    deployTasks.push({
      projectId,
      dataset,
      tag,
      enablePlayground,
      schema: apiSpec,
    })
  }

  // Give some space for deployment tasks
  output.print('')

  for (const task of deployTasks) {
    const {dataset, tag, schema, projectId, enablePlayground} = task

    output.print(`Project: ${projectId}`)
    output.print(`Dataset: ${dataset}`)
    output.print(`Tag:     ${tag}`)

    spinner = output.spinner('Deploying GraphQL API').start()

    try {
      const projectClient = client.clone().config({projectId})
      const response = await projectClient.request<DeployResponse>({
        url: `/apis/graphql/${dataset}/${tag}`,
        method: 'PUT',
        body: {enablePlayground, schema},
        maxRedirects: 0,
      })

      spinner.stop()
      const apiUrl = projectClient.getUrl(
        response.location.replace(/^\/(v1|v\d{4}-\d{2}-\d{2})\//, '/')
      )
      output.print(`URL:     ${apiUrl}`)
      spinner.start('Deployed!').succeed()
      output.print('')
    } catch (err) {
      spinner.fail()
      throw err
    }
  }

  // Because of side effects when loading the schema, we can end up in situations where
  // the API has been successfully deployed, but some timer or other handle is keeping
  // the process from naturally exiting.
  process.exit(0)
}

async function shouldEnablePlayground({
  dryRun,
  spinner,
  playgroundConfiguration,
  playgroundCurrentlyEnabled,
  prompt,
}: {
  dryRun: boolean
  spinner: ReturnType<CliCommandContext['output']['spinner']>
  playgroundConfiguration?: boolean
  playgroundCurrentlyEnabled?: boolean
  prompt: CliCommandContext['prompt']
}): Promise<boolean> {
  // On a dry run, it doesn't matter, return true 🤷‍♂️
  if (dryRun) {
    return true
  }

  // If explicitly set true/false in configuration, use that
  if (typeof playgroundConfiguration !== 'undefined') {
    return playgroundConfiguration
  }

  // If API is already deployed, use the current state
  if (typeof playgroundCurrentlyEnabled !== 'undefined') {
    return playgroundCurrentlyEnabled
  }

  // If no API is deployed, default to true if non-interactive
  if (!isInteractive) {
    return true
  }

  // Interactive environment, so prompt the user
  const prevText = spinner.text
  spinner.warn()
  const shouldDeploy = await prompt.single<boolean>({
    type: 'confirm',
    message: 'Do you want to enable a GraphQL playground?',
    default: true,
  })
  spinner.clear().start(prevText)

  return shouldDeploy
}

async function getCurrentSchemaProps(
  client: SanityClient,
  dataset: string,
  tag: string
): Promise<{
  currentGeneration?: string
  playgroundEnabled?: boolean
}> {
  try {
    const res = await getUrlHeaders(client.getUrl(`/apis/graphql/${dataset}/${tag}`), {
      Authorization: `Bearer ${client.config().token}`,
    })

    return {
      currentGeneration: res['x-sanity-graphql-generation'],
      playgroundEnabled: res['x-sanity-graphql-playground'] === 'true',
    }
  } catch (err) {
    if (err.statusCode === 404) {
      return {}
    }

    throw err
  }
}

function parseCliFlags(args: {argv?: string[]}) {
  return yargs(hideBin(args.argv || process.argv).slice(2))
    .option('api', {type: 'string', array: true})
    .option('dataset', {type: 'string'})
    .option('tag', {type: 'string', default: 'default'})
    .option('generation', {type: 'string'})
    .option('non-null-document-fields', {type: 'boolean', default: false})
    .option('playground', {type: 'boolean'})
    .option('dry-run', {type: 'boolean', default: false})
    .option('force', {type: 'boolean'}).argv
}

function isResultValid(
  valid: ValidationResponse,
  {spinner, force}: {spinner: any; force?: boolean}
) {
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
  return false
}

function renderBreakingChanges(valid: ValidationResponse, output: CliOutputter) {
  const {breakingChanges: breaking, dangerousChanges: dangerous} = valid

  const breakingChanges = breaking.filter((change) => !ignoredBreaking.includes(change.type))
  const dangerousChanges = dangerous.filter((change) => !ignoredWarnings.includes(change.type))

  if (dangerousChanges.length > 0) {
    output.print('\nFound potentially dangerous changes from previous schema:')
    dangerousChanges.forEach((change) => output.print(` - ${change.description}`))
  }

  if (breakingChanges.length > 0) {
    output.print('\nFound BREAKING changes from previous schema:')
    breakingChanges.forEach((change) => output.print(` - ${change.description}`))
  }

  output.print('')
}

async function resolveApiGeneration({
  currentGeneration,
  specifiedGeneration,
  index,
  force,
  output,
  prompt,
}: {
  index: number
  currentGeneration?: string
  specifiedGeneration?: string
  force?: boolean
  output: CliOutputter
  prompt: CliPrompter
}): Promise<string | undefined> {
  // a) If no API is currently deployed:
  //    use the specificed one from config, or use whichever generation is the latest
  // b) If an API generation is specified explicitly:
  //    use the given one, but _prompt_ if it differs from the current one
  // c) If no API generation is specified explicitly:
  //    use whichever is already deployed, but warn if differs from latest
  if (!currentGeneration) {
    const generation = specifiedGeneration || latestGeneration
    debug(
      'There is no current generation deployed, using %s (%s)',
      generation,
      specifiedGeneration ? 'specified' : 'default'
    )
    return generation
  }

  if (specifiedGeneration && specifiedGeneration !== currentGeneration) {
    if (!force && !isInteractive) {
      throw new Error(oneline`
        Specified generation (${specifiedGeneration}) for API at index ${index} differs from the one currently deployed (${currentGeneration}).
        Re-run the command with \`--force\` to force deployment.
      `)
    }

    output.warn(
      `Specified generation (${specifiedGeneration}) for API at index ${index} differs from the one currently deployed (${currentGeneration}).`
    )

    const confirmDeploy =
      force ||
      (await prompt.single({
        type: 'confirm',
        message: 'Are you sure you want to deploy?',
        default: false,
      }))

    return confirmDeploy ? specifiedGeneration : undefined
  }

  if (specifiedGeneration) {
    debug('Using specified (%s) generation', specifiedGeneration)
    return specifiedGeneration
  }

  debug('Using the currently deployed version (%s)', currentGeneration)
  return currentGeneration
}

function isRecognizedApiGeneration(generation: string): generation is 'gen1' | 'gen2' | 'gen3' {
  return generations.hasOwnProperty(generation)
}
