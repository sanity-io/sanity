import {prefixCommand} from '../../util/isNpx'
import printDebugInfo from './printDebugInfo'

const commandPrefix = prefixCommand()

const help = `
Used to find information about the Sanity environment, and to debug Sanity-related issues.

Options
  --secrets Include API keys in output

Examples
  # Show information about the user, project, and local/global Sanity environment
  ${commandPrefix} debug

  # Include API keys in the output
  ${commandPrefix} debug --secrets
`

export default {
  name: 'debug',
  signature: '[--secrets]',
  description: 'Gathers information on Sanity environment',
  helpText: help,
  action: printDebugInfo,
}
