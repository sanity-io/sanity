import lazyRequire from '@sanity/util/lib/lazyRequire'

const help = `
Gathers information on user and local/global Sanity environment, to help
debugging Sanity-related issues. Pass --full to include API keys in output.`

export default {
  name: 'debug',
  signature: '[--full]',
  description: 'Gathers information on Sanity environment',
  helpText: help,
  action: lazyRequire(require.resolve('./printDebugInfo'))
}
