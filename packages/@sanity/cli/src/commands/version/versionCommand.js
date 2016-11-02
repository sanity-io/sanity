import promiseProps from 'promise-props-recursive'
import getLocalVersion from '../../npm-bridge/getLocalVersion'
import getGlobalSanityCliVersion from '../../util/getGlobalSanityCliVersion'
import pkg from '../../../package.json'

export default {
  name: 'version',
  command: 'version',
  description: 'Shows the installed versions of core Sanity components',
  action: ({output}) =>
    promiseProps({
      local: getLocalVersion(pkg.name),
      global: getGlobalSanityCliVersion()
    }).then(versions => {
      if (versions.global) {
        output.print(`${pkg.name} (global): ${versions.global}`)
      }

      if (versions.local) {
        output.print(`${pkg.name} (local): ${versions.local}`)
      }
    })
}
