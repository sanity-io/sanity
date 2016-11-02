import lazyRequire from '../../util/lazyRequire'

export default {
  name: 'auth',
  signature: 'auth',
  description: 'Authenticates against the Sanity.io API',
  action: lazyRequire('../../actions/auth/authenticate')
}
