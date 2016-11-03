import sanityCheck from '@sanity/check'

export default {
  name: 'check',
  signature: '[DIRECTORY]',
  description: 'Performs a Sanity check',
  action: (args, context) => sanityCheck({
    dir: args.argsWithoutOptions[0] || context.workDir
  })
}
