import {getCliUpgradeCommand} from './getUpgradeCommand'
import {uninstallPackages} from './uninstallPackages'
import {installNewPackages, installDeclaredPackages} from './installPackages'
import {getPackageManagerChoice} from './packageManagerChoice'
import {getInstallCommand} from './getInstallCommand'
import {getYarnStub} from './yarnStub'

// Exported for internal CLI usage
export {
  getYarnStub,
  getCliUpgradeCommand,
  getInstallCommand,
  getPackageManagerChoice,
  installDeclaredPackages,
  installNewPackages,
  uninstallPackages,
}

// Exported for use in `sanity` (formerly `@sanity/core`)

/**
 * @internal
 */
export const cliPackageManager = {
  getInstallCommand,
  getPackageManagerChoice,
  installNewPackages,
}

/**
 * @internal
 */
export type CliPackageManager = typeof cliPackageManager
