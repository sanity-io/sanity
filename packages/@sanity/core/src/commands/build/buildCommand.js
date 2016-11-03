import lazyRequire from '@sanity/util/lib/lazyRequire'

export default {
  name: 'build',
  signature: '[OUTPUT_DIR]',
  description: 'Builds the current Sanity configuration to a static bundle',
  action: lazyRequire(require.resolve('../../actions/build/buildStaticAssets'))
}
