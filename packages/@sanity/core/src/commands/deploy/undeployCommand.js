import lazyRequire from '@sanity/util/lib/lazyRequire'

const helpText = `
Examples
  sanity undeploy
`

export default {
  name: 'undeploy',
  signature: '',
  description: 'Removes the deployed studio from <hostname>.sanity.studio',
  action: lazyRequire(require.resolve('../../actions/deploy/undeployAction')),
  helpText,
}
