import printDebugInfo from './printDebugInfo'

const help = `
Gathers information on user and local/global Sanity environment, to help
debugging Sanity-related issues. Pass --secrets to include API keys in output.`

export default {
  name: 'debug',
  signature: '[--secrets]',
  description: 'Gathers information on Sanity environment',
  helpText: help,
  action: printDebugInfo
}
