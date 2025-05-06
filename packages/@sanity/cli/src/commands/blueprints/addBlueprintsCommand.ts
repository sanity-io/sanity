import {type CliCommandDefinition} from '../../types'

const helpText = `
Arguments
  <type>  Type of Resource to add (currently only 'function' is supported)

Options
  --name <name>                Name of the Resource
  --fn-type <type>             Type of Function Resource to add (e.g. document-publish)
  --fn-lang, --lang <ts|js>    Language of the Function Resource
  --js, --javascript           Use JavaScript for the Function Resource

Examples:
  # Add a Function Resource (TypeScript by default)
  sanity blueprints add function

  # Add a Function Resource with a specific name
  sanity blueprints add function --name my-function

  # Add a Function Resource with a specific type
  sanity blueprints add function --name my-function --fn-type document-publish

  # Add a Function Resource in JavaScript
  sanity blueprints add function --name my-function --fn-type document-publish --js
`

export interface BlueprintsAddFlags {
  'name'?: string
  'fn-type'?: string
  'fn-lang'?: string
  'language'?: string
  'lang'?: string
  'js'?: boolean
  'javascript'?: boolean
}

const defaultFlags: BlueprintsAddFlags = {
  //
}

const addBlueprintsCommand: CliCommandDefinition<BlueprintsAddFlags> = {
  name: 'add',
  group: 'blueprints',
  helpText,
  signature:
    '<type> [--name <name>] [--fn-type <document-publish>] [--fn-lang <ts|js>] [--javascript]',
  description: 'Add a Resource to a Blueprint',
  hideFromHelp: true,

  async action(args, context) {
    const {output} = context
    const flags = {...defaultFlags, ...args.extOptions}

    const [resourceType] = args.argsWithoutOptions

    if (!resourceType) {
      output.error('Resource type is required. Available types: function')
      return
    }

    const {blueprintAddCore} = await import('@sanity/runtime-cli/cores/blueprints')
    const {success, error} = await blueprintAddCore({
      bin: 'sanity',
      log: (msg) => output.print(msg),
      args: {type: resourceType},
      flags: {
        'name': flags.name,
        'fn-type': flags['fn-type'],
        'language': flags['fn-lang'] ?? flags.language ?? flags.lang,
        'javascript': flags.js || flags.javascript,
      },
    })

    if (!success) throw new Error(error)
  },
}

export default addBlueprintsCommand
