import login from '../../actions/login/login'
import {prefixCommand} from '../../util/isNpx'

const commandPrefix = prefixCommand()

const helpText = `
Options
  --sso <slug> Authenticate against a third-party identity provider
  --provider <providerId> Authenticate against a specific provider
  --no-open Do not open a browser window to log in, only print URL

Examples
  # Login against the Sanity.io API
  ${commandPrefix} login

  # Login with SAML SSO
  ${commandPrefix} login --sso org-slug

  # Login with GitHub provider, but do not open a browser window automatically
  ${commandPrefix} login --provider github --no-open
`
export default {
  name: 'login',
  signature: '[--sso <slug>]',
  description:
    'Authenticates against the Sanity.io API (no flag) or a third-party identity provider (with --sso flag)',
  helpText,
  action: login,
}
