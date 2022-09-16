import {login} from '../../actions/login/login'
import type {CliCommandDefinition} from '../../types'

const helpText = `
Options
  --sso <slug> Log in using Single Sign On, using the given slug
  --provider <providerId> Authenticate against a specific provider
  --no-open Do not open a browser window to log in, only print URL

Examples
  # Log in using default settings
  sanity login

  # Log in using Single Sign-On with the "my-organization" slug
  sanity login --sso my-organization

  # Login with GitHub provider, but do not open a browser window automatically
  sanity login --provider github --no-open
`

const loginCommand: CliCommandDefinition = {
  name: 'login',
  signature: '[--sso <slug>] [--provider <providerId>] [--no-open]',
  helpText,
  description: 'Authenticates against the Sanity.io API',
  action: login,
}

export default loginCommand
