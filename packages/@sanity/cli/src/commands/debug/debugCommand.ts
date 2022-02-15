import type {CliCommandDefinition} from '../../types'
import {printDebugInfo} from './printDebugInfo'

const help = `
Used to find information about the Sanity environment, and to debug Sanity-related issues.

Options
  --secrets Include API keys in output

Examples
  # Show information about the user, project, and local/global Sanity environment
  sanity debug

  # Include API keys in the output
  sanity debug --secrets
`

const debugCommand: CliCommandDefinition = {
  name: 'debug',
  signature: '[--secrets]',
  description: 'Gathers information on Sanity environment',
  helpText: help,
  action: printDebugInfo,
}

export default debugCommand
