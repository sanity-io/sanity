import lazyRequire from '@sanity/util/lib/lazyRequire'

export default {
  name: 'start',
  signature: '',
  description: 'Starts a webserver that serves Sanity',
  action: lazyRequire(require.resolve('../../actions/start/startAction'))
}
