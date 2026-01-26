import {BlueprintsAddCommand} from '@sanity/runtime-cli'
import {logger} from '@sanity/runtime-cli/utils'

import {type CliCommandDefinition} from '../../types'
import {transformHelpText} from '../../util/runtimeCommandHelp'
import {BlueprintsAddExampleUsed} from './blueprints.telemetry'

export interface BlueprintsAddFlags {
  'example'?: string

  'name'?: string
  'n'?: string

  'fn-type'?: string

  'fn-language'?: string
  'language'?: string
  'lang'?: string

  'javascript'?: boolean
  'js'?: boolean

  'fn-helpers'?: boolean
  'helpers'?: boolean
  'no-fn-helpers'?: boolean

  'fn-installer'?: string
  'installer'?: string

  'install'?: boolean
  'i'?: boolean
}

const defaultFlags: BlueprintsAddFlags = {
  'fn-language': 'ts',
  // 'fn-helpers': true, // ask, for now
}

const addBlueprintsCommand: CliCommandDefinition<BlueprintsAddFlags> = {
  name: 'add',
  group: 'blueprints',
  ...transformHelpText(BlueprintsAddCommand, 'sanity', 'blueprints add'),

  async action(args, context) {
    const {output, apiClient, telemetry} = context
    const {extOptions} = args
    const [resourceType] = args.argsWithoutOptions

    if (extOptions.example) {
      // example is exclusive to 'name', 'fn-type', 'fn-language', 'javascript', 'fn-helpers', 'fn-installer'
      // check before merging default flags
      const conflictingFlags: (keyof BlueprintsAddFlags)[] = [
        'name',
        'n',
        'fn-type',
        'fn-language',
        'language',
        'lang',
        'javascript',
        'js',
        'fn-helpers',
        'helpers',
        'fn-installer',
        'installer',
      ]
      const foundConflict = conflictingFlags.find((key) => extOptions[key])
      if (foundConflict) {
        throw new Error(`--example can't be used with --${foundConflict}`)
      }

      // send telemetry event
      telemetry.log(BlueprintsAddExampleUsed, {
        resourceType,
        example: extOptions.example,
      })
    }

    const flags = {...defaultFlags, ...extOptions}

    const client = apiClient({
      requireUser: true,
      requireProject: false,
    })
    const {token} = client.config()

    if (!token) throw new Error('No API token found. Please run `sanity login`.')

    if (!resourceType) {
      output.error('Resource type is required. Available types: function')
      return
    }

    const {initBlueprintConfig} = await import('@sanity/runtime-cli/cores')
    const {functionAddCore} = await import('@sanity/runtime-cli/cores/functions')

    const cmdConfig = await initBlueprintConfig({
      bin: 'sanity',
      log: logger.Logger(output.print),
      token,
    })

    if (!cmdConfig.ok) throw new Error(cmdConfig.error)

    let userWantsFnHelpers = flags.helpers || flags['fn-helpers']
    if (flags['no-fn-helpers'] === true) userWantsFnHelpers = false // override

    const {success, error} = await functionAddCore({
      ...cmdConfig.value,
      flags: {
        example: flags.example,
        name: flags.n ?? flags.name,
        type: flags['fn-type'],
        language: flags.lang ?? flags.language ?? flags['fn-language'],
        javascript: flags.js || flags.javascript,
        helpers: userWantsFnHelpers,
        installer: flags.installer ?? flags['fn-installer'],
        install: flags.i || flags.install,
      },
    })

    if (!success) throw new Error(error)
  },
}

export default addBlueprintsCommand
