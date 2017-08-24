import lazyRequire from '@sanity/util/lib/lazyRequire'

export default {
  name: 'exec',
  signature: 'SCRIPT',
  description: 'Runs a script in Sanity context',
  action: lazyRequire(require.resolve('../../actions/exec/execScript'))
}
