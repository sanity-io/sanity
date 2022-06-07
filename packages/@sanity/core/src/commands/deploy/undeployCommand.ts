import type {CliCommandDefinition} from '@sanity/cli'
import {lazyRequire} from '../../util/lazyRequire'

const helpText = `
Examples
  sanity undeploy
`

const undeployCommand: CliCommandDefinition = {
  name: 'undeploy',
  signature: '',
  description: 'Removes the deployed studio from <hostname>.sanity.studio',
  action: lazyRequire(require.resolve('../../actions/deploy/undeployAction')),
  helpText,
}

export default undeployCommand
