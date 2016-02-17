import promiseProps from 'promise-props-recursive'
import getLocalVersion from '../../npm-bridge/getLocalVersion'
import getGlobalSanityCliVersion from '../../util/getGlobalSanityCliVersion'
import pkg from '../../../package.json'

export default {
  name: 'version',
  signature: 'version',
  description: 'Shows the installed versions of core Sanity components',
  action: ({print}) =>
    promiseProps({
      local: getLocalVersion(pkg.name),
      global: getGlobalSanityCliVersion()
    }).then(versions => {
      if (versions.global) {
        print(`${pkg.name} (global): ${versions.global}`)
      }

      if (versions.local) {
        print(`${pkg.name} (local): ${versions.local}`)
      }
    })
}
