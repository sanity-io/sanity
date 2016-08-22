import sanityCheck from '@sanity/check'

export default {
  name: 'check',
  command: 'check [directory]',
  describe: 'Performs a Sanity check',
  handler: ({options}) =>
    sanityCheck({dir: options._[1] || options.rootDir})
}
