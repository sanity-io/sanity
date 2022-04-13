import login from '../../actions/login/login'

const helpText = `
Options
  --sso Authenticate against a third-party identity provider

Examples
  # Login with SAML SSO
  sanity login sso <slug>
`
export default {
  name: 'login',
  signature: '',
  description: 'Authenticates against the Sanity.io API or a third-party identity provider',
  helpText,
  action: login,
}
