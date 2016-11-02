import lazyRequire from '../../util/lazyRequire'

export default {
  name: 'auth',
  signature: '',
  description: 'Authenticates against the Sanity.io API',
  action: lazyRequire(require.resolve('../../actions/auth/authenticate'))
}
