import authenticate from '../../actions/auth/authenticate'

export default {
  name: 'auth',
  command: 'auth',
  describe: 'Authenticates against the Sanity.io API',
  handler: authenticate
}
