import {login} from '../../actions/login/login'
import {CliCommandDefinition} from '../../types'

const helpText = `
Options
  --sso <slug> Log in using Single Sign On, using the given slug

Examples
  # Log in using default settings
  sanity login

  # Log in using Single Sign-On with the "my-organization" slug
  sanity login --sso my-organization
`

const loginCommand: CliCommandDefinition = {
  name: 'login',
  signature: '',
  helpText,
  description: 'Authenticates against the Sanity.io API',
  action: login,
}

export default loginCommand
