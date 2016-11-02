import lazyRequire from '@sanity/util/lib/lazyRequire'

export default {
  name: 'init',
  signature: 'init [plugin]',
  description: 'Initialize a new Sanity project',
  action: lazyRequire(require.resolve('./initAction'))
}
