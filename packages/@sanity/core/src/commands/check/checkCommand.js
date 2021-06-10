import lazyRequire from '@sanity/util/lib/lazyRequire'

const validateSchema = lazyRequire(require.resolve('../../actions/check/validateSchema'))

const helpText = `
Options
  --strict Treat warnings as errors (command fails on warnings and errors)

Examples
  sanity check
  sanity check --strict
`

export default {
  name: 'check',
  signature: '',
  description: 'Validate configured schema',
  action: (args, context) => {
    const flags = args.extOptions

    // Print a newline to ensure some spacing between problems and side-effects from
    // loading schema (naive errors printed to console and similar)
    context.output.print('')

    const schemaIsValid = validateSchema(flags, context)

    if (!schemaIsValid) {
      // eslint-disable-next-line no-process-exit
      process.exit(1)
    }
  },
  helpText,
}
