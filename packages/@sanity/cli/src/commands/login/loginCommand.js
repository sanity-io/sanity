import login from '../../actions/login/login'
import {prefixCommand} from '../../util/isNpx'

const commandPrefix = prefixCommand()

const helpText = `
Options
  --sso <slug> Authenticate against a third-party identity provider

Examples
  # Login against the Sanity.io API
  ${commandPrefix} login

  # Login with SAML SSO
  ${commandPrefix} login --sso org-slug
`
export default {
  name: 'login',
  signature: '[--sso <slug>]',
  description:
    'Authenticates against the Sanity.io API (no flag) or a third-party identity provider (with --sso flag)',
  helpText,
  action: login,
}
