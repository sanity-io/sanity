import lazyRequire from '@sanity/util/lib/lazyRequire'

export default {
  name: 'deploy',
  signature: '[SOURCE_DIR]',
  description: 'Deploys a statically built Sanity studio',
  action: lazyRequire(require.resolve('../../actions/deploy/deployAction'))
}
