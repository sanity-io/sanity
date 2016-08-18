import sanityCheck from '@sanity/check'

export default {
  name: 'check',
  signature: 'check [directory]',
  description: 'Performs a Sanity check',
  action: ({options}) =>
    sanityCheck({dir: options._[1] || options.rootDir})
}
