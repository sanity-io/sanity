import {type CliCommandDefinition} from '../../types'
import {BlueprintsAddExampleUsed} from './blueprints.telemetry'

const helpText = `
Arguments
  <type>  Type of Resource to add (currently only 'function' is supported)

Options
  --name, -n <name>              Name of the Resource
  --fn-type <type>               Type of Function to add. Available options: "document-create", "document-delete", "document-update", "document-publish". Default: "document-publish"
  --fn-language, --lang <ts|js>  Language of the Function. Default: "ts"
  --js, --javascript             Shortcut for --fn-language=js
  --fn-helpers, --helpers        Add helpers to the Function
  --no-fn-helpers                Do not add helpers to the Function
  --fn-installer,                Package manager to use for Function helpers
    --installer <npm|pnpm|yarn>    sets --fn-helpers to true
  --install, -i                  Shortcut for --fn-installer=npm

Examples:
  # Add a Function (TypeScript by default)
  sanity blueprints add function

  # Add a Function with a specific name and install helpers with npm
  sanity blueprints add function --name my-function -i --helpers

  # Add a Function with a specific type
  sanity blueprints add function --fn-type document-create

  # Add a Function using an example
  sanity blueprints add function --example example-name

  # Add a JavaScript Function
  sanity blueprints add function --js

  # Add a Function without helpers
  sanity blueprints add function --no-fn-helpers

  # Add a document-publish .js Function with helpers and install with npm
  sanity blueprints add function -n roboto --fn-type document-publish --js -i
`

export interface BlueprintsAddFlags {
  'example'?: string

  'name'?: string
  'n'?: string

  'fn-type'?: string

  'fn-language'?: string
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
  helpText,
  signature:
    '<type> [--name <name>] [--fn-type <document-create|document-delete|document-update|document-publish>] [--fn-lang <ts|js>] [--javascript]',
  description: 'Add a Resource to a Blueprint',

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
      log: (message) => output.print(message),
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
        language: flags.lang ?? flags['fn-language'],
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
