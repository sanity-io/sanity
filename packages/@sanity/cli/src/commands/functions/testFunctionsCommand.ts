import {FunctionsTestCommand} from '@sanity/runtime-cli'
import {logger} from '@sanity/runtime-cli/utils'

import {type CliCommandDefinition} from '../../types'
import {createErrorLogger, transformHelpText} from '../../util/runtimeCommandHelp'

export interface FunctionsTestFlags {
  'data'?: string
  'd'?: string
  'data-before'?: string
  'data-after'?: string
  'event'?: string
  'e'?: string
  'file'?: string
  'f'?: string
  'file-before'?: string
  'file-after'?: string
  'timeout'?: number
  't'?: number
  'api'?: string
  'a'?: string
  'dataset'?: string
  'project-id'?: string
  'document-id'?: string
  'document-id-before'?: string
  'document-id-after'?: string
  'with-user-token'?: boolean
  'media-library-id'?: string
}

const defaultFlags: FunctionsTestFlags = {
  'timeout': 10, // seconds
  'with-user-token': false,
}

const transformedHelp = transformHelpText(FunctionsTestCommand, 'sanity', 'functions test')

function validateUpdateEventFlags(flags: FunctionsTestFlags): void {
  if (flags.event !== 'update' && flags.e !== 'update') return

  const hasDataPair = flags['data-before'] && flags['data-after']
  const hasFilePair = flags['file-before'] && flags['file-after']
  const hasDocPair = flags['document-id-before'] && flags['document-id-after']

  if (!(hasDataPair || hasFilePair || hasDocPair)) {
    throw new Error(
      'When using --event=update, you must provide one of the following flag pairs:\n' +
        '  --data-before and --data-after\n' +
        '  --file-before and --file-after\n' +
        '  --document-id-before and --document-id-after',
    )
  }
}

const testFunctionsCommand: CliCommandDefinition<FunctionsTestFlags> = {
  name: 'test',
  group: 'functions',
  ...transformedHelp,
  async action(args, context) {
    const {apiClient, output, chalk} = context
    const [name] = args.argsWithoutOptions
    const flags = {...defaultFlags, ...args.extOptions}

    const client = apiClient({
      requireUser: true,
      requireProject: false,
    })
    const {dataset, projectId, token} = client.config()
    const actualDataset = dataset === '~dummy-placeholder-dataset-' ? undefined : dataset

    if (!token) throw new Error('No API token found. Please run `sanity login`.')
    if (!name) throw new Error('You must provide a function name as the first argument')

    const {initBlueprintConfig} = await import('@sanity/runtime-cli/cores')
    const {functionTestCore} = await import('@sanity/runtime-cli/cores/functions')

    const {blueprint} = await import('@sanity/runtime-cli/actions/blueprints')
    const log = logger.Logger(output.print)

    // Prefer projectId in blueprint
    const {projectId: bpProjectId} = await blueprint.readLocalBlueprint(log, {resources: false})
    if (projectId && projectId !== bpProjectId) {
      output.print(
        chalk.yellow('WARNING'),
        `Project ID ${chalk.cyan(projectId)} in ${chalk.green('sanity.cli.ts')} does not match Project ID ${chalk.cyan(bpProjectId)} in ${chalk.green('./sanity/blueprint.config.json')}.`,
      )
      output.print(
        `Defaulting to Project ID ${chalk.cyan(bpProjectId)}. To override use the ${chalk.green('--project-id')} flag.\n`,
      )
    }

    validateUpdateEventFlags(flags)

    const cmdConfig = await initBlueprintConfig({
      bin: 'sanity',
      log,
      token,
    })

    if (!cmdConfig.ok) throw new Error(cmdConfig.error)

    const {success, error} = await functionTestCore({
      ...cmdConfig.value,
      args: {name},
      helpText: transformedHelp.helpText,
      error: createErrorLogger(output),
      flags: {
        'api': flags.a ?? flags.api,
        'data-after': flags['data-after'],
        'data-before': flags['data-before'],
        'data': flags.d ?? flags.data,
        'dataset': flags.dataset || actualDataset,
        'document-id-after': flags['document-id-after'],
        'document-id-before': flags['document-id-before'],
        'document-id': flags['document-id'],
        'event': flags.e ?? flags.event,
        'file-after': flags['file-after'],
        'file-before': flags['file-before'],
        'file': flags.f ?? flags.file,
        'media-library-id': flags['media-library-id'],
        'project-id': flags['project-id'] || bpProjectId,
        'timeout': flags.t ?? flags.timeout,
        'with-user-token': flags['with-user-token'],
      },
    })

    if (!success) throw new Error(error)
  },
}

export default testFunctionsCommand
