import lazyRequire from '../../util/lazyRequire'

export default {
  name: 'login',
  signature: '',
  description: 'Authenticates against the Sanity.io API',
  action: lazyRequire(require.resolve('../../actions/login/login'))
}
