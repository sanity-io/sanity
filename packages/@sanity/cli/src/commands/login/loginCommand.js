import login from '../../actions/login/login'

const helpText = `
Options
  --sso <slug> Authenticate against a third-party identity provider

Examples
  # Login against the Sanity.io API
  sanity login

  # Login with SAML SSO
  sanity login --sso org-slug
`
export default {
  name: 'login',
  signature: '[--sso <slug>]',
  description:
    'Authenticates against the Sanity.io API (no flag) or a third-party identity provider (with --sso flag)',
  helpText,
  action: login,
}
